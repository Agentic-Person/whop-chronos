// Report Templates and HTML Generation

import type { ReportTemplate, ReportMetadata, AnalyticsData } from './types';

export const TEMPLATES: Record<string, ReportTemplate> = {
  executive: {
    name: 'Executive Summary',
    description: 'High-level overview of key metrics and trends',
    sections: [
      { type: 'header', title: 'Analytics Overview' },
      { type: 'summary', title: 'Key Metrics', data: 'quickStats' },
      {
        type: 'chart',
        title: 'Video Performance Trend',
        chartType: 'line',
        data: 'timeSeriesData',
      },
      {
        type: 'table',
        title: 'Top Performing Videos',
        data: 'topVideos',
      },
    ],
    layout: 'single-column',
    includeCharts: true,
  },

  detailed: {
    name: 'Detailed Analytics Report',
    description: 'Comprehensive analytics with all metrics and breakdowns',
    sections: [
      { type: 'header', title: 'Detailed Analytics Report' },
      { type: 'summary', title: 'Executive Summary', data: 'quickStats' },
      {
        type: 'chart',
        title: 'Engagement Over Time',
        chartType: 'area',
        data: 'timeSeriesData',
      },
      {
        type: 'table',
        title: 'All Videos Performance',
        data: 'videos',
      },
      {
        type: 'table',
        title: 'Student Engagement',
        data: 'students',
      },
      {
        type: 'chart',
        title: 'Completion Rate Distribution',
        chartType: 'bar',
        data: 'completionDistribution',
      },
    ],
    layout: 'two-column',
    includeCharts: true,
  },

  student: {
    name: 'Student Progress Report',
    description: 'Focus on student engagement and learning progress',
    sections: [
      { type: 'header', title: 'Student Progress Report' },
      { type: 'summary', title: 'Student Statistics', data: 'studentStats' },
      {
        type: 'table',
        title: 'Student Engagement Rankings',
        data: 'students',
      },
      {
        type: 'chart',
        title: 'Session Activity',
        chartType: 'line',
        data: 'sessionTrend',
      },
    ],
    layout: 'single-column',
    includeCharts: true,
  },

  content: {
    name: 'Content Performance Report',
    description: 'Deep dive into video and course performance',
    sections: [
      { type: 'header', title: 'Content Performance Analysis' },
      { type: 'summary', title: 'Content Overview', data: 'contentStats' },
      {
        type: 'chart',
        title: 'Video Views by Category',
        chartType: 'pie',
        data: 'categoryBreakdown',
      },
      {
        type: 'table',
        title: 'Video Performance Metrics',
        data: 'videos',
      },
      {
        type: 'chart',
        title: 'Watch Time Trends',
        chartType: 'area',
        data: 'watchTimeTrend',
      },
    ],
    layout: 'two-column',
    includeCharts: true,
  },

  custom: {
    name: 'Custom Report',
    description: 'Build your own report with selected sections',
    sections: [],
    layout: 'single-column',
    includeCharts: true,
  },
};

/**
 * Generate HTML for PDF rendering
 */
