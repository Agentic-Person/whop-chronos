/**
 * Whop API Client
 *
 * Wrapper for Whop MCP server tools and direct API calls
 * Provides type-safe interfaces for all Whop operations
 */

import { Whop } from '@whop/sdk';
import {
  WhopUser,
  WhopMembership,
  WhopProduct,
  WhopCompany,
  WhopApiError,
  WhopLesson,
  WhopEmbedType,
  WhopLessonType,
  WhopLessonVisibility,
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

  console.log('[Whop OAuth] Token exchange request:', {
    client_id: WHOP_CLIENT_ID,
    client_secret: WHOP_CLIENT_SECRET ? `${WHOP_CLIENT_SECRET.substring(0, 10)}...` : 'MISSING',
    redirect_uri: WHOP_REDIRECT_URI,
    grant_type: 'authorization_code',
    code_length: code?.length,
  });

  const response = await fetch('https://data.whop.com/oauth/token', {
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
    console.error('[Whop API] Token exchange failed:', {
      status: response.status,
      error: error.error,
      description: error.error_description,
      fullError: error,
    });
    throw new WhopApiError(
      error.error_description || `Failed to exchange code for token (${response.status})`,
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

  const response = await fetch('https://data.whop.com/oauth/token', {
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
// Whop SDK Instance
// ============================================================================

let whopClient: Whop | null = null;

function getWhopClient(): Whop {
  if (!whopClient) {
    if (!WHOP_API_KEY) {
      throw new WhopApiError('Whop API key not configured', 500, 'MISSING_API_KEY');
    }

    whopClient = new Whop({
      apiKey: WHOP_API_KEY,
    });
  }

  return whopClient;
}

// ============================================================================
// Courses & Lessons Operations
// ============================================================================

/**
 * List all courses for a company
 */
export async function listCourses(): Promise<any[]> {
  try {
    const client = getWhopClient();
    const coursePage = await client.courses.list();
    const courses: any[] = [];
    for await (const course of coursePage) {
      courses.push(course);
    }
    return courses;
  } catch (error) {
    console.error('Failed to list courses:', error);
    throw new WhopApiError('Failed to list courses', 500, 'COURSE_LIST_ERROR');
  }
}

/**
 * Get a specific lesson by ID
 * Returns lesson data including video assets and content
 */
export async function getLesson(lessonId: string): Promise<WhopLesson | null> {
  try {
    const client = getWhopClient();
    const lesson = await client.courseLessons.retrieve(lessonId);

    if (!lesson) {
      return null;
    }

    // Parse lesson content for embedded videos
    let embedType: WhopEmbedType | null = null;
    let embedId: string | null = null;

    if (lesson.content) {
      // Try to extract YouTube embed
      const youtubeMatch = lesson.content.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (youtubeMatch?.[1]) {
        embedType = 'youtube';
        embedId = youtubeMatch[1];
      }

      // Try to extract Loom embed
      const loomMatch = lesson.content.match(/loom\.com\/embed\/([a-zA-Z0-9]+)/);
      if (loomMatch?.[1]) {
        embedType = 'loom';
        embedId = loomMatch[1];
      }

      // Try to extract Vimeo embed
      const vimeoMatch = lesson.content.match(/vimeo\.com\/video\/(\d+)/);
      if (vimeoMatch?.[1]) {
        embedType = 'vimeo';
        embedId = vimeoMatch[1];
      }

      // Try to extract Wistia embed
      const wistiaMatch = lesson.content.match(/fast\.wistia\.net\/embed\/iframe\/([a-zA-Z0-9]+)/);
      if (wistiaMatch?.[1]) {
        embedType = 'wistia';
        embedId = wistiaMatch[1];
      }
    }

    // Map SDK response to our WhopLesson type
    const mappedLesson: WhopLesson = {
      id: lesson.id,
      title: lesson.title,
      lessonType: lesson.lesson_type as WhopLessonType,
      visibility: lesson.visibility as WhopLessonVisibility,
      order: lesson.order,
      content: lesson.content,
      chapterId: '', // Not available in retrieve response
      embedType,
      embedId,
      muxAssetId: lesson.video_asset?.asset_id || null,
      muxAsset: lesson.video_asset ? {
        id: lesson.video_asset.id,
        playbackId: lesson.video_asset.playback_id || '',
        signedPlaybackId: null,
        thumbnailUrl: null,
        signedThumbnailToken: null,
        signedVideoToken: null,
        signedStoryboardToken: null,
        durationSeconds: 0, // Not available in SDK response
        status: 'ready',
        finishedUploadingAt: null,
      } : null,
      daysFromCourseStartUntilUnlock: lesson.days_from_course_start_until_unlock,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    return mappedLesson;
  } catch (error) {
    console.error('Failed to get lesson:', error);
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw new WhopApiError('Failed to fetch lesson', 500, 'LESSON_FETCH_ERROR');
  }
}

/**
 * List lessons for a specific chapter
 */
export async function listLessonsForChapter(chapterId: string): Promise<any[]> {
  try {
    const client = getWhopClient();
    const lessonPage = await client.courseLessons.list({ chapter_id: chapterId });
    const lessons: any[] = [];
    for await (const lesson of lessonPage) {
      lessons.push(lesson);
    }
    return lessons;
  } catch (error) {
    console.error('Failed to list lessons for chapter:', error);
    throw new WhopApiError('Failed to list lessons', 500, 'LESSON_LIST_ERROR');
  }
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
