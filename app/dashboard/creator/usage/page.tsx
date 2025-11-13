'use client';

import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

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

function getStatusColor(percentage: number) {
  if (percentage < 50) return 'text-green-11';
  if (percentage < 75) return 'text-yellow-11';
  if (percentage < 90) return 'text-orange-11';
  return 'text-red-11';
}

function getStatusBadgeColor(percentage: number) {
  if (percentage < 50) return 'bg-green-a3 text-green-11';
  if (percentage < 75) return 'bg-yellow-a3 text-yellow-11';
  if (percentage < 90) return 'bg-orange-a3 text-orange-11';
  return 'bg-red-a3 text-red-11';
}

function getStatusEmoji(percentage: number) {
  if (percentage < 50) return '🟢';
  if (percentage < 75) return '🟡';
  if (percentage < 90) return '🟠';
  return '🔴';
}

// Circular progress gauge component
function CircularGauge({ percentage, size = 120, strokeWidth = 12 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  let strokeColor = '#10b981'; // green
  if (percentage >= 90) strokeColor = '#ef4444'; // red
  else if (percentage >= 75) strokeColor = '#f59e0b'; // orange
  else if (percentage >= 50) strokeColor = '#eab308'; // yellow

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-a6"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-12">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
}

export default function UsagePage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hard-coded creator ID for testing - replace with auth context in production
  const CREATOR_ID = 'e5f9d8c7-4b3a-4e2d-9f1a-8c7b6a5d4e3f';

  const fetchUsageData = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/analytics/usage/current?creatorId=${CREATOR_ID}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch usage data: ${response.statusText}`);
      }

      const data = await response.json();
      setUsageData(data);
    } catch (err) {
      console.error('Error fetching usage data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load usage data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsageData();

    // Auto-refresh every 10 seconds for live cost tracking
    const interval = setInterval(() => {
      fetchUsageData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchUsageData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-9 mx-auto mb-4"></div>
          <p className="text-gray-11">Loading usage data...</p>
        </div>
      </div>
    );
  }

  if (error || !usageData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-11 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-12 mb-2">Failed to Load Usage Data</h2>
          <p className="text-gray-11 mb-4">{error || 'Unknown error occurred'}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-9 text-white rounded-lg hover:bg-blue-10 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalMonthlyCost = usageData.totalMonthlyCost;
  const lastUpdatedTime = new Date(usageData.lastUpdated).toLocaleTimeString();

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-7 font-bold text-gray-12">Usage & Billing</h1>
          <p className="text-3 text-gray-11 mt-1">
            Monitor your API usage, costs, and optimize spending
          </p>
          <p className="text-xs text-gray-10 mt-2">
            Last updated: {lastUpdatedTime} • Auto-refreshes every 10 seconds
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-4 py-2 bg-blue-9 text-white rounded-lg hover:bg-blue-10 transition-colors disabled:opacity-50 text-sm"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
        </button>
      </div>

      {/* Total Cost Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-a2 rounded-lg p-6 border border-gray-a6">
          <div className="text-sm text-gray-11 mb-1">Total This Month</div>
          <div className="text-4xl font-bold text-gray-12">${totalMonthlyCost.toFixed(2)}</div>
          <div className="text-xs text-gray-11 mt-1">
            Day {usageData.currentPeriod.daysElapsed} of {usageData.currentPeriod.daysInMonth}
          </div>
        </div>
        <div className="bg-gray-a2 rounded-lg p-6 border border-gray-a6">
          <div className="text-sm text-gray-11 mb-1">Anthropic AI</div>
          <div className="text-4xl font-bold text-blue-11">${usageData.anthropic.totalCost.toFixed(2)}</div>
          <div className="text-xs text-gray-11 mt-1">Claude Haiku 4.5</div>
        </div>
        <div className="bg-gray-a2 rounded-lg p-6 border border-gray-a6">
          <div className="text-sm text-gray-11 mb-1">OpenAI</div>
          <div className="text-4xl font-bold text-green-11">${usageData.openai.totalCost.toFixed(2)}</div>
          <div className="text-xs text-gray-11 mt-1">Whisper + Ada-002</div>
        </div>
        <div className="bg-gray-a2 rounded-lg p-6 border border-gray-a6">
          <div className="text-sm text-gray-11 mb-1">Supabase</div>
          <div className="text-4xl font-bold text-purple-11">${usageData.supabase.estimatedCost.toFixed(2)}</div>
          <div className="text-xs text-gray-11 mt-1">Storage & DB</div>
        </div>
      </div>

      {/* Cost Distribution Chart */}
      <div className="bg-gray-a2 rounded-lg p-6 border border-gray-a6">
        <h2 className="text-5 font-semibold text-gray-12 mb-4">Cost Distribution</h2>
        {totalMonthlyCost > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={usageData.costDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {usageData.costDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toFixed(4)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-11 mb-2">No usage data yet</p>
              <p className="text-sm text-gray-10">Start using AI chat and uploading videos to see cost breakdown</p>
            </div>
          </div>
        )}
      </div>

      {/* Section 1: Anthropic (Claude Haiku 4.5) */}
      <div className="bg-gray-a2 rounded-lg p-6 border border-gray-a6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-5 font-semibold text-gray-12">AI Chat API Usage (Anthropic)</h2>
          <span className="px-3 py-1 bg-blue-a3 text-blue-11 rounded-lg text-sm font-medium">
            Claude Haiku 4.5
          </span>
        </div>

        {/* Current Period Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="text-center">
            <CircularGauge percentage={usageData.anthropic.usagePercentage} />
            <div className="mt-2 text-sm text-gray-11">Usage vs. Limit</div>
            <div className="text-xs text-gray-11 mt-1">
              {usageData.anthropic.apiCalls.toLocaleString()} / {usageData.anthropic.tierLimit.toLocaleString()} calls
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-11 mb-1">API Calls This Month</div>
            <div className="text-3xl font-bold text-gray-12">{usageData.anthropic.apiCalls.toLocaleString()}</div>
            <div className="text-xs text-gray-11 mt-1">
              ~{Math.round(usageData.anthropic.apiCalls / Math.max(usageData.currentPeriod.daysElapsed, 1))} per day
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-11 mb-1">Total Tokens</div>
            <div className="text-3xl font-bold text-gray-12">
              {((usageData.anthropic.inputTokens + usageData.anthropic.outputTokens) / 1000000).toFixed(2)}M
            </div>
            <div className="text-xs text-gray-11 mt-1">
              Input: {(usageData.anthropic.inputTokens / 1000000).toFixed(2)}M |
              Output: {(usageData.anthropic.outputTokens / 1000000).toFixed(2)}M
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-11 mb-1">Cost This Month</div>
            <div className="text-3xl font-bold text-blue-11">${usageData.anthropic.totalCost.toFixed(2)}</div>
            <div className="text-xs text-gray-11 mt-1">
              Avg per call: ${usageData.anthropic.avgCostPerSession.toFixed(4)}
            </div>
          </div>
        </div>

        {/* Pricing Information */}
        <div className="bg-gray-a3 rounded-lg p-4 mb-6">
          <div className="text-sm font-medium text-gray-12 mb-2">Claude Haiku 4.5 Pricing</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-11">Input tokens:</span>
              <span className="text-gray-12 font-medium ml-2">$0.25 per 1M tokens</span>
            </div>
            <div>
              <span className="text-gray-11">Output tokens:</span>
              <span className="text-gray-12 font-medium ml-2">$1.25 per 1M tokens</span>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-gray-a3 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-12 mb-3">Cost Breakdown</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-11">Input cost:</span>
              <span className="text-gray-12 font-medium ml-2">
                ${((usageData.anthropic.inputTokens / 1000000) * 0.25).toFixed(4)}
              </span>
            </div>
            <div>
              <span className="text-gray-11">Output cost:</span>
              <span className="text-gray-12 font-medium ml-2">
                ${((usageData.anthropic.outputTokens / 1000000) * 1.25).toFixed(4)}
              </span>
            </div>
            <div>
              <span className="text-gray-11">Cost per message:</span>
              <span className="text-gray-12 font-medium ml-2">
                ${usageData.anthropic.avgCostPerMessage.toFixed(4)}
              </span>
            </div>
            <div>
              <span className="text-gray-11">Projected monthly:</span>
              <span className="text-gray-12 font-medium ml-2">
                ${((usageData.anthropic.totalCost / usageData.currentPeriod.daysElapsed) * usageData.currentPeriod.daysInMonth).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Supabase Storage & Database */}
      <div className="bg-gray-a2 rounded-lg p-6 border border-gray-a6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-5 font-semibold text-gray-12">Storage & Database Usage (Supabase)</h2>
          <span className="px-3 py-1 bg-purple-a3 text-purple-11 rounded-lg text-sm font-medium">
            Pro Plan
          </span>
        </div>

        {/* Storage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <CircularGauge percentage={usageData.supabase.percentage} size={140} strokeWidth={14} />
            <div className="mt-2 text-sm text-gray-11">Storage Used</div>
            <div className="text-xs text-gray-11 mt-1">
              {usageData.supabase.storageGB.toFixed(2)} GB / {usageData.supabase.limitGB} GB
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-11 mb-1">Videos Stored</div>
            <div className="text-3xl font-bold text-gray-12">{usageData.supabase.videoCount}</div>
            <div className="text-xs text-gray-11 mt-3">Average Video Size</div>
            <div className="text-xl font-bold text-gray-12">{usageData.supabase.avgVideoSizeMB.toFixed(1)} MB</div>
          </div>
          <div>
            <div className="text-sm text-gray-11 mb-1">Database Size</div>
            <div className="text-3xl font-bold text-gray-12">{usageData.supabase.databaseSizeMB} MB</div>
            <div className="text-xs text-gray-11 mt-3">Est. Monthly Cost</div>
            <div className="text-xl font-bold text-gray-12">${usageData.supabase.estimatedCost.toFixed(2)}</div>
          </div>
        </div>

        {/* Vector Database Stats */}
        <div className="bg-gradient-to-br from-purple-a3 to-blue-a3 rounded-lg p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-12 mb-4">Vector Database (pgvector)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-purple-11">{usageData.supabase.vectorDbEmbeddings.toLocaleString()}</div>
              <div className="text-xs text-gray-11 mt-1">Embeddings Stored</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-11">{usageData.supabase.vectorDbStorageMB.toFixed(1)} MB</div>
              <div className="text-xs text-gray-11 mt-1">Vector Storage</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-11">{usageData.anthropic.apiCalls.toLocaleString()}</div>
              <div className="text-xs text-gray-11 mt-1">Vector Searches</div>
            </div>
          </div>
        </div>

        {/* Storage Cost Info */}
        <div className="bg-gray-a3 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-12 mb-3">Storage Pricing</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-11">Storage rate:</span>
              <span className="text-gray-12 font-medium ml-2">$0.021 per GB/month</span>
            </div>
            <div>
              <span className="text-gray-11">Current cost:</span>
              <span className="text-gray-12 font-medium ml-2">${usageData.supabase.estimatedCost.toFixed(4)}</span>
            </div>
            <div>
              <span className="text-gray-11">Storage used:</span>
              <span className="text-gray-12 font-medium ml-2">{usageData.supabase.storageGB.toFixed(2)} GB</span>
            </div>
            <div>
              <span className="text-gray-11">Remaining:</span>
              <span className="text-gray-12 font-medium ml-2">
                {(usageData.supabase.limitGB - usageData.supabase.storageGB).toFixed(2)} GB
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: OpenAI (Embeddings) */}
      <div className="bg-gray-a2 rounded-lg p-6 border border-gray-a6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-5 font-semibold text-gray-12">Embeddings API Usage (OpenAI)</h2>
          <span className="px-3 py-1 bg-green-a3 text-green-11 rounded-lg text-sm font-medium">
            Ada-002
          </span>
        </div>

        {/* Embedding Generation Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div>
            <div className="text-sm text-gray-11 mb-1">Embeddings Created</div>
            <div className="text-3xl font-bold text-gray-12">{usageData.openai.embeddingsCreated.toLocaleString()}</div>
            <div className="text-xs text-gray-11 mt-1">This month</div>
          </div>
          <div>
            <div className="text-sm text-gray-11 mb-1">Videos Processed</div>
            <div className="text-3xl font-bold text-gray-12">{usageData.openai.transcriptsProcessed}</div>
            <div className="text-xs text-gray-11 mt-1">Transcribed & vectorized</div>
          </div>
          <div>
            <div className="text-sm text-gray-11 mb-1">Tokens Processed</div>
            <div className="text-3xl font-bold text-gray-12">
              {(usageData.openai.tokensProcessed / 1000000).toFixed(2)}M
            </div>
            <div className="text-xs text-gray-11 mt-1">For embeddings</div>
          </div>
          <div>
            <div className="text-sm text-gray-11 mb-1">Total Cost</div>
            <div className="text-3xl font-bold text-green-11">${usageData.openai.totalCost.toFixed(2)}</div>
            <div className="text-xs text-gray-11 mt-1">This month</div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-a3 rounded-lg p-4">
            <div className="text-sm text-gray-11 mb-1">Avg Cost per Video</div>
            <div className="text-2xl font-bold text-green-11">${usageData.openai.avgCostPerVideo.toFixed(4)}</div>
            <div className="text-xs text-gray-11 mt-1">Whisper transcription + Ada-002 embeddings</div>
          </div>
          <div className="bg-gray-a3 rounded-lg p-4">
            <div className="text-sm text-gray-11 mb-1">Avg Cost per 1000 Chunks</div>
            <div className="text-2xl font-bold text-green-11">${usageData.openai.avgCostPerThousandChunks.toFixed(4)}</div>
            <div className="text-xs text-gray-11 mt-1">Embedding generation</div>
          </div>
        </div>

        {/* Pricing Information */}
        <div className="bg-gray-a3 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-12 mb-3">OpenAI Pricing</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-11">Whisper:</span>
              <span className="text-gray-12 font-medium ml-2">$0.006 per minute</span>
            </div>
            <div>
              <span className="text-gray-11">Ada-002:</span>
              <span className="text-gray-12 font-medium ml-2">$0.0001 per 1K tokens</span>
            </div>
            <div>
              <span className="text-gray-11">Embeddings created:</span>
              <span className="text-gray-12 font-medium ml-2">{usageData.openai.embeddingsCreated.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-11">Chunks per video:</span>
              <span className="text-gray-12 font-medium ml-2">
                {usageData.openai.transcriptsProcessed > 0
                  ? Math.round(usageData.openai.embeddingsCreated / usageData.openai.transcriptsProcessed)
                  : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Limits Table */}
      <div className="bg-gray-a2 rounded-lg p-6 border border-gray-a6">
        <h2 className="text-5 font-semibold text-gray-12 mb-4">Usage vs. Limits (Pro Plan)</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-a6">
                <th className="text-left py-3 text-gray-11 font-medium">Resource</th>
                <th className="text-right py-3 text-gray-11 font-medium">Used</th>
                <th className="text-right py-3 text-gray-11 font-medium">Limit</th>
                <th className="text-right py-3 text-gray-11 font-medium">Percentage</th>
                <th className="text-center py-3 text-gray-11 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {usageData.tierLimits.map((limit) => (
                <tr key={limit.resource} className="border-b border-gray-a3">
                  <td className="py-3 text-gray-12 font-medium">{limit.resource}</td>
                  <td className="py-3 text-gray-12 text-right">{limit.used}</td>
                  <td className="py-3 text-gray-11 text-right">{limit.limit}</td>
                  <td className={`py-3 text-right font-medium ${getStatusColor(limit.percentage)}`}>
                    {limit.percentage.toFixed(1)}%
                  </td>
                  <td className="py-3 text-center">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getStatusBadgeColor(limit.percentage)}`}>
                      {getStatusEmoji(limit.percentage)} {limit.status === 'good' ? 'Good' : limit.status === 'warning' ? 'Warning' : limit.status === 'high' ? 'High' : 'Critical'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost Optimization Recommendations */}
      <div className="bg-gradient-to-br from-blue-a3 to-purple-a3 rounded-lg p-6 border border-gray-a6">
        <h2 className="text-5 font-semibold text-gray-12 mb-4">💡 Cost Optimization Tips</h2>
        <div className="space-y-3">
          <div className="bg-gray-a2 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <div className="font-medium text-gray-12">You're using Claude Haiku - great choice!</div>
                <div className="text-sm text-gray-11 mt-1">
                  Haiku is 3x cheaper than Sonnet and perfect for educational Q&A. Keep it up!
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-a2 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <div className="font-medium text-gray-12">Storage is at 54% - room to grow</div>
                <div className="text-sm text-gray-11 mt-1">
                  You have 4.6 GB remaining. Consider upgrading to Pro+ when you hit 80%.
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-a2 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🚀</span>
              <div>
                <div className="font-medium text-gray-12">Implement prompt caching for 50% savings</div>
                <div className="text-sm text-gray-11 mt-1">
                  Cache system prompts and video chunks to reduce input token costs by up to 90%.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Projection */}
      <div className="bg-gray-a2 rounded-lg p-6 border border-gray-a6">
        <h2 className="text-5 font-semibold text-gray-12 mb-4">Monthly Cost Projection</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-11 mb-1">Current Spend (Month-to-Date)</div>
            <div className="text-3xl font-bold text-gray-12">${totalMonthlyCost.toFixed(2)}</div>
            <div className="text-xs text-gray-11 mt-1">
              Day {usageData.currentPeriod.daysElapsed} of {usageData.currentPeriod.daysInMonth}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-11 mb-1">Projected End of Month</div>
            <div className="text-3xl font-bold text-blue-11">
              ${usageData.currentPeriod.daysElapsed > 0
                ? ((totalMonthlyCost / usageData.currentPeriod.daysElapsed) * usageData.currentPeriod.daysInMonth).toFixed(2)
                : '0.00'}
            </div>
            <div className="text-xs text-gray-11 mt-1">Based on current daily rate</div>
          </div>
          <div>
            <div className="text-sm text-gray-11 mb-1">Daily Average</div>
            <div className="text-3xl font-bold text-purple-11">
              ${usageData.currentPeriod.daysElapsed > 0
                ? (totalMonthlyCost / usageData.currentPeriod.daysElapsed).toFixed(2)
                : '0.00'}
            </div>
            <div className="text-xs text-gray-11 mt-1">Average cost per day</div>
          </div>
        </div>
      </div>
    </div>
  );
}
