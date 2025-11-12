/**
 * Whop API Client
 *
 * Wrapper for Whop MCP server tools and direct API calls
 * Provides type-safe interfaces for all Whop operations
 */

import {
  WhopUser,
  WhopMembership,
  WhopProduct,
  WhopCompany,
  WhopApiError,
  type MembershipStatus,
} from './types';

// ============================================================================
// Environment Configuration
// ============================================================================

const WHOP_API_KEY = process.env['WHOP_API_KEY'];
const WHOP_API_BASE = 'https://api.whop.com/v1';

if (!WHOP_API_KEY && process.env['NODE_ENV'] === 'production') {
  console.error('Missing WHOP_API_KEY in production environment');
}

// ============================================================================
// Base API Request Handler
// ============================================================================

async function whopFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!WHOP_API_KEY) {
    throw new WhopApiError('Whop API key not configured', 500, 'MISSING_API_KEY');
  }

  const url = `${WHOP_API_BASE}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${WHOP_API_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new WhopApiError(
        error.message || `Whop API error: ${response.status}`,
        response.status,
        error.code
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof WhopApiError) {
      throw error;
    }
    console.error('Whop API request failed:', error);
    throw new WhopApiError(
      'Failed to communicate with Whop API',
      500,
      'NETWORK_ERROR'
    );
  }
}

// ============================================================================
// Product Operations
// ============================================================================

export async function listProducts(limit = 10): Promise<WhopProduct[]> {
  const response = await whopFetch<{ data: WhopProduct[] }>(
    `/products?limit=${limit}`
  );
  return response.data;
}

export async function getProduct(productId: string): Promise<WhopProduct> {
  return await whopFetch<WhopProduct>(`/products/${productId}`);
}

export async function createProduct(data: {
  name: string;
  description?: string;
  visibility?: 'visible' | 'hidden';
}): Promise<WhopProduct> {
  return await whopFetch<WhopProduct>('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================================================
// Membership Operations
// ============================================================================

export async function listMemberships(params?: {
  limit?: number;
  productId?: string;
  userId?: string;
  status?: MembershipStatus;
}): Promise<WhopMembership[]> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.productId) queryParams.set('product_id', params.productId);
  if (params?.userId) queryParams.set('user_id', params.userId);
  if (params?.status) queryParams.set('status', params.status);

  const response = await whopFetch<{ data: WhopMembership[] }>(
    `/memberships?${queryParams.toString()}`
  );
  return response.data;
}

export async function getMembership(membershipId: string): Promise<WhopMembership> {
  return await whopFetch<WhopMembership>(`/memberships/${membershipId}`);
}

export async function validateMembership(membershipId: string): Promise<{
  valid: boolean;
  membership: WhopMembership;
}> {
  try {
    const membership = await getMembership(membershipId);
    return {
      valid: membership.valid && membership.status === 'active',
      membership,
    };
  } catch (error) {
    if (error instanceof WhopApiError && error.statusCode === 404) {
      throw new WhopApiError('Membership not found', 404, 'MEMBERSHIP_NOT_FOUND');
    }
    throw error;
  }
}

// ============================================================================
// User Operations
// ============================================================================

export async function listUsers(limit = 10): Promise<WhopUser[]> {
  const response = await whopFetch<{ data: WhopUser[] }>(
    `/users?limit=${limit}`
  );
  return response.data;
}

export async function getUser(userId: string): Promise<WhopUser> {
  return await whopFetch<WhopUser>(`/users/${userId}`);
}

export async function getCurrentUser(accessToken: string): Promise<WhopUser> {
  const response = await fetch(`${WHOP_API_BASE}/me`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new WhopApiError('Failed to fetch current user', response.status);
  }

  return await response.json();
}

// ============================================================================
// Company Operations
// ============================================================================

export async function getCompanyInfo(): Promise<WhopCompany> {
  return await whopFetch<WhopCompany>('/company');
}

// ============================================================================
// OAuth Operations
// ============================================================================

const WHOP_CLIENT_ID = process.env['WHOP_CLIENT_ID'];
const WHOP_CLIENT_SECRET = process.env['WHOP_CLIENT_SECRET'];
const WHOP_REDIRECT_URI = process.env['WHOP_OAUTH_REDIRECT_URI'];

export function getOAuthUrl(state?: string): string {
  if (!WHOP_CLIENT_ID) {
    throw new WhopApiError('OAuth not configured', 500, 'MISSING_OAUTH_CONFIG');
  }

  const params = new URLSearchParams({
    client_id: WHOP_CLIENT_ID,
    redirect_uri: WHOP_REDIRECT_URI || '',
    response_type: 'code',
  });

  if (state) {
    params.set('state', state);
  }

  return `https://whop.com/oauth?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  if (!WHOP_CLIENT_ID || !WHOP_CLIENT_SECRET) {
    throw new WhopApiError('OAuth not configured', 500, 'MISSING_OAUTH_CONFIG');
  }

  const response = await fetch('https://api.whop.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: WHOP_CLIENT_ID,
      client_secret: WHOP_CLIENT_SECRET,
      code,
      redirect_uri: WHOP_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new WhopApiError(
      error.error_description || 'Failed to exchange code for token',
      response.status,
      error.error
    );
  }

  return await response.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  if (!WHOP_CLIENT_ID || !WHOP_CLIENT_SECRET) {
    throw new WhopApiError('OAuth not configured', 500, 'MISSING_OAUTH_CONFIG');
  }

  const response = await fetch('https://api.whop.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: WHOP_CLIENT_ID,
      client_secret: WHOP_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new WhopApiError(
      error.error_description || 'Failed to refresh token',
      response.status,
      error.error
    );
  }

  return await response.json();
}

