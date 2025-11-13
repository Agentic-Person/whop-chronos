/**
 * Seed Development Creator API
 *
 * GET /api/seed/dev-creator - Seeds development creator in database
 *
 * Only works in development mode
 */

import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Seed endpoint only available in development' },
      { status: 403 },
    );
  }

  try {
    const supabase = getServiceSupabase();
    const creatorId = '00000000-0000-0000-0000-000000000001';

    // Check if creator already exists
    const { data: existing } = await supabase
      .from('creators')
      .select('id')
      .eq('id', creatorId)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Development creator already exists',
        data: { creatorId },
      });
    }

    // Insert dev creator
    const { data, error } = await (supabase as any)
      .from('creators')
      .insert({
        id: creatorId,
        whop_company_id: 'dev-company-001',
        subscription_tier: 'pro',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating creator:', error);
      return NextResponse.json(
        { error: 'Failed to create creator', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Development creator created successfully',
      data,
    });
  } catch (error) {
    console.error('Seed API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
