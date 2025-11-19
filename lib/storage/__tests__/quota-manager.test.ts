import { describe, it, expect } from 'vitest';
import {
  STORAGE_LIMITS,
  VIDEO_LIMITS,
  MONTHLY_UPLOAD_LIMITS,
  STORAGE_COST_PER_GB_MONTH,
  calculateStorageCost,
  getUpgradeTier,
  getTierFeatures,
} from '../quota-manager';

describe('Storage Quota Manager', () => {
  describe('Constants', () => {
    it('should define correct storage limits', () => {
      expect(STORAGE_LIMITS.basic).toBe(1 * 1024 * 1024 * 1024); // 1GB
      expect(STORAGE_LIMITS.pro).toBe(10 * 1024 * 1024 * 1024); // 10GB
      expect(STORAGE_LIMITS.enterprise).toBe(100 * 1024 * 1024 * 1024); // 100GB
    });

    it('should define correct video limits', () => {
      expect(VIDEO_LIMITS.basic).toBe(50);
      expect(VIDEO_LIMITS.pro).toBe(500);
      expect(VIDEO_LIMITS.enterprise).toBe(-1); // Unlimited
    });

    it('should define correct monthly upload limits', () => {
      expect(MONTHLY_UPLOAD_LIMITS.basic).toBe(20);
      expect(MONTHLY_UPLOAD_LIMITS.pro).toBe(100);
      expect(MONTHLY_UPLOAD_LIMITS.enterprise).toBe(-1); // Unlimited
    });

    it('should define Supabase storage cost', () => {
      expect(STORAGE_COST_PER_GB_MONTH).toBe(0.021);
    });
  });

  describe('calculateStorageCost', () => {
    it('should calculate cost for 1GB file', () => {
      const fileSize = 1024 * 1024 * 1024; // 1GB
      const result = calculateStorageCost(fileSize);

      expect(result.sizeGB).toBe(1);
      expect(result.monthlyCost).toBe(0.021);
      expect(result.formattedCost).toBe('$0.0210/month');
    });

    it('should calculate cost for 100MB file', () => {
      const fileSize = 100 * 1024 * 1024; // 100MB
      const result = calculateStorageCost(fileSize);

      expect(result.sizeGB).toBeCloseTo(0.0977, 4);
      expect(result.monthlyCost).toBeCloseTo(0.0021, 4);
      expect(result.formattedCost).toContain('$0.00');
    });

    it('should calculate cost for 5GB file', () => {
      const fileSize = 5 * 1024 * 1024 * 1024; // 5GB
      const result = calculateStorageCost(fileSize);

      expect(result.sizeGB).toBe(5);
      expect(result.monthlyCost).toBe(0.105);
      expect(result.formattedCost).toBe('$0.1050/month');
    });

    it('should handle zero bytes', () => {
      const result = calculateStorageCost(0);

      expect(result.sizeGB).toBe(0);
      expect(result.monthlyCost).toBe(0);
      expect(result.formattedCost).toBe('$0.0000/month');
    });

    it('should handle fractional GB', () => {
      const fileSize = 1.5 * 1024 * 1024 * 1024; // 1.5GB
      const result = calculateStorageCost(fileSize);

      expect(result.sizeGB).toBe(1.5);
      expect(result.monthlyCost).toBeCloseTo(0.0315, 4);
    });
  });

  describe('getUpgradeTier', () => {
    it('should recommend Pro for Basic tier', () => {
      expect(getUpgradeTier('basic')).toBe('Pro');
    });

    it('should recommend Enterprise for Pro tier', () => {
      expect(getUpgradeTier('pro')).toBe('Enterprise');
    });

    it('should recommend Enterprise for Enterprise tier', () => {
      expect(getUpgradeTier('enterprise')).toBe('Enterprise');
    });
  });

  describe('getTierFeatures', () => {
    it('should return features for all tiers', () => {
      const features = getTierFeatures();

      expect(features).toHaveProperty('basic');
      expect(features).toHaveProperty('pro');
      expect(features).toHaveProperty('enterprise');
    });

    it('should have correct Basic tier features', () => {
      const features = getTierFeatures();

      expect(features.basic.name).toBe('Basic');
      expect(features.basic.price).toBe('$29/month');
      expect(features.basic.storage).toBe('1GB');
      expect(features.basic.videos).toBe('50 videos');
      expect(features.basic.monthlyUploads).toBe('20/month');
      expect(features.basic.features).toBeInstanceOf(Array);
      expect(features.basic.features.length).toBeGreaterThan(0);
    });

    it('should have correct Pro tier features', () => {
      const features = getTierFeatures();

      expect(features.pro.name).toBe('Pro');
      expect(features.pro.price).toBe('$99/month');
      expect(features.pro.storage).toBe('10GB');
      expect(features.pro.videos).toBe('500 videos');
      expect(features.pro.monthlyUploads).toBe('100/month');
      expect(features.pro.features).toBeInstanceOf(Array);
      expect(features.pro.features.length).toBeGreaterThan(features.basic.features.length);
    });

    it('should have correct Enterprise tier features', () => {
      const features = getTierFeatures();

      expect(features.enterprise.name).toBe('Enterprise');
      expect(features.enterprise.price).toBe('$299/month');
      expect(features.enterprise.storage).toBe('100GB');
      expect(features.enterprise.videos).toBe('Unlimited');
      expect(features.enterprise.monthlyUploads).toBe('Unlimited');
      expect(features.enterprise.features).toBeInstanceOf(Array);
      expect(features.enterprise.features.length).toBeGreaterThan(features.pro.features.length);
    });
  });

  describe('Storage Calculations', () => {
    it('should calculate correct percentages', () => {
      const used = 500 * 1024 * 1024; // 500MB
      const limit = STORAGE_LIMITS.basic; // 1GB
      const percentage = (used / limit) * 100;

      expect(percentage).toBeCloseTo(48.83, 2);
    });

    it('should handle unlimited limits', () => {
      const videoCount = 1000;
      const videoLimit = VIDEO_LIMITS.enterprise; // -1 (unlimited)

      const remaining = videoLimit === -1 ? -1 : Math.max(0, videoLimit - videoCount);
      const usagePercent = videoLimit === -1 ? 0 : (videoCount / videoLimit) * 100;

      expect(remaining).toBe(-1);
      expect(usagePercent).toBe(0);
    });

    it('should prevent negative remaining values', () => {
      const used = 2 * 1024 * 1024 * 1024; // 2GB
      const limit = STORAGE_LIMITS.basic; // 1GB
      const available = Math.max(0, limit - used);

      expect(available).toBe(0);
    });
  });

  describe('Tier Comparisons', () => {
    it('should have increasing storage limits', () => {
      expect(STORAGE_LIMITS.basic).toBeLessThan(STORAGE_LIMITS.pro);
      expect(STORAGE_LIMITS.pro).toBeLessThan(STORAGE_LIMITS.enterprise);
    });

    it('should have increasing video limits', () => {
      expect(VIDEO_LIMITS.basic).toBeLessThan(VIDEO_LIMITS.pro);
      // Enterprise is unlimited (-1), so special case
      expect(VIDEO_LIMITS.enterprise).toBe(-1);
    });

    it('should have increasing monthly upload limits', () => {
      expect(MONTHLY_UPLOAD_LIMITS.basic).toBeLessThan(MONTHLY_UPLOAD_LIMITS.pro);
      // Enterprise is unlimited (-1), so special case
      expect(MONTHLY_UPLOAD_LIMITS.enterprise).toBe(-1);
    });
  });

  describe('Cost Projections', () => {
    it('should calculate monthly cost correctly', () => {
      const storageGB = 5;
      const monthlyCost = storageGB * STORAGE_COST_PER_GB_MONTH;

      expect(monthlyCost).toBeCloseTo(0.105, 3);
    });

    it('should handle large storage amounts', () => {
      const storageGB = 100;
      const monthlyCost = storageGB * STORAGE_COST_PER_GB_MONTH;

      expect(monthlyCost).toBe(2.1);
    });

    it('should handle fractional GB storage', () => {
      const storageGB = 0.5;
      const monthlyCost = storageGB * STORAGE_COST_PER_GB_MONTH;

      expect(monthlyCost).toBeCloseTo(0.0105, 4);
    });
  });

  describe('Quota Thresholds', () => {
    it('should identify when storage is at 80% threshold', () => {
      const used = 0.8 * STORAGE_LIMITS.basic;
      const limit = STORAGE_LIMITS.basic;
      const percentage = (used / limit) * 100;

      expect(percentage).toBe(80);
      expect(percentage >= 80).toBe(true);
    });

    it('should identify when storage is at 90% threshold', () => {
      const used = 0.9 * STORAGE_LIMITS.basic;
      const limit = STORAGE_LIMITS.basic;
      const percentage = (used / limit) * 100;

      expect(percentage).toBe(90);
      expect(percentage >= 90).toBe(true);
    });

    it('should identify when storage is at 100% threshold', () => {
      const used = STORAGE_LIMITS.basic;
      const limit = STORAGE_LIMITS.basic;
      const percentage = (used / limit) * 100;

      expect(percentage).toBe(100);
      expect(percentage >= 100).toBe(true);
    });
  });
});
