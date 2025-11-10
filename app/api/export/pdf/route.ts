import { NextRequest, NextResponse } from 'next/server';
import type { TemplateType, ReportMetadata, AnalyticsData } from '@/lib/reports/types';
import { generateReportHTML, TEMPLATES } from '@/lib/reports/templates';

/**
 * POST /api/export/pdf
 * Generate and download PDF report
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      template,
      dateRange,
      sections,
      branding,
    }: {
      template: TemplateType;
      dateRange: { start: string; end: string };
      sections?: string[];
      branding?: ReportMetadata['branding'];
    } = body;

    // TODO: Validate user authentication
    // const user = await validateWhopUser(request);

    // Get template
    let reportTemplate = TEMPLATES[template];

    if (!reportTemplate) {
      return NextResponse.json(
        { error: 'Invalid template' },
        { status: 400 }
      );
    }

    // For custom template, use selected sections
    if (template === 'custom' && sections && sections.length > 0) {
      reportTemplate = {
        ...reportTemplate,
        sections: sections.map((sectionType) => ({
          type: sectionType as any,
          title: sectionType.charAt(0).toUpperCase() + sectionType.slice(1),
        })),
      };
    }

    // TODO: Fetch actual analytics data from Supabase
    // For now, using mock data
    const mockAnalyticsData: AnalyticsData = {
      quickStats: {
        totalVideos: 25,
        totalStudents: 150,
        totalViews: 5420,
        avgCompletionRate: 67.5,
        totalWatchTime: 125000,
        activeSessions: 42,
      },
      videos: [
        {
          id: '1',
          title: 'Introduction to Trading',
          views: 320,
          watch_time: 15600,
          completion_rate: 75.5,
          engagement_score: 8.2,
          created_at: '2025-01-01',
        },
        {
          id: '2',
          title: 'Advanced Strategies',
          views: 245,
          watch_time: 12000,
          completion_rate: 68.3,
          engagement_score: 7.8,
          created_at: '2025-01-05',
        },
        {
          id: '3',
          title: 'Risk Management',
          views: 198,
          watch_time: 9800,
          completion_rate: 71.2,
          engagement_score: 8.5,
          created_at: '2025-01-10',
        },
      ],
      students: [
        {
          id: '1',
          email: 'student1@example.com',
          total_sessions: 15,
          avg_session_duration: 1200,
          last_active: '2025-01-15',
          engagement_score: 8.5,
        },
        {
          id: '2',
          email: 'student2@example.com',
          total_sessions: 12,
          avg_session_duration: 980,
          last_active: '2025-01-14',
          engagement_score: 7.2,
        },
      ],
      chatMessages: [],
      timeSeriesData: [
        { date: '2025-01-01', views: 120, sessions: 45, watch_time: 5400 },
        { date: '2025-01-02', views: 135, sessions: 52, watch_time: 6200 },
        { date: '2025-01-03', views: 142, sessions: 48, watch_time: 5800 },
      ],
    };

    // Generate report metadata
    const metadata: ReportMetadata = {
      title: reportTemplate.name,
      dateRange,
      generatedAt: new Date().toISOString(),
      branding,
    };

    // Generate HTML
    const reportHTML = generateReportHTML(reportTemplate, mockAnalyticsData, metadata);

    // TODO: Convert HTML to PDF using Puppeteer or similar
    // For now, return HTML as fallback (in production, this should be PDF)
    /*
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(reportHTML);
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });
    await browser.close();
    */

    // For now, return HTML (replace with PDF in production)
    const htmlBuffer = Buffer.from(reportHTML);

    return new NextResponse(htmlBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/html', // Change to 'application/pdf' when using Puppeteer
        'Content-Disposition': `attachment; filename="report_${template}.html"`, // Change to .pdf
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);

    return NextResponse.json(
      {
        error: 'Failed to export PDF',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
