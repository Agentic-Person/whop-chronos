import { NextRequest, NextResponse } from 'next/server';
import type { ReportSchedule } from '@/lib/reports/types';

/**
 * GET /api/export/schedule
 * List all report schedules for the authenticated creator
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Validate user authentication
    // const user = await validateWhopUser(request);
    // const creatorId = user.id;

    // TODO: Fetch schedules from database
    // const schedules = await db.query.report_schedules.findMany({
    //   where: eq(report_schedules.creator_id, creatorId),
    //   orderBy: desc(report_schedules.created_at)
    // });

    // Mock data for now
    const mockSchedules: ReportSchedule[] = [
      {
        id: '1',
        creator_id: 'creator_123',
        name: 'Weekly Performance Report',
        template: 'executive',
        frequency: 'weekly',
        delivery_time: '09:00:00',
        delivery_day: 1, // Monday
        recipients: ['creator@example.com', 'team@example.com'],
        options: {},
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        creator_id: 'creator_123',
        name: 'Monthly Analytics Summary',
        template: 'detailed',
        frequency: 'monthly',
        delivery_time: '08:00:00',
        delivery_day: 1, // 1st of month
        recipients: ['creator@example.com'],
        options: {},
        is_active: true,
        created_at: '2025-01-05T00:00:00Z',
        updated_at: '2025-01-05T00:00:00Z',
      },
    ];

    return NextResponse.json(
      { schedules: mockSchedules },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to fetch schedules:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch schedules',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/export/schedule
 * Create a new report schedule
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // TODO: Validate user authentication
    // const user = await validateWhopUser(request);

    // Validate required fields
    const { name, template, frequency, delivery_time, recipients } = body;

    if (!name || !template || !frequency || !delivery_time || !recipients) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate recipients are email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter((email: string) => !emailRegex.test(email));

    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: 'Invalid email addresses', invalidEmails },
        { status: 400 }
      );
    }

    // TODO: Insert into database
    // const newSchedule = await db.insert(report_schedules).values({
    //   creator_id: user.id,
    //   name,
    //   template,
    //   frequency,
    //   delivery_time,
    //   delivery_day: body.delivery_day,
    //   recipients,
    //   options: body.options || {},
    //   is_active: true
    // }).returning();

    const mockSchedule: ReportSchedule = {
      id: crypto.randomUUID(),
      creator_id: 'creator_123',
      name,
      template,
      frequency,
      delivery_time,
      delivery_day: body.delivery_day,
      recipients,
      options: body.options || {},
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(
      { schedule: mockSchedule },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create schedule:', error);

    return NextResponse.json(
      {
        error: 'Failed to create schedule',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/export/schedule
 * Update an existing report schedule
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    // TODO: Validate user authentication and ownership
    // const user = await validateWhopUser(request);

    // TODO: Update in database
    // const updatedSchedule = await db.update(report_schedules)
    //   .set({ ...updates, updated_at: new Date() })
    //   .where(and(
    //     eq(report_schedules.id, id),
    //     eq(report_schedules.creator_id, user.id)
    //   ))
    //   .returning();

    return NextResponse.json(
      { message: 'Schedule updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to update schedule:', error);

    return NextResponse.json(
      {
        error: 'Failed to update schedule',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/export/schedule
 * Delete a report schedule
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    // TODO: Validate user authentication and ownership
    // const user = await validateWhopUser(request);

    // TODO: Delete from database
    // await db.delete(report_schedules)
    //   .where(and(
    //     eq(report_schedules.id, id),
    //     eq(report_schedules.creator_id, user.id)
    //   ));

    return NextResponse.json(
      { message: 'Schedule deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to delete schedule:', error);

    return NextResponse.json(
      {
        error: 'Failed to delete schedule',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