// ============================================================================
// Courses & Lessons Operations
// ============================================================================

/**
 * List all courses for a company
 * Note: This uses the Whop SDK/GraphQL API since REST endpoints are not well documented
 */
export async function listCourses(companyId?: string): Promise<any[]> {
  // This would use Whop SDK when available
  // For now, return empty array - need to implement GraphQL query
  console.warn('listCourses: Whop SDK integration needed for course listing');
  return [];
}

/**
 * Get a specific lesson by ID
 * Note: This uses the Whop SDK/GraphQL API
 */
export async function getLesson(lessonId: string): Promise<any> {
  // This would use Whop SDK when available
  console.warn('getLesson: Whop SDK integration needed');
  return null;
}

/**
 * List lessons for a specific chapter
 */
export async function listLessonsForChapter(chapterId: string): Promise<any[]> {
  console.warn('listLessonsForChapter: Whop SDK integration needed');
  return [];
}

// ============================================================================
// MCP Server Integration (when available)
// ============================================================================

/**
 * These functions serve as fallback/alternative to MCP server tools
 * When MCP server is properly configured with env vars, it can be used directly
 * For now, we use direct API calls for reliability
 */

export const whopMCP = {
  async listProducts(limit = 10) {
    // Fallback to direct API
    return await listProducts(limit);
  },

  async getProduct(productId: string) {
    // Fallback to direct API
    return await getProduct(productId);
  },

  async listMemberships(params?: {
    limit?: number;
    productId?: string;
    userId?: string;
    status?: MembershipStatus;
  }) {
    // Fallback to direct API
    return await listMemberships(params);
  },

  async validateMembership(membershipId: string) {
    // Fallback to direct API
    return await validateMembership(membershipId);
  },

  async getCompanyInfo() {
    // Fallback to direct API
    return await getCompanyInfo();
  },
};

// ============================================================================
// Exports
// ============================================================================

export const whopApi = {
  // Products
  listProducts,
  getProduct,
  createProduct,

  // Memberships
  listMemberships,
  getMembership,
  validateMembership,

  // Users
  listUsers,
  getUser,
  getCurrentUser,

  // Company
  getCompanyInfo,

  // OAuth
  getOAuthUrl,
  exchangeCodeForToken,
  refreshAccessToken,

  // MCP Integration
  mcp: whopMCP,
};
