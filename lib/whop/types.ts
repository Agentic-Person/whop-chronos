/**
 * Whop API Type Definitions
 *
 * These types match the Whop API response structures
 * Documentation: https://docs.whop.com
 */

// ============================================================================
// User & Authentication
// ============================================================================

export interface WhopUser {
  id: string;
  email: string;
  username: string | null;
  profile_pic_url: string | null;
  social_accounts: {
    discord?: {
      id: string;
      username: string;
    };
  };
  created_at: number;
}

export interface WhopSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: WhopUser;
}

// ============================================================================
// Memberships & Products
// ============================================================================

export type MembershipStatus = 'active' | 'expired' | 'cancelled' | 'trialing' | 'past_due';

export interface WhopMembership {
  id: string;
  user_id: string;
  product_id: string;
  plan_id: string;
  status: MembershipStatus;
  valid: boolean;
  cancel_at_period_end: boolean;
  renewal_period_start: number | null;
  renewal_period_end: number | null;
  created_at: number;
  metadata?: Record<string, any>;
}

export interface WhopProduct {
  id: string;
  name: string;
  description: string | null;
  visibility: 'visible' | 'hidden';
  created_at: number;
  experiences?: WhopExperience[];
  plans?: WhopPlan[];
}

export interface WhopPlan {
  id: string;
  product_id: string;
  plan_type: 'one_time' | 'renewal';
  billing_period: number | null; // days for renewal plans
  initial_price: number; // in cents
  renewal_price: number | null; // in cents
  created_at: number;
}

export interface WhopExperience {
  id: string;
  product_id: string;
  name: string;
  type: 'discord_role' | 'link' | 'download' | 'text' | 'custom';
  settings: Record<string, any>;
}

// ============================================================================
// Webhooks
// ============================================================================

export type WhopWebhookEvent =
  | 'membership.created'
  | 'membership.updated'
  | 'membership.deleted'
  | 'membership.went_valid'
  | 'membership.went_invalid'
  | 'payment.succeeded'
  | 'payment.failed';

export interface WhopWebhookPayload<T = any> {
  action: WhopWebhookEvent;
  data: T;
  timestamp: number;
}

export interface MembershipWebhookData {
  membership: WhopMembership;
  user: WhopUser;
  product: WhopProduct;
}

export interface PaymentWebhookData {
  id: string;
  membership_id: string;
  amount: number; // in cents
  currency: string;
  status: 'succeeded' | 'failed';
  created_at: number;
}

// ============================================================================
// Company & Organization
// ============================================================================

export interface WhopCompany {
  id: string;
  name: string;
  email: string;
  profile_pic_url: string | null;
  created_at: number;
}

// ============================================================================
// Tier Configuration (App-Specific)
// ============================================================================

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

export interface TierLimits {
  tier: SubscriptionTier;
  maxVideos: number;
  maxStorageGB: number;
  maxAICreditsPerMonth: number;
  maxStudents: number;
  features: {
    videoUpload: boolean;
    aiChat: boolean;
    analytics: boolean;
    courseBuilder: boolean;
    bulkUpload: boolean;
    customBranding: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
  };
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    tier: 'free',
    maxVideos: 5,
    maxStorageGB: 1,
    maxAICreditsPerMonth: 100,
    maxStudents: 10,
    features: {
      videoUpload: true,
      aiChat: true,
      analytics: false,
      courseBuilder: false,
      bulkUpload: false,
      customBranding: false,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  basic: {
    tier: 'basic',
    maxVideos: 50,
    maxStorageGB: 10,
    maxAICreditsPerMonth: 1000,
    maxStudents: 100,
    features: {
      videoUpload: true,
      aiChat: true,
      analytics: true,
      courseBuilder: true,
      bulkUpload: false,
      customBranding: false,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  pro: {
    tier: 'pro',
    maxVideos: 500,
    maxStorageGB: 100,
    maxAICreditsPerMonth: 10000,
    maxStudents: 1000,
    features: {
      videoUpload: true,
      aiChat: true,
      analytics: true,
      courseBuilder: true,
      bulkUpload: true,
      customBranding: true,
      apiAccess: true,
      prioritySupport: false,
    },
  },
  enterprise: {
    tier: 'enterprise',
    maxVideos: -1, // unlimited
    maxStorageGB: -1, // unlimited
    maxAICreditsPerMonth: -1, // unlimited
    maxStudents: -1, // unlimited
    features: {
      videoUpload: true,
      aiChat: true,
      analytics: true,
      courseBuilder: true,
      bulkUpload: true,
      customBranding: true,
      apiAccess: true,
      prioritySupport: true,
    },
  },
};

// ============================================================================
// API Error Types
// ============================================================================

export class WhopApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'WhopApiError';
  }
}

export class WhopAuthError extends WhopApiError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTH_ERROR');
    this.name = 'WhopAuthError';
  }
}

export class WhopMembershipError extends WhopApiError {
  constructor(message: string = 'Invalid or expired membership') {
    super(message, 403, 'MEMBERSHIP_ERROR');
    this.name = 'WhopMembershipError';
  }
}
