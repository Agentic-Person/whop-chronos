/**
 * Operation Breakdown API
 *
 * GET /api/analytics/usage/operations - Get detailed cost breakdown by operation type
 *
 * Returns detailed breakdown for:
 * - Transcription (Whisper costs)
 * - Embeddings (OpenAI Ada-002 costs)
 * - Storage (Supabase storage costs)
 * - Chat (Claude Haiku costs)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

// Pricing constants
const PRICING = {
  WHISPER_PER_MINUTE: 0.006,
  EMBEDDINGS_PER_1K_TOKENS: 0.0001,
  CLAUDE_HAIKU_INPUT_PER_1M_TOKENS: 0.25,
  CLAUDE_HAIKU_OUTPUT_PER_1M_TOKENS: 1.25,
  STORAGE_PER_GB_PER_MONTH: 0.021,
} as const;

interface VideoDetail {
  video_id: string;
  video_title: string;
  duration_minutes?: number;
  tokens?: number;
  size_gb?: number;
  cost: number;
  created_at: string;
}

interface SessionDetail {
  session_id: string;
  video_title?: string;
  input_tokens: number;
  output_tokens: number;
  cost: number;
  created_at: string;
}

interface OperationBreakdownData {
  transcription: {
    total_cost: number;
    total_minutes: number;
    videos: VideoDetail[];
  };
  embeddings: {
    total_cost: number;
    total_tokens: number;
    videos: VideoDetail[];
  };
  storage: {
    total_cost: number;
    total_gb: number;
    monthly_fee: number;
    videos: VideoDetail[];
  };
  chat: {
    total_cost: number;
    total_sessions: number;
    sessions: SessionDetail[];
  };
  summary: {
    total_cost: number;
    by_operation: {
      transcription_percent: number;
      embeddings_percent: number;
      storage_percent: number;
      chat_percent: number;
    };
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const creatorId = searchParams.get('creatorId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!creatorId) {
      return NextResponse.json(
        { error: 'creatorId is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Build date filters
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(endDate) : now;

    // 1. TRANSCRIPTION COSTS (from videos with source_type = 'upload')
    const { data: uploadedVideos } = await supabase
      .from('videos')
      .select('id, title, duration_seconds, created_at')
      .eq('creator_id', creatorId)
      .eq('source_type', 'upload')
      .eq('is_deleted', false)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false });

    const transcriptionVideos: VideoDetail[] = (uploadedVideos || []).map((v: any) => {
      const durationMinutes = (v.duration_seconds || 0) / 60;
      const cost = durationMinutes * PRICING.WHISPER_PER_MINUTE;
      return {
        video_id: v.id,
        video_title: v.title,
        duration_minutes: Number(durationMinutes.toFixed(2)),
        cost: Number(cost.toFixed(4)),
        created_at: v.created_at,
      };
    });

    const totalTranscriptionMinutes = transcriptionVideos.reduce((sum, v) => sum + (v.duration_minutes || 0), 0);
    const totalTranscriptionCost = transcriptionVideos.reduce((sum, v) => sum + v.cost, 0);

    // 2. EMBEDDINGS COSTS (from video_chunks)
    const { data: videoChunks } = await supabase
      .from('video_chunks')
      .select('video_id, chunk_index, video:videos(id, title, creator_id, created_at)')
      .eq('video.creator_id', creatorId)
      .gte('video.created_at', start.toISOString())
      .lte('video.created_at', end.toISOString());

    // Group chunks by video and estimate tokens
    const videoEmbeddingsMap = new Map<string, { title: string; chunks: number; created_at: string }>();

    for (const chunk of videoChunks || []) {
      const video = (chunk as any).video;
      if (!video) continue;

      const videoId = video.id;
      if (!videoEmbeddingsMap.has(videoId)) {
        videoEmbeddingsMap.set(videoId, {
          title: video.title,
          chunks: 0,
          created_at: video.created_at,
        });
      }
      videoEmbeddingsMap.get(videoId)!.chunks++;
    }

    const embeddingVideos: VideoDetail[] = Array.from(videoEmbeddingsMap.entries()).map(([videoId, data]) => {
      // Estimate ~750 tokens per chunk (average)
      const tokens = data.chunks * 750;
      const cost = (tokens / 1000) * PRICING.EMBEDDINGS_PER_1K_TOKENS;
      return {
        video_id: videoId,
        video_title: data.title,
        tokens,
        cost: Number(cost.toFixed(6)),
        created_at: data.created_at,
      };
    });

    const totalEmbeddingTokens = embeddingVideos.reduce((sum, v) => sum + (v.tokens || 0), 0);
    const totalEmbeddingCost = embeddingVideos.reduce((sum, v) => sum + v.cost, 0);

    // 3. STORAGE COSTS (current storage usage)
    const { data: allVideos } = await supabase
      .from('videos')
      .select('id, title, file_size_bytes, created_at')
      .eq('creator_id', creatorId)
      .eq('is_deleted', false);

    const storageVideos: VideoDetail[] = (allVideos || []).map((v: any) => {
      const sizeGb = (v.file_size_bytes || 0) / (1024 * 1024 * 1024);
      const monthlyCost = sizeGb * PRICING.STORAGE_PER_GB_PER_MONTH;
      return {
        video_id: v.id,
        video_title: v.title,
        size_gb: Number(sizeGb.toFixed(4)),
        cost: Number(monthlyCost.toFixed(6)),
        created_at: v.created_at,
      };
    });

    const totalStorageGb = storageVideos.reduce((sum, v) => sum + (v.size_gb || 0), 0);
    const totalStorageCost = storageVideos.reduce((sum, v) => sum + v.cost, 0);

    // 4. CHAT COSTS (from chat_messages)
    const { data: chatSessions } = await supabase
      .from('chat_sessions')
      .select(`
        id,
        created_at,
        messages:chat_messages(
          id,
          role,
          token_count,
          created_at
        )
      `)
      .eq('creator_id', creatorId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false });

    const chatSessionsDetails: SessionDetail[] = (chatSessions || []).map((session: any) => {
      let inputTokens = 0;
      let outputTokens = 0;

      // Calculate tokens from messages
      (session.messages || []).forEach((msg: any) => {
        if (msg.role === 'assistant') {
          // 75% output, 25% input (rough estimate)
          outputTokens += Math.floor((msg.token_count || 0) * 0.75);
          inputTokens += Math.floor((msg.token_count || 0) * 0.25);
        }
      });

      const inputCost = (inputTokens / 1_000_000) * PRICING.CLAUDE_HAIKU_INPUT_PER_1M_TOKENS;
      const outputCost = (outputTokens / 1_000_000) * PRICING.CLAUDE_HAIKU_OUTPUT_PER_1M_TOKENS;
      const cost = inputCost + outputCost;

      return {
        session_id: session.id,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost: Number(cost.toFixed(6)),
        created_at: session.created_at,
      };
    });

    const totalChatCost = chatSessionsDetails.reduce((sum, s) => sum + s.cost, 0);

    // 5. SUMMARY
    const totalCost = totalTranscriptionCost + totalEmbeddingCost + totalStorageCost + totalChatCost;

    const response: OperationBreakdownData = {
      transcription: {
        total_cost: Number(totalTranscriptionCost.toFixed(4)),
        total_minutes: Number(totalTranscriptionMinutes.toFixed(2)),
        videos: transcriptionVideos.sort((a, b) => b.cost - a.cost).slice(0, 50), // Top 50
      },
      embeddings: {
        total_cost: Number(totalEmbeddingCost.toFixed(6)),
        total_tokens: totalEmbeddingTokens,
        videos: embeddingVideos.sort((a, b) => b.cost - a.cost).slice(0, 50),
      },
      storage: {
        total_cost: Number(totalStorageCost.toFixed(4)),
        total_gb: Number(totalStorageGb.toFixed(4)),
        monthly_fee: Number(totalStorageCost.toFixed(4)),
        videos: storageVideos.sort((a, b) => b.cost - a.cost).slice(0, 50),
      },
      chat: {
        total_cost: Number(totalChatCost.toFixed(4)),
        total_sessions: chatSessionsDetails.length,
        sessions: chatSessionsDetails.sort((a, b) => b.cost - a.cost).slice(0, 50),
      },
      summary: {
        total_cost: Number(totalCost.toFixed(4)),
        by_operation: {
          transcription_percent: totalCost > 0 ? Number(((totalTranscriptionCost / totalCost) * 100).toFixed(2)) : 0,
          embeddings_percent: totalCost > 0 ? Number(((totalEmbeddingCost / totalCost) * 100).toFixed(2)) : 0,
          storage_percent: totalCost > 0 ? Number(((totalStorageCost / totalCost) * 100).toFixed(2)) : 0,
          chat_percent: totalCost > 0 ? Number(((totalChatCost / totalCost) * 100).toFixed(2)) : 0,
        },
      },
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching operation breakdown:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
