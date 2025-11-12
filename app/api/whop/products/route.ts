/**
 * Whop Products API Endpoint
 *
 * GET /api/whop/products
 *
 * Lists all products for the authenticated creator's Whop company
 */

import { NextRequest, NextResponse } from 'next/server';
import { listProducts } from '@/lib/whop/api-client';

export async function GET(req: NextRequest) {
  try {
    // In production, validate authentication here
    // const userId = await validateAuth(req);

    const products = await listProducts(50); // Get up to 50 products

    return NextResponse.json({
      success: true,
      products: products.map(p => ({
        id: p.id,
        name: p.name || 'Unnamed Product',
        visibility: p.visibility,
      })),
    });

  } catch (error) {
    console.error('[Whop Products API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load products',
      },
      { status: 500 }
    );
  }
}
