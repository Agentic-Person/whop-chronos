import { describe, it, expect, vi } from 'vitest';
import {
  extractYouTubeVideoId,
  isYouTubeUrl,
  getErrorMessage,
  YouTubeProcessorError,
  YouTubeErrorCode,
} from '../youtube-processor';

describe('YouTube Processor', () => {
  describe('extractYouTubeVideoId', () => {
    it('should extract video ID from standard watch URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(extractYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from short URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      expect(extractYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from embed URL', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      expect(extractYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from v/ URL', () => {
      const url = 'https://www.youtube.com/v/dQw4w9WgXcQ';
      expect(extractYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from mobile URL', () => {
      const url = 'https://m.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(extractYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should handle URLs with timestamps', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s';
      expect(extractYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should handle URLs with multiple query parameters', () => {
      const url = 'https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ&list=abc';
      expect(extractYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should handle URLs with whitespace', () => {
      const url = '  https://www.youtube.com/watch?v=dQw4w9WgXcQ  ';
      expect(extractYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should throw error for invalid URLs', () => {
      expect(() => extractYouTubeVideoId('https://example.com')).toThrow(YouTubeProcessorError);
      expect(() => extractYouTubeVideoId('not a url')).toThrow(YouTubeProcessorError);
      expect(() => extractYouTubeVideoId('')).toThrow(YouTubeProcessorError);
    });

    it('should throw error with correct error code for invalid URLs', () => {
      try {
        extractYouTubeVideoId('https://example.com');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(YouTubeProcessorError);
        expect((error as YouTubeProcessorError).code).toBe(YouTubeErrorCode.INVALID_URL);
      }
    });

    it('should validate video ID length (must be 11 characters)', () => {
      // Video IDs must be exactly 11 characters
      const validUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // 11 chars
      expect(extractYouTubeVideoId(validUrl)).toBe('dQw4w9WgXcQ');

      // Invalid video ID length should throw
      const invalidUrl = 'https://www.youtube.com/watch?v=short'; // 5 chars
      expect(() => extractYouTubeVideoId(invalidUrl)).toThrow(YouTubeProcessorError);
    });
  });

  describe('isYouTubeUrl', () => {
    it('should validate correct YouTube URLs', () => {
      expect(isYouTubeUrl('https://www.youtube.com/watch?v=abc123')).toBe(true);
      expect(isYouTubeUrl('https://youtu.be/abc123')).toBe(true);
      expect(isYouTubeUrl('https://m.youtube.com/watch?v=abc123')).toBe(true);
      expect(isYouTubeUrl('https://www.youtube.com/embed/abc123')).toBe(true);
    });

    it('should handle case-insensitive URLs', () => {
      expect(isYouTubeUrl('https://WWW.YOUTUBE.COM/watch?v=abc123')).toBe(true);
      expect(isYouTubeUrl('https://YOUTU.BE/abc123')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isYouTubeUrl('https://example.com')).toBe(false);
      expect(isYouTubeUrl('https://vimeo.com/123')).toBe(false);
      expect(isYouTubeUrl('')).toBe(false);
      expect(isYouTubeUrl('not a url')).toBe(false);
    });

    it('should handle URLs with whitespace', () => {
      expect(isYouTubeUrl('  https://www.youtube.com/watch?v=abc123  ')).toBe(true);
    });
  });

  describe('getErrorMessage', () => {
    it('should return correct message for INVALID_URL', () => {
      const error = new YouTubeProcessorError('Test', YouTubeErrorCode.INVALID_URL);
      const message = getErrorMessage(error);
      expect(message).toContain('Invalid YouTube URL');
    });

    it('should return correct message for VIDEO_NOT_FOUND', () => {
      const error = new YouTubeProcessorError('Test', YouTubeErrorCode.VIDEO_NOT_FOUND);
      const message = getErrorMessage(error);
      expect(message).toContain('Video not found');
    });

    it('should return correct message for VIDEO_PRIVATE', () => {
      const error = new YouTubeProcessorError('Test', YouTubeErrorCode.VIDEO_PRIVATE);
      const message = getErrorMessage(error);
      expect(message).toContain('private');
    });

    it('should return correct message for NO_TRANSCRIPT', () => {
      const error = new YouTubeProcessorError('Test', YouTubeErrorCode.NO_TRANSCRIPT);
      const message = getErrorMessage(error);
      expect(message).toContain('No transcript available');
    });

    it('should return correct message for AGE_RESTRICTED', () => {
      const error = new YouTubeProcessorError('Test', YouTubeErrorCode.AGE_RESTRICTED);
      const message = getErrorMessage(error);
      expect(message).toContain('Age-restricted');
    });

    it('should return correct message for RATE_LIMITED', () => {
      const error = new YouTubeProcessorError('Test', YouTubeErrorCode.RATE_LIMITED);
      const message = getErrorMessage(error);
      expect(message).toContain('Too many requests');
    });

    it('should return correct message for NETWORK_ERROR', () => {
      const error = new YouTubeProcessorError('Test', YouTubeErrorCode.NETWORK_ERROR);
      const message = getErrorMessage(error);
      expect(message).toContain('Network error');
    });

    it('should return correct message for UNKNOWN_ERROR', () => {
      const error = new YouTubeProcessorError('Test', YouTubeErrorCode.UNKNOWN_ERROR);
      const message = getErrorMessage(error);
      expect(message).toContain('unexpected error');
    });

    it('should fallback to error message if code not found', () => {
      const error = new YouTubeProcessorError(
        'Custom error message',
        'CUSTOM_CODE' as YouTubeErrorCode
      );
      const message = getErrorMessage(error);
      expect(message).toBe('Custom error message');
    });
  });

  describe('YouTubeProcessorError', () => {
    it('should create error with message and code', () => {
      const error = new YouTubeProcessorError('Test error', YouTubeErrorCode.INVALID_URL);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(YouTubeErrorCode.INVALID_URL);
      expect(error.name).toBe('YouTubeProcessorError');
    });

    it('should store original error when provided', () => {
      const originalError = new Error('Original error');
      const error = new YouTubeProcessorError(
        'Wrapper error',
        YouTubeErrorCode.NETWORK_ERROR,
        originalError
      );
      expect(error.originalError).toBe(originalError);
    });

    it('should be instance of Error', () => {
      const error = new YouTubeProcessorError('Test', YouTubeErrorCode.INVALID_URL);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(YouTubeProcessorError);
    });
  });

  describe('Error Code Enum', () => {
    it('should have all expected error codes', () => {
      expect(YouTubeErrorCode.INVALID_URL).toBe('INVALID_URL');
      expect(YouTubeErrorCode.VIDEO_NOT_FOUND).toBe('VIDEO_NOT_FOUND');
      expect(YouTubeErrorCode.VIDEO_PRIVATE).toBe('VIDEO_PRIVATE');
      expect(YouTubeErrorCode.NO_TRANSCRIPT).toBe('NO_TRANSCRIPT');
      expect(YouTubeErrorCode.AGE_RESTRICTED).toBe('AGE_RESTRICTED');
      expect(YouTubeErrorCode.RATE_LIMITED).toBe('RATE_LIMITED');
      expect(YouTubeErrorCode.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(YouTubeErrorCode.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
    });
  });

  describe('URL Edge Cases', () => {
    it('should handle URL fragments', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ#t=42';
      expect(extractYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should handle short URLs with query parameters', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ?feature=share';
      expect(extractYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should handle URLs with subdirectories', () => {
      // YouTube URLs with /watch/ in path still work because the regex matches the v= parameter
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&extra=param';
      expect(extractYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
    });
  });
});
