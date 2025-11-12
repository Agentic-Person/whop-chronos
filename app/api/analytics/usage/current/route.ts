/**
 * Current Usage API
 *
 * GET /api/analytics/usage/current - Get real-time usage metrics including API costs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';
import type { SubscriptionTier } from '@/components/analytics/usage-types';

interface UsageData {
  lastUpdated: string;
  currentPeriod: {
    month: number;
    year: number;
    daysInMonth: number;
    daysElapsed: number;
  };
  anthropic: {
    apiCalls: number;
    inputTokens: number;
    outputTokens: number;
    totalCost: number;
    avgCostPerSession: number;
    avgCostPerMessage: number;
    tierLimit: number;
    usagePercentage: number;
  };
  openai: {
    embeddingsCreated: number;
    transcriptsProcessed: number;
    chunksVectorized: number;
    tokensProcessed: number;
    totalCost: number;
    avgCostPerVideo: number;
    avgCostPerThousandChunks: number;
  };
  supabase: {
    storageGB: number;
    limitGB: number;
    percentage: number;
    videoCount: number;
    avgVideoSizeMB: number;
    databaseSizeMB: number;
    vectorDbEmbeddings: number;
    vectorDbStorageMB: number;
    estimatedCost: number;
  };
  tierLimits: Array<{
    resource: string;
    used: string;
    limit: string;
    percentage: number;
    status: string;
  }>;
  totalMonthlyCost: number;
  costDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return NextResponse.json(
        { error: 'creatorId is required' },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Get creator and tier
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('subscription_tier')
      .eq('id', creatorId)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 },
      );
    }

    const tier = creator.subscription_tier as SubscriptionTier;

    // Get current month's date range
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const firstOfMonth = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysElapsed = now.getDate();

    // Call the Supabase function to get monthly usage summary
    const { data: monthlyUsage, error: usageError } = await supabase.rpc(
      'get_monthly_usage_summary',
      {
        p_creator_id: creatorId,
        p_year: year,
        p_month: month,
      },
    );

    if (usageError) {
      console.error('Error fetching monthly usage:', usageError);
    }

    // Safely extract usage data
    const usageRow = monthlyUsage?.[0] || {
      total_storage_bytes: 0,
      total_videos_uploaded: 0,
      total_video_duration_seconds: 0,
      total_ai_credits_used: 0,
      total_transcription_minutes: 0,
      total_chat_messages: 0,
      peak_active_students: 0,
      total_cost: 0,
    };

    // Get video storage details
    const { data: videos } = await supabase
      .from('videos')
      .select('id, file_size_bytes')
      .eq('creator_id', creatorId)
      .eq('is_deleted', false);

    const videoCount = videos?.length || 0;
    const totalStorageBytes = videos?.reduce((sum, v) => sum + (v.file_size_bytes || 0), 0) || 0;
    const totalStorageGB = totalStorageBytes / (1024 * 1024 * 1024);
    const avgVideoSizeMB = videoCount > 0 ? (totalStorageBytes / videoCount) / (1024 * 1024) : 0;

    // Get chat message statistics
    const { data: chatMessages } = await supabase
      .from('chat_messages')
      .select('id, token_count, role, session:chat_sessions!inner(creator_id)')
      .eq('session.creator_id', creatorId)
      .gte('created_at', firstOfMonth.toISOString());

    const totalChatMessages = chatMessages?.length || 0;
    const aiMessages = chatMessages?.filter((m) => m.role === 'assistant') || [];
    const apiCalls = aiMessages.length;

    // Calculate token counts from metadata
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    aiMessages.forEach((msg) => {
      if (msg.token_count) {
        // Rough estimate: 75% of tokens are output for AI responses
        totalOutputTokens += Math.floor(msg.token_count * 0.75);
        totalInputTokens += Math.floor(msg.token_count * 0.25);
      }
    });

    // Calculate costs using Claude Haiku 4.5 pricing
    // Input: $0.25 per 1M tokens, Output: $1.25 per 1M tokens
    const inputCost = (totalInputTokens / 1000000) * 0.25;
    const outputCost = (totalOutputTokens / 1000000) * 1.25;
    const anthropicCost = inputCost + outputCost;

    // Get video chunk embeddings count
    const { data: chunks } = await supabase
      .from('video_chunks')
      .select('id, video:videos!inner(creator_id)')
      .eq('video.creator_id', creatorId);

    const embeddingsCount = chunks?.length || 0;

    // Calculate OpenAI costs
    // Whisper transcription: ~$0.006 per minute
    // Ada-002 embeddings: $0.0001 per 1K tokens
    const transcriptionMinutes = usageRow.total_transcription_minutes || 0;
    const transcriptionCost = transcriptionMinutes * 0.006;

    // Estimate ~750 tokens per embedding (average chunk size)
    const embeddingTokens = embeddingsCount * 750;
    const embeddingCost = (embeddingTokens / 1000) * 0.0001;
    const openaiCost = transcriptionCost + embeddingCost;

    // Supabase estimated cost
    // Storage: ~$0.021 per GB/month
    // Database: base $25/month included in tier
    const supabaseCost = totalStorageGB * 0.021;

    // Get tier limits
    const tierLimits = getTierLimits(tier);
    const storageLimit = tierLimits.storage_gb;
    const aiLimit = tierLimits.ai_messages_per_month;

    // Get active students
    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('creator_id', creatorId)
      .eq('is_active', true);

    const studentCount = students?.length || 0;

    // Build response
    const usageData: UsageData = {
      lastUpdated: new Date().toISOString(),
      currentPeriod: {
        month,
        year,
        daysInMonth,
        daysElapsed,
      },
      anthropic: {
        apiCalls,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        totalCost: anthropicCost,
        avgCostPerSession: apiCalls > 0 ? anthropicCost / apiCalls : 0,
        avgCostPerMessage: totalChatMessages > 0 ? anthropicCost / totalChatMessages : 0,
        tierLimit: aiLimit,
        usagePercentage: aiLimit > 0 ? (apiCalls / aiLimit) * 100 : 0,
      },
      openai: {
        embeddingsCreated: embeddingsCount,
        transcriptsProcessed: usageRow.total_videos_uploaded || 0,
        chunksVectorized: embeddingsCount,
        tokensProcessed: embeddingTokens,
        totalCost: openaiCost,
        avgCostPerVideo: usageRow.total_videos_uploaded > 0 ? openaiCost / usageRow.total_videos_uploaded : 0,
        avgCostPerThousandChunks: embeddingsCount > 0 ? (openaiCost / embeddingsCount) * 1000 : 0,
      },
      supabase: {
        storageGB: totalStorageGB,
        limitGB: storageLimit,
        percentage: storageLimit > 0 ? (totalStorageGB / storageLimit) * 100 : 0,
        videoCount,
        avgVideoSizeMB,
        databaseSizeMB: 0, // Would need Supabase admin API
        vectorDbEmbeddings: embeddingsCount,
        vectorDbStorageMB: (embeddingsCount * 1536 * 4) / (1024 * 1024), // 1536 dims * 4 bytes per float
        estimatedCost: supabaseCost,
      },
      tierLimits: [
        {
          resource: 'Storage',
          used: `${totalStorageGB.toFixed(2)} GB`,
          limit: `${storageLimit} GB`,
          percentage: storageLimit > 0 ? (totalStorageGB / storageLimit) * 100 : 0,
          status: getStatus(storageLimit > 0 ? (totalStorageGB / storageLimit) * 100 : 0),
        },
        {
          resource: 'AI Credits',
          used: apiCalls.toLocaleString(),
          limit: aiLimit.toLocaleString(),
          percentage: aiLimit > 0 ? (apiCalls / aiLimit) * 100 : 0,
          status: getStatus(aiLimit > 0 ? (apiCalls / aiLimit) * 100 : 0),
        },
        {
          resource: 'Videos',
          used: videoCount.toString(),
          limit: tierLimits.videos === -1 ? 'Unlimited' : tierLimits.videos.toString(),
          percentage: tierLimits.videos > 0 ? (videoCount / tierLimits.videos) * 100 : 0,
          status: getStatus(tierLimits.videos > 0 ? (videoCount / tierLimits.videos) * 100 : 0),
        },
        {
          resource: 'Students',
          used: studentCount.toString(),
          limit: tierLimits.students === -1 ? 'Unlimited' : tierLimits.students.toString(),
          percentage: tierLimits.students > 0 ? (studentCount / tierLimits.students) * 100 : 0,
          status: getStatus(tierLimits.students > 0 ? (studentCount / tierLimits.students) * 100 : 0),
        },
      ],
      totalMonthlyCost: anthropicCost + openaiCost + supabaseCost,
      costDistribution: [
        { name: 'Anthropic AI', value: anthropicCost, color: '#3b82f6' },
        { name: 'OpenAI Embeddings', value: openaiCost, color: '#10b981' },
        { name: 'Supabase', value: supabaseCost, color: '#8b5cf6' },
      ],
    };

    return NextResponse.json(usageData);
  } catch (error) {
    console.error('Error fetching current usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

function getTierLimits(tier: SubscriptionTier) {
  const limits = {
    free: {
      storage_gb: 1,
      ai_messages_per_month: 100,
      videos: 3,
      students: 10,
    },
    basic: {
      storage_gb: 10,
      ai_messages_per_month: 1000,
      videos: 15,
      students: 50,
    },
    pro: {
      storage_gb: 100,
      ai_messages_per_month: 10000,
      videos: 100,
      students: 500,
    },
    enterprise: {
      storage_gb: 500,
      ai_messages_per_month: -1, // Unlimited
      videos: -1,
      students: -1,
    },
  };

  return limits[tier] || limits.basic;
}

function getStatus(percentage: number): string {
  if (percentage < 50) return 'good';
  if (percentage < 75) return 'warning';
  if (percentage < 90) return 'high';
  return 'critical';
}
