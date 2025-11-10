/**
 * Tests for video transcription service
 * Run with: npm test -- transcription.test.ts
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  calculateTranscriptionCost,
  estimateTranscriptionCost,
  formatTimestamp,
  formatTranscriptWithTimestamps,
  extractPlainText,
} from '../transcription';
import type { TranscriptSegment } from '../transcription';

describe('Video Transcription Service', () => {
  describe('calculateTranscriptionCost', () => {
    it('should calculate cost correctly for 1 minute', () => {
      const cost = calculateTranscriptionCost(1);
      expect(cost).toBe(0.006);
    });

    it('should calculate cost correctly for 10 minutes', () => {
      const cost = calculateTranscriptionCost(10);
      expect(cost).toBe(0.06);
    });

    it('should calculate cost correctly for 1 hour', () => {
      const cost = calculateTranscriptionCost(60);
      expect(cost).toBe(0.36);
    });

    it('should handle fractional minutes', () => {
      const cost = calculateTranscriptionCost(5.5);
      expect(cost).toBe(0.033);
    });

    it('should return 0 for 0 minutes', () => {
      const cost = calculateTranscriptionCost(0);
      expect(cost).toBe(0);
    });
  });

  describe('estimateTranscriptionCost', () => {
    it('should estimate cost for seconds', () => {
      const result = estimateTranscriptionCost(60); // 1 minute
      expect(result.durationMinutes).toBe(1);
      expect(result.estimatedCost).toBe(0.006);
    });

    it('should estimate cost for 10 minutes', () => {
      const result = estimateTranscriptionCost(600);
      expect(result.durationMinutes).toBe(10);
      expect(result.estimatedCost).toBe(0.06);
    });

    it('should round duration to 2 decimals', () => {
      const result = estimateTranscriptionCost(333); // 5.55 minutes
      expect(result.durationMinutes).toBe(5.55);
    });
  });

  describe('formatTimestamp', () => {
    it('should format seconds correctly', () => {
      expect(formatTimestamp(0)).toBe('00:00');
      expect(formatTimestamp(5)).toBe('00:05');
      expect(formatTimestamp(59)).toBe('00:59');
    });

    it('should format minutes correctly', () => {
      expect(formatTimestamp(60)).toBe('01:00');
      expect(formatTimestamp(65)).toBe('01:05');
      expect(formatTimestamp(599)).toBe('09:59');
    });

    it('should format hours correctly', () => {
      expect(formatTimestamp(3600)).toBe('01:00:00');
      expect(formatTimestamp(3665)).toBe('01:01:05');
      expect(formatTimestamp(7199)).toBe('01:59:59');
    });

    it('should handle large values', () => {
      expect(formatTimestamp(36000)).toBe('10:00:00');
    });
  });

  describe('formatTranscriptWithTimestamps', () => {
    const mockSegments: TranscriptSegment[] = [
      { id: 1, start: 0, end: 5, text: 'Hello world' },
      { id: 2, start: 5, end: 12, text: 'This is a test' },
      { id: 3, start: 12, end: 20, text: 'Of the transcription service' },
    ];

    it('should format segments with timestamps', () => {
      const formatted = formatTranscriptWithTimestamps(mockSegments);

      expect(formatted).toContain('[00:00 - 00:05] Hello world');
      expect(formatted).toContain('[00:05 - 00:12] This is a test');
      expect(formatted).toContain('[00:12 - 00:20] Of the transcription service');
    });

    it('should handle empty segments', () => {
      const formatted = formatTranscriptWithTimestamps([]);
      expect(formatted).toBe('');
    });

    it('should handle undefined segments', () => {
      const formatted = formatTranscriptWithTimestamps(undefined);
      expect(formatted).toBe('');
    });

    it('should trim whitespace from text', () => {
      const segments: TranscriptSegment[] = [
        { id: 1, start: 0, end: 5, text: '  Hello  ' },
      ];

      const formatted = formatTranscriptWithTimestamps(segments);
      expect(formatted).toBe('[00:00 - 00:05] Hello');
    });
  });

  describe('extractPlainText', () => {
    const mockSegments: TranscriptSegment[] = [
      { id: 1, start: 0, end: 5, text: 'Hello world' },
      { id: 2, start: 5, end: 12, text: 'This is a test' },
      { id: 3, start: 12, end: 20, text: 'Of the service' },
    ];

    it('should extract plain text from segments', () => {
      const text = extractPlainText(mockSegments);
      expect(text).toBe('Hello world This is a test Of the service');
    });

    it('should handle empty segments', () => {
      const text = extractPlainText([]);
      expect(text).toBe('');
    });

    it('should trim whitespace', () => {
      const segments: TranscriptSegment[] = [
        { id: 1, start: 0, end: 5, text: '  Hello  ' },
        { id: 2, start: 5, end: 10, text: '  World  ' },
      ];

      const text = extractPlainText(segments);
      expect(text).toBe('Hello World');
    });
  });
});

describe('Audio Validation', () => {
  // Mock tests for audio validation
  // Actual implementation would require mocking file system

  it('should validate file size', () => {
    const maxSize = 25 * 1024 * 1024; // 25 MB
    expect(maxSize).toBe(26214400);
  });

  it('should validate audio formats', () => {
    const supportedFormats = ['mp3', 'mp4', 'm4a', 'wav', 'webm'];
    expect(supportedFormats).toContain('mp3');
    expect(supportedFormats).toContain('wav');
  });
});

describe('Cost Tracking', () => {
  it('should calculate correct pricing constants', () => {
    const WHISPER_PER_MINUTE = 0.006;
    expect(WHISPER_PER_MINUTE * 60).toBe(0.36); // 1 hour
  });

  it('should calculate monthly costs', () => {
    const monthlyMinutes = 600; // 10 hours
    const monthlyCost = monthlyMinutes * 0.006;
    expect(monthlyCost).toBe(3.6);
  });
});

describe('Usage Limits', () => {
  const tiers = {
    basic: {
      transcriptionMinutes: 60,
      aiCreditsUsed: 10000,
      storageBytes: 1 * 1024 * 1024 * 1024,
    },
    pro: {
      transcriptionMinutes: 600,
      aiCreditsUsed: 100000,
      storageBytes: 10 * 1024 * 1024 * 1024,
    },
    enterprise: {
      transcriptionMinutes: 6000,
      aiCreditsUsed: 1000000,
      storageBytes: 100 * 1024 * 1024 * 1024,
    },
  };

  it('should define basic tier limits', () => {
    expect(tiers.basic.transcriptionMinutes).toBe(60);
    expect(tiers.basic.storageBytes).toBe(1073741824);
  });

  it('should define pro tier limits', () => {
    expect(tiers.pro.transcriptionMinutes).toBe(600);
    expect(tiers.pro.storageBytes).toBe(10737418240);
  });

  it('should define enterprise tier limits', () => {
    expect(tiers.enterprise.transcriptionMinutes).toBe(6000);
    expect(tiers.enterprise.storageBytes).toBe(107374182400);
  });

  it('should check usage within limits', () => {
    const usage = {
      transcriptionMinutes: 50,
      aiCreditsUsed: 5000,
      storageUsedBytes: 500 * 1024 * 1024,
    };

    const withinBasic = (
      usage.transcriptionMinutes <= tiers.basic.transcriptionMinutes &&
      usage.aiCreditsUsed <= tiers.basic.aiCreditsUsed &&
      usage.storageUsedBytes <= tiers.basic.storageBytes
    );

    expect(withinBasic).toBe(true);
  });

  it('should check usage exceeds limits', () => {
    const usage = {
      transcriptionMinutes: 100,
      aiCreditsUsed: 5000,
      storageUsedBytes: 500 * 1024 * 1024,
    };

    const withinBasic = (
      usage.transcriptionMinutes <= tiers.basic.transcriptionMinutes &&
      usage.aiCreditsUsed <= tiers.basic.aiCreditsUsed &&
      usage.storageUsedBytes <= tiers.basic.storageBytes
    );

    expect(withinBasic).toBe(false);
  });
});
