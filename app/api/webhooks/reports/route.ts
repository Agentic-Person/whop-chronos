import { NextRequest, NextResponse } from 'next/server';
import { generateScheduledReport } from '@/lib/inngest/report-jobs';

/**
 * POST /api/webhooks/reports
 * Webhook triggered by Inngest for scheduled report generation
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Verify webhook signature
    // const signature = request.headers.get('x-inngest-signature');
    // if (!verifyInngestSignature(signature)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const { scheduleId, creatorId } = body;

    if (!scheduleId || !creatorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Fetch schedule from database
    // const schedule = await db.query.report_schedules.findFirst({
    //   where: and(
    //     eq(report_schedules.id, scheduleId),
    //     eq(report_schedules.creator_id, creatorId),
    //     eq(report_schedules.is_active, true)
    //   )
    // });

    // Mock schedule for now
    const mockSchedule = {
      id: scheduleId,
      creator_id: creatorId,
      name: 'Scheduled Report',
      template: 'executive' as const,
      frequency: 'daily' as const,
      delivery_time: '09:00:00',
      recipients: ['creator@example.com'],
      options: {},
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Generate and send report
    const result = await generateScheduledReport(mockSchedule, creatorId);

    if (!result.success) {
      throw new Error(result.error || 'Failed to generate report');
    }

    return NextResponse.json(
      {
        message: 'Report generated and sent successfully',
        reportId: result.reportId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Report webhook error:', error);

    return NextResponse.json(
      {
        error: 'Failed to process report webhook',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/reports
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'report-webhooks',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