export function generateReportHTML(
  template: ReportTemplate,
  data: AnalyticsData,
  metadata: ReportMetadata
): string {
  const styles = getReportStyles(metadata.branding);

  const sectionsHTML = template.sections
    .map((section) => {
      switch (section.type) {
        case 'header':
          return generateHeaderHTML(section.title, metadata);

        case 'summary':
          return generateSummaryHTML(section.title, data.quickStats);

        case 'chart':
          return generateChartPlaceholderHTML(section.title, section.chartType);

        case 'table':
          return generateTableHTML(
            section.title,
            section.data === 'videos'
              ? data.videos
              : section.data === 'students'
                ? data.students
                : []
          );

        case 'text':
          return generateTextHTML(section.title, section.content || '');

        default:
          return '';
      }
    })
    .join('\n');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${metadata.title}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="container">
    ${sectionsHTML}

    <div class="footer">
      <p>Generated on ${new Date(metadata.generatedAt).toLocaleString()}</p>
      <p>Chronos Analytics - Powered by Whop</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function getReportStyles(branding?: ReportMetadata['branding']): string {
  const primaryColor = branding?.primaryColor || '#6366f1';
  const secondaryColor = branding?.secondaryColor || '#8b5cf6';

  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #1f2937;
      background: #ffffff;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid ${primaryColor};
    }

    .header h1 {
      font-size: 32px;
      font-weight: 700;
      color: ${primaryColor};
      margin-bottom: 10px;
    }

    .header .subtitle {
      font-size: 16px;
      color: #6b7280;
    }

    .logo {
      max-width: 200px;
      margin-bottom: 20px;
    }

    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 24px;
      font-weight: 600;
      color: ${primaryColor};
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
      padding: 20px;
      border-radius: 8px;
      color: white;
    }

    .stat-label {
      font-size: 12px;
      text-transform: uppercase;
      opacity: 0.9;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
    }

    .chart-placeholder {
      background: #f9fafb;
      border: 2px dashed #d1d5db;
      border-radius: 8px;
      padding: 60px 20px;
      text-align: center;
      color: #6b7280;
      margin-bottom: 20px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }

    thead {
      background: ${primaryColor};
      color: white;
    }

    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
    }

    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }

    tbody tr:hover {
      background: #f9fafb;
    }

    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }

    .text-content {
      line-height: 1.8;
      color: #374151;
    }

    @media print {
      .container {
        padding: 20px;
      }

      .section {
        page-break-inside: avoid;
      }
    }
  `;
}

function generateHeaderHTML(
  title: string,
  metadata: ReportMetadata
): string {
  return `
    <div class="header">
      ${metadata.branding?.logo ? `<img src="${metadata.branding.logo}" alt="Logo" class="logo" />` : ''}
      <h1>${title}</h1>
      <div class="subtitle">
        ${metadata.dateRange.start} - ${metadata.dateRange.end}
        ${metadata.companyName ? ` | ${metadata.companyName}` : ''}
      </div>
    </div>
  `;
}

function generateSummaryHTML(
  title: string,
  stats: AnalyticsData['quickStats']
): string {
  return `
    <div class="section">
      <h2 class="section-title">${title}</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Videos</div>
          <div class="stat-value">${stats.totalVideos}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Students</div>
          <div class="stat-value">${stats.totalStudents}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Views</div>
          <div class="stat-value">${stats.totalViews.toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Avg Completion Rate</div>
          <div class="stat-value">${Math.round(stats.avgCompletionRate)}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Watch Time</div>
          <div class="stat-value">${Math.round(stats.totalWatchTime / 3600)}h</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Active Sessions</div>
          <div class="stat-value">${stats.activeSessions}</div>
        </div>
      </div>
    </div>
  `;
}

function generateChartPlaceholderHTML(
  title: string,
  chartType?: string
): string {
  return `
    <div class="section">
      <h2 class="section-title">${title}</h2>
      <div class="chart-placeholder">
        📊 ${chartType?.toUpperCase() || 'CHART'} - Chart will be rendered here
      </div>
    </div>
  `;
}

function generateTableHTML(title: string, data: any[]): string {
  if (!data || data.length === 0) {
    return `
      <div class="section">
        <h2 class="section-title">${title}</h2>
        <p>No data available</p>
      </div>
    `;
  }

  const columns = Object.keys(data[0]);
  const headerRow = columns
    .map((col) => `<th>${col.replace(/_/g, ' ').toUpperCase()}</th>`)
    .join('');

  const dataRows = data
    .slice(0, 10) // Limit to top 10 for readability
    .map((row) => {
      const cells = columns
        .map((col) => {
          let value = row[col];

          // Format values
          if (typeof value === 'number' && col.includes('rate')) {
            value = `${Math.round(value)}%`;
          } else if (typeof value === 'number' && col.includes('time')) {
            value = `${Math.round(value / 60)}m`;
          } else if (Array.isArray(value)) {
            value = value.join(', ');
          }

          return `<td>${value ?? '-'}</td>`;
        })
        .join('');

      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `
    <div class="section">
      <h2 class="section-title">${title}</h2>
      <table>
        <thead>
          <tr>${headerRow}</tr>
        </thead>
        <tbody>
          ${dataRows}
        </tbody>
      </table>
      ${data.length > 10 ? `<p><em>Showing top 10 of ${data.length} total records</em></p>` : ''}
    </div>
  `;
}

function generateTextHTML(title: string, content: string): string {
  return `
    <div class="section">
      <h2 class="section-title">${title}</h2>
      <div class="text-content">
        ${content}
      </div>
    </div>
  `;
}
