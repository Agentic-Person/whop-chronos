'use client';

import { useState, useEffect } from 'react';

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

type TabType = 'overview' | 'transcription' | 'embeddings' | 'storage' | 'chat';
type SortField = 'title' | 'cost' | 'date' | 'duration' | 'tokens' | 'size';
type SortDirection = 'asc' | 'desc';

interface OperationBreakdownProps {
  creatorId: string;
  dateRange?: { start: Date; end: Date };
  onExport?: (data: OperationBreakdownData) => void;
}

export function OperationBreakdown({ creatorId, dateRange, onExport }: OperationBreakdownProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<OperationBreakdownData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sortField, setSortField] = useState<SortField>('cost');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [creatorId, dateRange]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ creatorId });
      if (dateRange) {
        params.append('startDate', dateRange.start.toISOString());
        params.append('endDate', dateRange.end.toISOString());
      }

      const response = await fetch(`/api/analytics/usage/operations?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch operation breakdown:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortVideos = (videos: VideoDetail[]) => {
    const filtered = videos.filter(v =>
      v.video_title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortField) {
        case 'title':
          aVal = a.video_title;
          bVal = b.video_title;
          break;
        case 'cost':
          aVal = a.cost;
          bVal = b.cost;
          break;
        case 'date':
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        case 'duration':
          aVal = a.duration_minutes || 0;
          bVal = b.duration_minutes || 0;
          break;
        case 'tokens':
          aVal = a.tokens || 0;
          bVal = b.tokens || 0;
          break;
        case 'size':
          aVal = a.size_gb || 0;
          bVal = b.size_gb || 0;
          break;
        default:
          aVal = a.cost;
          bVal = b.cost;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  };

  const sortSessions = (sessions: SessionDetail[]) => {
    const filtered = sessions.filter(s =>
      s.video_title?.toLowerCase().includes(searchQuery.toLowerCase()) || true
    );

    return filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortField) {
        case 'cost':
          aVal = a.cost;
          bVal = b.cost;
          break;
        case 'date':
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        case 'tokens':
          aVal = a.input_tokens + a.output_tokens;
          bVal = b.input_tokens + b.output_tokens;
          break;
        default:
          aVal = a.cost;
          bVal = b.cost;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-9 mx-auto mb-4"></div>
          <p className="text-gray-11">Loading operation breakdown...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-gray-11 py-12">
        Failed to load operation breakdown data
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: '📊' },
    { id: 'transcription' as const, label: 'Transcription', icon: '🎙️' },
    { id: 'embeddings' as const, label: 'Embeddings', icon: '🧮' },
    { id: 'storage' as const, label: 'Storage', icon: '💾' },
    { id: 'chat' as const, label: 'Chat', icon: '💬' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-a6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-blue-9 text-blue-11'
                : 'border-transparent text-gray-11 hover:text-gray-12'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}

        {onExport && (
          <button
            onClick={() => onExport(data)}
            className="ml-auto px-4 py-2 bg-blue-9 text-white rounded-lg hover:bg-blue-10 transition-colors text-sm"
          >
            Export CSV
          </button>
        )}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-a2 rounded-lg p-6 border border-gray-a6">
              <div className="text-sm text-gray-11 mb-1">Transcription</div>
              <div className="text-3xl font-bold text-gray-12">${data.transcription.total_cost.toFixed(2)}</div>
              <div className="text-xs text-gray-11 mt-1">
                {data.summary.by_operation.transcription_percent.toFixed(1)}% of total
              </div>
            </div>
            <div className="bg-gray-a2 rounded-lg p-6 border border-gray-a6">
              <div className="text-sm text-gray-11 mb-1">Embeddings</div>
              <div className="text-3xl font-bold text-gray-12">${data.embeddings.total_cost.toFixed(2)}</div>
              <div className="text-xs text-gray-11 mt-1">
                {data.summary.by_operation.embeddings_percent.toFixed(1)}% of total
              </div>
            </div>
            <div className="bg-gray-a2 rounded-lg p-6 border border-gray-a6">
              <div className="text-sm text-gray-11 mb-1">Storage</div>
              <div className="text-3xl font-bold text-gray-12">${data.storage.total_cost.toFixed(2)}</div>
              <div className="text-xs text-gray-11 mt-1">
                {data.summary.by_operation.storage_percent.toFixed(1)}% of total
              </div>
            </div>
            <div className="bg-gray-a2 rounded-lg p-6 border border-gray-a6">
              <div className="text-sm text-gray-11 mb-1">Chat</div>
              <div className="text-3xl font-bold text-gray-12">${data.chat.total_cost.toFixed(2)}</div>
              <div className="text-xs text-gray-11 mt-1">
                {data.summary.by_operation.chat_percent.toFixed(1)}% of total
              </div>
            </div>
          </div>

          {/* Total Cost */}
          <div className="bg-gradient-to-br from-blue-a3 to-purple-a3 rounded-lg p-6 border border-gray-a6">
            <div className="text-sm text-gray-11 mb-1">Total Operation Costs</div>
            <div className="text-5xl font-bold text-gray-12">${data.summary.total_cost.toFixed(2)}</div>
            <div className="text-sm text-gray-11 mt-2">
              Breakdown: {data.transcription.videos.length} transcriptions, {data.embeddings.videos.length} embeddings, {data.storage.videos.length} stored videos, {data.chat.total_sessions} chat sessions
            </div>
          </div>
        </div>
      )}

      {/* Transcription Tab */}
      {activeTab === 'transcription' && (
        <div className="space-y-4">
          <div className="bg-gray-a2 rounded-lg p-6 border border-gray-a6">
            <h3 className="text-lg font-semibold text-gray-12 mb-4">Transcription Costs</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <div className="text-sm text-gray-11">Total Cost</div>
                <div className="text-2xl font-bold text-gray-12">${data.transcription.total_cost.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-11">Total Minutes</div>
                <div className="text-2xl font-bold text-gray-12">{data.transcription.total_minutes.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-11">Videos Processed</div>
                <div className="text-2xl font-bold text-gray-12">{data.transcription.videos.length}</div>
              </div>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-gray-a2 border border-gray-a6 rounded-lg mb-4"
            />

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-a6">
                    <th
                      className="text-left py-3 text-gray-11 font-medium cursor-pointer hover:text-gray-12"
                      onClick={() => handleSort('title')}
                    >
                      Video Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right py-3 text-gray-11 font-medium cursor-pointer hover:text-gray-12"
                      onClick={() => handleSort('duration')}
                    >
                      Duration {sortField === 'duration' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right py-3 text-gray-11 font-medium cursor-pointer hover:text-gray-12"
                      onClick={() => handleSort('cost')}
                    >
                      Cost {sortField === 'cost' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right py-3 text-gray-11 font-medium cursor-pointer hover:text-gray-12"
                      onClick={() => handleSort('date')}
                    >
                      Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortVideos(data.transcription.videos).map((video) => (
                    <tr key={video.video_id} className="border-b border-gray-a3">
                      <td className="py-3 text-gray-12">{video.video_title}</td>
                      <td className="py-3 text-gray-12 text-right">{video.duration_minutes?.toFixed(1)} min</td>
                      <td className="py-3 text-gray-12 text-right font-medium">${video.cost.toFixed(4)}</td>
                      <td className="py-3 text-gray-11 text-right text-sm">
                        {new Date(video.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Embeddings Tab */}
      {activeTab === 'embeddings' && (
        <div className="space-y-4">
          <div className="bg-gray-a2 rounded-lg p-6 border border-gray-a6">
            <h3 className="text-lg font-semibold text-gray-12 mb-4">Embeddings Costs</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <div className="text-sm text-gray-11">Total Cost</div>
                <div className="text-2xl font-bold text-gray-12">${data.embeddings.total_cost.toFixed(4)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-11">Total Tokens</div>
                <div className="text-2xl font-bold text-gray-12">{(data.embeddings.total_tokens / 1000).toFixed(1)}K</div>
              </div>
              <div>
                <div className="text-sm text-gray-11">Videos Processed</div>
                <div className="text-2xl font-bold text-gray-12">{data.embeddings.videos.length}</div>
              </div>
            </div>

            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-gray-a2 border border-gray-a6 rounded-lg mb-4"
            />

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-a6">
                    <th
                      className="text-left py-3 text-gray-11 font-medium cursor-pointer hover:text-gray-12"
                      onClick={() => handleSort('title')}
                    >
                      Video Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right py-3 text-gray-11 font-medium cursor-pointer hover:text-gray-12"
                      onClick={() => handleSort('tokens')}
                    >
                      Tokens {sortField === 'tokens' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right py-3 text-gray-11 font-medium cursor-pointer hover:text-gray-12"
                      onClick={() => handleSort('cost')}
                    >
                      Cost {sortField === 'cost' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right py-3 text-gray-11 font-medium cursor-pointer hover:text-gray-12"
                      onClick={() => handleSort('date')}
                    >
                      Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortVideos(data.embeddings.videos).map((video) => (
                    <tr key={video.video_id} className="border-b border-gray-a3">
                      <td className="py-3 text-gray-12">{video.video_title}</td>
                      <td className="py-3 text-gray-12 text-right">{(video.tokens || 0).toLocaleString()}</td>
                      <td className="py-3 text-gray-12 text-right font-medium">${video.cost.toFixed(6)}</td>
                      <td className="py-3 text-gray-11 text-right text-sm">
                        {new Date(video.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Storage Tab */}
      {activeTab === 'storage' && (
        <div className="space-y-4">
          <div className="bg-gray-a2 rounded-lg p-6 border border-gray-a6">
            <h3 className="text-lg font-semibold text-gray-12 mb-4">Storage Costs</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <div className="text-sm text-gray-11">Total Cost/Month</div>
                <div className="text-2xl font-bold text-gray-12">${data.storage.total_cost.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-11">Total Storage</div>
                <div className="text-2xl font-bold text-gray-12">{data.storage.total_gb.toFixed(2)} GB</div>
              </div>
              <div>
                <div className="text-sm text-gray-11">Videos Stored</div>
                <div className="text-2xl font-bold text-gray-12">{data.storage.videos.length}</div>
              </div>
            </div>

            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-gray-a2 border border-gray-a6 rounded-lg mb-4"
            />

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-a6">
                    <th
                      className="text-left py-3 text-gray-11 font-medium cursor-pointer hover:text-gray-12"
                      onClick={() => handleSort('title')}
                    >
                      Video Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right py-3 text-gray-11 font-medium cursor-pointer hover:text-gray-12"
                      onClick={() => handleSort('size')}
                    >
                      Size {sortField === 'size' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right py-3 text-gray-11 font-medium cursor-pointer hover:text-gray-12"
                      onClick={() => handleSort('cost')}
                    >
                      Monthly Cost {sortField === 'cost' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right py-3 text-gray-11 font-medium cursor-pointer hover:text-gray-12"
                      onClick={() => handleSort('date')}
                    >
                      Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortVideos(data.storage.videos).map((video) => (
                    <tr key={video.video_id} className="border-b border-gray-a3">
                      <td className="py-3 text-gray-12">{video.video_title}</td>
                      <td className="py-3 text-gray-12 text-right">{video.size_gb?.toFixed(3)} GB</td>
                      <td className="py-3 text-gray-12 text-right font-medium">${video.cost.toFixed(6)}</td>
                      <td className="py-3 text-gray-11 text-right text-sm">
                        {new Date(video.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="space-y-4">
          <div className="bg-gray-a2 rounded-lg p-6 border border-gray-a6">
            <h3 className="text-lg font-semibold text-gray-12 mb-4">Chat Costs</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <div className="text-sm text-gray-11">Total Cost</div>
                <div className="text-2xl font-bold text-gray-12">${data.chat.total_cost.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-11">Total Sessions</div>
                <div className="text-2xl font-bold text-gray-12">{data.chat.total_sessions}</div>
              </div>
              <div>
                <div className="text-sm text-gray-11">Avg Cost/Session</div>
                <div className="text-2xl font-bold text-gray-12">
                  ${data.chat.total_sessions > 0 ? (data.chat.total_cost / data.chat.total_sessions).toFixed(4) : '0.00'}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-a6">
                    <th className="text-left py-3 text-gray-11 font-medium">Session ID</th>
                    <th
                      className="text-right py-3 text-gray-11 font-medium cursor-pointer hover:text-gray-12"
                      onClick={() => handleSort('tokens')}
                    >
                      Tokens {sortField === 'tokens' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right py-3 text-gray-11 font-medium cursor-pointer hover:text-gray-12"
                      onClick={() => handleSort('cost')}
                    >
                      Cost {sortField === 'cost' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right py-3 text-gray-11 font-medium cursor-pointer hover:text-gray-12"
                      onClick={() => handleSort('date')}
                    >
                      Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortSessions(data.chat.sessions).map((session) => (
                    <tr key={session.session_id} className="border-b border-gray-a3">
                      <td className="py-3 text-gray-12 font-mono text-xs">{session.session_id.slice(0, 8)}...</td>
                      <td className="py-3 text-gray-12 text-right">
                        {(session.input_tokens + session.output_tokens).toLocaleString()}
                      </td>
                      <td className="py-3 text-gray-12 text-right font-medium">${session.cost.toFixed(6)}</td>
                      <td className="py-3 text-gray-11 text-right text-sm">
                        {new Date(session.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
