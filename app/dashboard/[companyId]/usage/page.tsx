'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAnalytics } from '@/lib/contexts/AnalyticsContext';

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

function CircularGauge({ percentage, size = 120, strokeWidth = 12 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  let strokeColor = '#10b981';
  if (percentage >= 90) strokeColor = '#ef4444';
  else if (percentage >= 75) strokeColor = '#f59e0b';
  else if (percentage >= 50) strokeColor = '#eab308';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="none" className="text-gray-a6" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-12">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
}

export default function UsagePage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const { creatorId } = useAnalytics();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsageData = async () => {
    if (!creatorId) {
      setError('Not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/analytics/usage/current?creatorId=${creatorId}`);

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

    const interval = setInterval(() => {
      fetchUsageData();
    }, 10000);

    return () => clearInterval(interval);
  }, [creatorId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchUsageData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-9 mx-auto mb-4"></div>
          <p className="text-gray-11">Loading usage data...</p>
        </div>
      </div>
    );
  }

  if (error || !usageData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center max-w-md">
          <div className="text-red-11 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-12 mb-2">Failed to Load Usage Data</h2>
          <p className="text-gray-11 mb-4">{error || 'Unknown error occurred'}</p>
          <button onClick={handleRefresh} className="px-4 py-2 bg-blue-9 text-white rounded-lg hover:bg-blue-10 transition-colors">
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
          <p className="text-3 text-gray-11 mt-1">Monitor your API usage, costs, and optimize spending</p>
          <p className="text-xs text-gray-10 mt-2">Last updated: {lastUpdatedTime} • Auto-refreshes every 10 seconds</p>
        </div>
        <button onClick={handleRefresh} disabled={isRefreshing} className="px-4 py-2 bg-blue-9 text-white rounded-lg hover:bg-blue-10 transition-colors disabled:opacity-50 text-sm">
          {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
        </button>
      </div>

      {/* Total Cost Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-a2 rounded-lg p-6 border border-gray-a6">
          <div className="text-sm text-gray-11 mb-1">Total This Month</div>
          <div className="text-4xl font-bold text-gray-12">${totalMonthlyCost.toFixed(2)}</div>
          <div className="text-xs text-gray-11 mt-1">Day {usageData.currentPeriod.daysElapsed} of {usageData.currentPeriod.daysInMonth}</div>
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
                <Pie data={usageData.costDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
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

      {/* Anthropic Usage */}
      <div className="bg-gray-a2 rounded-lg p-6 border border-gray-a6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-5 font-semibold text-gray-12">AI Chat API Usage (Anthropic)</h2>
          <span className="px-3 py-1 bg-blue-a3 text-blue-11 rounded-lg text-sm font-medium">Claude Haiku 4.5</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="text-center">
            <CircularGauge percentage={usageData.anthropic.usagePercentage} />
            <div className="mt-2 text-sm text-gray-11">Usage vs. Limit</div>
            <div className="text-xs text-gray-11 mt-1">{usageData.anthropic.apiCalls.toLocaleString()} / {usageData.anthropic.tierLimit.toLocaleString()} calls</div>
          </div>
          <div>
            <div className="text-sm text-gray-11 mb-1">API Calls This Month</div>
            <div className="text-3xl font-bold text-gray-12">{usageData.anthropic.apiCalls.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-11 mb-1">Total Tokens</div>
            <div className="text-3xl font-bold text-gray-12">{((usageData.anthropic.inputTokens + usageData.anthropic.outputTokens) / 1000000).toFixed(2)}M</div>
          </div>
          <div>
            <div className="text-sm text-gray-11 mb-1">Cost This Month</div>
            <div className="text-3xl font-bold text-blue-11">${usageData.anthropic.totalCost.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Storage Usage */}
      <div className="bg-gray-a2 rounded-lg p-6 border border-gray-a6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-5 font-semibold text-gray-12">Storage & Database Usage (Supabase)</h2>
          <span className="px-3 py-1 bg-purple-a3 text-purple-11 rounded-lg text-sm font-medium">Pro Plan</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <CircularGauge percentage={usageData.supabase.percentage} size={140} strokeWidth={14} />
            <div className="mt-2 text-sm text-gray-11">Storage Used</div>
            <div className="text-xs text-gray-11 mt-1">{usageData.supabase.storageGB.toFixed(2)} GB / {usageData.supabase.limitGB} GB</div>
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
                  <td className={`py-3 text-right font-medium ${getStatusColor(limit.percentage)}`}>{limit.percentage.toFixed(1)}%</td>
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
    </div>
  );
}
