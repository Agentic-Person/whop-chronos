/**
 * CSV Export Utilities
 *
 * Helper functions for exporting analytics data to CSV format
 */

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

/**
 * Convert data to CSV format
 */
function arrayToCSV(data: any[], headers: string[]): string {
  const rows = [headers.join(',')];

  for (const item of data) {
    const row = headers.map((header) => {
      const value = item[header];
      if (value === null || value === undefined) return '';

      // Escape quotes and wrap in quotes if contains comma
      const strValue = String(value);
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      return strValue;
    });
    rows.push(row.join(','));
  }

  return rows.join('\n');
}

/**
 * Download CSV file
 */
function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export operation breakdown to CSV
 */
export function exportOperationBreakdownToCSV(data: OperationBreakdownData): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const sections: string[] = [];

  // Summary section
  sections.push('COST SUMMARY');
  sections.push('Operation,Cost,Percentage');
  sections.push(`Transcription,$${data.transcription.total_cost.toFixed(4)},${data.summary.by_operation.transcription_percent.toFixed(2)}%`);
  sections.push(`Embeddings,$${data.embeddings.total_cost.toFixed(6)},${data.summary.by_operation.embeddings_percent.toFixed(2)}%`);
  sections.push(`Storage,$${data.storage.total_cost.toFixed(4)},${data.summary.by_operation.storage_percent.toFixed(2)}%`);
  sections.push(`Chat,$${data.chat.total_cost.toFixed(4)},${data.summary.by_operation.chat_percent.toFixed(2)}%`);
  sections.push(`TOTAL,$${data.summary.total_cost.toFixed(4)},100%`);
  sections.push('');

  // Transcription section
  sections.push('TRANSCRIPTION COSTS');
  sections.push(`Total Minutes: ${data.transcription.total_minutes.toFixed(2)}`);
  sections.push(`Total Cost: $${data.transcription.total_cost.toFixed(4)}`);
  sections.push('Video ID,Video Title,Duration (min),Cost,Date');
  for (const video of data.transcription.videos) {
    sections.push(
      `${video.video_id},"${video.video_title}",${video.duration_minutes?.toFixed(2) || 0},$${video.cost.toFixed(4)},${new Date(video.created_at).toLocaleDateString()}`
    );
  }
  sections.push('');

  // Embeddings section
  sections.push('EMBEDDINGS COSTS');
  sections.push(`Total Tokens: ${data.embeddings.total_tokens.toLocaleString()}`);
  sections.push(`Total Cost: $${data.embeddings.total_cost.toFixed(6)}`);
  sections.push('Video ID,Video Title,Tokens,Cost,Date');
  for (const video of data.embeddings.videos) {
    sections.push(
      `${video.video_id},"${video.video_title}",${video.tokens || 0},$${video.cost.toFixed(6)},${new Date(video.created_at).toLocaleDateString()}`
    );
  }
  sections.push('');

  // Storage section
  sections.push('STORAGE COSTS');
  sections.push(`Total Storage: ${data.storage.total_gb.toFixed(4)} GB`);
  sections.push(`Total Monthly Cost: $${data.storage.total_cost.toFixed(4)}`);
  sections.push('Video ID,Video Title,Size (GB),Monthly Cost,Date');
  for (const video of data.storage.videos) {
    sections.push(
      `${video.video_id},"${video.video_title}",${video.size_gb?.toFixed(4) || 0},$${video.cost.toFixed(6)},${new Date(video.created_at).toLocaleDateString()}`
    );
  }
  sections.push('');

  // Chat section
  sections.push('CHAT COSTS');
  sections.push(`Total Sessions: ${data.chat.total_sessions}`);
  sections.push(`Total Cost: $${data.chat.total_cost.toFixed(4)}`);
  sections.push('Session ID,Input Tokens,Output Tokens,Total Tokens,Cost,Date');
  for (const session of data.chat.sessions) {
    sections.push(
      `${session.session_id},${session.input_tokens},${session.output_tokens},${session.input_tokens + session.output_tokens},$${session.cost.toFixed(6)},${new Date(session.created_at).toLocaleDateString()}`
    );
  }

  const csv = sections.join('\n');
  downloadCSV(csv, `chronos-costs-${timestamp}.csv`);
}

/**
 * Export specific operation type to CSV
 */
export function exportOperationTypeToCSV(
  operationType: 'transcription' | 'embeddings' | 'storage' | 'chat',
  data: OperationBreakdownData
): void {
  const timestamp = new Date().toISOString().split('T')[0];
  let csv = '';
  let filename = '';

  switch (operationType) {
    case 'transcription':
      csv = arrayToCSV(
        data.transcription.videos.map(v => ({
          video_id: v.video_id,
          video_title: v.video_title,
          duration_minutes: v.duration_minutes?.toFixed(2) || 0,
          cost: `$${v.cost.toFixed(4)}`,
          date: new Date(v.created_at).toLocaleDateString(),
        })),
        ['video_id', 'video_title', 'duration_minutes', 'cost', 'date']
      );
      filename = `chronos-transcription-costs-${timestamp}.csv`;
      break;

    case 'embeddings':
      csv = arrayToCSV(
        data.embeddings.videos.map(v => ({
          video_id: v.video_id,
          video_title: v.video_title,
          tokens: v.tokens || 0,
          cost: `$${v.cost.toFixed(6)}`,
          date: new Date(v.created_at).toLocaleDateString(),
        })),
        ['video_id', 'video_title', 'tokens', 'cost', 'date']
      );
      filename = `chronos-embeddings-costs-${timestamp}.csv`;
      break;

    case 'storage':
      csv = arrayToCSV(
        data.storage.videos.map(v => ({
          video_id: v.video_id,
          video_title: v.video_title,
          size_gb: v.size_gb?.toFixed(4) || 0,
          monthly_cost: `$${v.cost.toFixed(6)}`,
          date: new Date(v.created_at).toLocaleDateString(),
        })),
        ['video_id', 'video_title', 'size_gb', 'monthly_cost', 'date']
      );
      filename = `chronos-storage-costs-${timestamp}.csv`;
      break;

    case 'chat':
      csv = arrayToCSV(
        data.chat.sessions.map(s => ({
          session_id: s.session_id,
          input_tokens: s.input_tokens,
          output_tokens: s.output_tokens,
          total_tokens: s.input_tokens + s.output_tokens,
          cost: `$${s.cost.toFixed(6)}`,
          date: new Date(s.created_at).toLocaleDateString(),
        })),
        ['session_id', 'input_tokens', 'output_tokens', 'total_tokens', 'cost', 'date']
      );
      filename = `chronos-chat-costs-${timestamp}.csv`;
      break;
  }

  downloadCSV(csv, filename);
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format cost to currency string
 */
export function formatCost(cost: number): string {
  if (cost === 0) return 'FREE';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}
