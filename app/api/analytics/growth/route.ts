import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

// Cache this route for 5 minutes
export const revalidate = 300;

/**
 * GET /api/analytics/growth
 *
 * Fetches real enrollment growth data from the students table.
 * Revenue data is not available in our database - Whop handles payments.
 *
 * Query params:
 * - creator_id: Required - Creator UUID
 * - months: Optional - Number of months to fetch (default: 12)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const creatorId = searchParams.get('creator_id');
    const monthsParam = searchParams.get('months');
    const months = monthsParam ? parseInt(monthsParam, 10) : 12;

    if (!creatorId) {
      return NextResponse.json(
        { success: false, error: 'creator_id is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Calculate date range for the query
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Fetch student enrollment data grouped by month
    // Using raw SQL for the date_trunc aggregation
    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from('students')
      .select('id, created_at')
      .eq('creator_id', creatorId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (enrollmentError) {
      console.error('Error fetching enrollment data:', enrollmentError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch enrollment data' },
        { status: 500 }
      );
    }

    // Aggregate enrollment data by month
    const monthlyEnrollment = aggregateByMonth(enrollmentData || [], months);

    // Calculate growth metrics
    const totalStudents = enrollmentData?.length || 0;
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const newThisMonth = (enrollmentData || []).filter(
      (s) => new Date(s.created_at) >= currentMonthStart
    ).length;

    // Calculate growth rate (compare last 2 months)
    const lastTwoMonths = monthlyEnrollment.slice(-2);
    let growthRate = 0;
    if (lastTwoMonths.length === 2 && lastTwoMonths[0].students > 0) {
      growthRate = Math.round(
        ((lastTwoMonths[1].students - lastTwoMonths[0].students) / lastTwoMonths[0].students) * 100
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        enrollment: monthlyEnrollment,
        // Revenue data is not available - Whop handles payments directly
        revenue: null,
        revenueMessage: 'Revenue data is available in your Whop dashboard',
        summary: {
          totalStudents,
          newThisMonth,
          growthRate,
        },
      },
      cached: false,
      computed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Growth analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch growth analytics' },
      { status: 500 }
    );
  }
}

/**
 * Aggregate student data by month
 */
function aggregateByMonth(
  students: Array<{ id: string; created_at: string }>,
  monthCount: number
): Array<{ month: string; students: number; cumulative: number }> {
  // Initialize all months with zero counts
  const monthMap = new Map<string, number>();
  const now = new Date();

  for (let i = monthCount - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    monthMap.set(key, 0);
  }

  // Count students per month
  for (const student of students) {
    const date = new Date(student.created_at);
    const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    if (monthMap.has(key)) {
      monthMap.set(key, (monthMap.get(key) || 0) + 1);
    }
  }

  // Convert to array with cumulative totals
  let cumulative = 0;
  const result: Array<{ month: string; students: number; cumulative: number }> = [];

  // Use forEach instead of for...of for better compatibility
  monthMap.forEach((count, month) => {
    cumulative += count;
    result.push({ month, students: count, cumulative });
  });

  return result;
}
