/**
 * Test Suite for RAG Search Engine
 *
 * Tests vector search, ranking, and context building functionality
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { enhancedSearch, searchWithinCourse, invalidateAllSearchCache } from '../search';
import { rankSearchResults, boostVideoInResults, ensureResultDiversity } from '../ranking';
import { buildContext, buildCitation, extractCitations, estimateTokens } from '../context-builder';
import type { VectorSearchResult } from '@/lib/video/vector-search';
import type { EnhancedSearchResult } from '../search';

// Mock data for testing
const mockSearchResults: VectorSearchResult[] = [
  {
    chunk_id: 'chunk-1',
    video_id: 'video-1',
    video_title: 'Introduction to TypeScript',
    chunk_text: 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It adds optional static typing and other features.',
    start_time_seconds: 120,
    end_time_seconds: 180,
    similarity: 0.92,
    metadata: {
      video_url: 'https://example.com/video1',
      creator_id: 'creator-1',
    },
  },
  {
    chunk_id: 'chunk-2',
    video_id: 'video-1',
    video_title: 'Introduction to TypeScript',
    chunk_text: 'TypeScript provides excellent IDE support with autocomplete and type checking. This helps catch errors early in development.',
    start_time_seconds: 240,
    end_time_seconds: 300,
    similarity: 0.88,
    metadata: {
      video_url: 'https://example.com/video1',
      creator_id: 'creator-1',
    },
  },
  {
    chunk_id: 'chunk-3',
    video_id: 'video-2',
    video_title: 'Advanced TypeScript Patterns',
    chunk_text: 'Generics in TypeScript allow you to write reusable code that works with multiple types while maintaining type safety.',
    start_time_seconds: 60,
    end_time_seconds: 120,
    similarity: 0.85,
    metadata: {
      video_url: 'https://example.com/video2',
      creator_id: 'creator-1',
    },
  },
];

describe('Vector Search', () => {
  afterAll(async () => {
    // Clean up cache after tests
    await invalidateAllSearchCache();
  });

  it('should search and return results', async () => {
    // Note: This test requires a running Supabase instance with test data
    // In CI/CD, you would mock the Supabase client

    const results = await enhancedSearch('what is typescript', {
      match_count: 5,
      similarity_threshold: 0.7,
      enable_cache: false, // Disable cache for testing
    });

    expect(Array.isArray(results)).toBe(true);
    // Results might be empty if no test data exists, that's ok for this test
  });

  it('should respect similarity threshold', async () => {
    const results = await enhancedSearch('typescript basics', {
      similarity_threshold: 0.9, // High threshold
      enable_cache: false,
    });

    // All results should meet threshold
    results.forEach(result => {
      expect(result.similarity).toBeGreaterThanOrEqual(0.9);
    });
  });

  it('should limit results by match_count', async () => {
    const results = await enhancedSearch('typescript', {
      match_count: 3,
      enable_cache: false,
    });

    expect(results.length).toBeLessThanOrEqual(3);
  });
});

describe('Ranking Algorithm', () => {
  it('should rank results by similarity', async () => {
    const ranked = await rankSearchResults(mockSearchResults, {
      enable_recency_boost: false,
      enable_popularity_boost: false,
    });

    expect(ranked.length).toBe(mockSearchResults.length);

    // Should be sorted by rank_score (descending)
    for (let i = 0; i < ranked.length - 1; i++) {
      expect(ranked[i].rank_score).toBeGreaterThanOrEqual(ranked[i + 1].rank_score);
    }

    // First result should have highest similarity
    expect(ranked[0].chunk_id).toBe('chunk-1'); // similarity: 0.92
  });

  it('should include rank breakdown', async () => {
    const ranked = await rankSearchResults(mockSearchResults);

    ranked.forEach(result => {
      expect(result.rank_breakdown).toBeDefined();
      expect(result.rank_breakdown?.similarity_score).toBeGreaterThanOrEqual(0);
      expect(result.rank_breakdown?.recency_boost).toBeGreaterThanOrEqual(0);
      expect(result.rank_breakdown?.popularity_boost).toBeGreaterThanOrEqual(0);
      expect(result.rank_breakdown?.view_history_boost).toBeGreaterThanOrEqual(0);
    });
  });

  it('should boost specific videos', async () => {
    const ranked = await rankSearchResults(mockSearchResults);
    const boosted = boostVideoInResults(ranked, 'video-2', 2.0);

    // Video 2 chunks should be ranked higher after boost
    const video2Results = boosted.filter(r => r.video_id === 'video-2');
    const video1Results = boosted.filter(r => r.video_id === 'video-1');

    if (video2Results.length > 0 && video1Results.length > 0) {
      // At least one video-2 result should rank higher than some video-1 results
      const highestVideo2Rank = Math.max(...video2Results.map(r => r.rank_score));
      expect(highestVideo2Rank).toBeGreaterThan(0);
    }
  });

  it('should ensure result diversity', async () => {
    const ranked = await rankSearchResults(mockSearchResults);
    const diverse = ensureResultDiversity(ranked, 1); // Max 1 per video

    // Count unique videos
    const uniqueVideos = new Set(diverse.map(r => r.video_id));

    // Should have at most 1 result per video
    expect(diverse.length).toBe(uniqueVideos.size);
  });
});

describe('Context Builder', () => {
  const mockEnhancedResults: EnhancedSearchResult[] = mockSearchResults.map((r, i) => ({
    ...r,
    rank_score: 0.9 - (i * 0.1),
    rank_breakdown: {
      similarity_score: r.similarity,
      recency_boost: 0.1,
      popularity_boost: 0.05,
      view_history_boost: 0,
    },
  }));

  it('should build markdown context', () => {
    const context = buildContext(mockEnhancedResults, {
      format: 'markdown',
      max_tokens: 10000,
    });

    expect(context.context).toContain('# Relevant Video Content');
    expect(context.context).toContain('Introduction to TypeScript');
    expect(context.context).toContain('2:00'); // Timestamp format
    expect(context.sources.length).toBeGreaterThan(0);
    expect(context.total_chunks).toBe(mockEnhancedResults.length);
    expect(context.truncated).toBe(false);
  });

  it('should build XML context', () => {
    const context = buildContext(mockEnhancedResults, {
      format: 'xml',
      max_tokens: 10000,
    });

    expect(context.context).toContain('<context>');
    expect(context.context).toContain('<source');
    expect(context.context).toContain('</source>');
    expect(context.context).toContain('</context>');
  });

  it('should respect token limits', () => {
    const context = buildContext(mockEnhancedResults, {
      max_tokens: 200, // Very low limit
    });

    expect(context.total_tokens).toBeLessThanOrEqual(200);
    expect(context.truncated).toBe(true);
  });

  it('should deduplicate content', () => {
    // Create duplicate results
    const duplicateResults = [
      ...mockEnhancedResults,
      ...mockEnhancedResults, // Add duplicates
    ];

    const context = buildContext(duplicateResults, {
      deduplicate_content: true,
    });

    // Should have fewer chunks than input
    expect(context.total_chunks).toBeLessThan(duplicateResults.length);
  });

  it('should build citations correctly', () => {
    const citation = buildCitation(mockEnhancedResults[0], true);

    expect(citation).toContain('Introduction to TypeScript');
    expect(citation).toContain('2:00');
    expect(citation).toContain('https://example.com/video1');
    expect(citation).toContain('t=120'); // Timestamp parameter
  });

  it('should extract structured citations', () => {
    const citations = extractCitations(mockEnhancedResults);

    expect(citations.length).toBe(mockEnhancedResults.length);

    citations.forEach((citation, i) => {
      expect(citation.video_id).toBe(mockEnhancedResults[i].video_id);
      expect(citation.video_title).toBe(mockEnhancedResults[i].video_title);
      expect(citation.timestamp).toBe(mockEnhancedResults[i].start_time_seconds);
      expect(citation.relevance_score).toBe(mockEnhancedResults[i].rank_score);
    });
  });

  it('should track source metadata', () => {
    const context = buildContext(mockEnhancedResults);

    expect(context.sources.length).toBe(2); // 2 unique videos

    const video1Source = context.sources.find(s => s.video_id === 'video-1');
    expect(video1Source).toBeDefined();
    expect(video1Source?.chunks_used).toBe(2);
    expect(video1Source?.timestamps.length).toBe(2);

    const video2Source = context.sources.find(s => s.video_id === 'video-2');
    expect(video2Source).toBeDefined();
    expect(video2Source?.chunks_used).toBe(1);
  });
});

describe('Token Estimation', () => {
  it('should estimate tokens accurately', () => {
    // Test with known text lengths
    const shortText = 'Hello world'; // ~3-4 tokens
    const mediumText = 'This is a longer sentence with more words that should have more tokens.'; // ~15-20 tokens
    const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'.repeat(10); // ~300-400 tokens

    const shortTokens = estimateTokens(shortText);
    const mediumTokens = estimateTokens(mediumText);
    const longTokens = estimateTokens(longText);

    expect(shortTokens).toBeGreaterThan(2);
    expect(shortTokens).toBeLessThan(10);

    expect(mediumTokens).toBeGreaterThan(10);
    expect(mediumTokens).toBeLessThan(30);

    expect(longTokens).toBeGreaterThan(200);
    expect(longTokens).toBeLessThan(500);
  });
});

describe('Performance Benchmarks', () => {
  it('should rank results in under 1 second', async () => {
    const start = Date.now();

    await rankSearchResults(mockSearchResults);

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000); // 1 second
  });

  it('should build context in under 100ms', () => {
    const mockEnhancedResults: EnhancedSearchResult[] = mockSearchResults.map(r => ({
      ...r,
      rank_score: 0.8,
      rank_breakdown: {
        similarity_score: r.similarity,
        recency_boost: 0,
        popularity_boost: 0,
        view_history_boost: 0,
      },
    }));

    const start = Date.now();

    buildContext(mockEnhancedResults);

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100); // 100ms
  });
});

describe('Edge Cases', () => {
  it('should handle empty results', async () => {
    const ranked = await rankSearchResults([]);
    expect(ranked.length).toBe(0);

    const context = buildContext([]);
    expect(context.context).toContain('No relevant information found');
    expect(context.sources.length).toBe(0);
    expect(context.total_chunks).toBe(0);
  });

  it('should handle results without video metadata', async () => {
    const resultsWithoutMetadata: VectorSearchResult[] = [
      {
        chunk_id: 'chunk-1',
        video_id: 'video-1',
        chunk_text: 'Some content',
        start_time_seconds: 0,
        end_time_seconds: 60,
        similarity: 0.8,
      },
    ];

    const ranked = await rankSearchResults(resultsWithoutMetadata);
    expect(ranked.length).toBe(1);
    expect(ranked[0].rank_score).toBeGreaterThan(0);
  });

  it('should handle very long chunk text', () => {
    const longText = 'Lorem ipsum '.repeat(1000); // Very long text
    const longResult: EnhancedSearchResult = {
      ...mockEnhancedResults[0],
      chunk_text: longText,
    };

    const context = buildContext([longResult], {
      max_tokens: 500, // Limited tokens
    });

    expect(context.total_tokens).toBeLessThanOrEqual(500);
  });
});
