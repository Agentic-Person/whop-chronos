/**
 * Performance Benchmarking for RAG Engine
 *
 * Run this script to test search performance and accuracy:
 * npx tsx lib/rag/__tests__/benchmark.ts
 */

import { enhancedSearch, getSearchMetrics } from '../search';
import { buildContext } from '../context-builder';

interface BenchmarkResult {
  query: string;
  search_time_ms: number;
  results_count: number;
  avg_similarity: number;
  context_build_time_ms: number;
  total_tokens: number;
}

const TEST_QUERIES = [
  'How do I get started with TypeScript?',
  'What are the benefits of using types?',
  'How to set up a new project?',
  'Explain generics and when to use them',
  'What is the difference between interface and type?',
  'How to handle errors in TypeScript?',
  'Best practices for organizing code',
  'How to use async/await?',
  'What are decorators and how do they work?',
  'How to configure tsconfig.json?',
];

async function runBenchmark(): Promise<void> {
  console.log('='.repeat(60));
  console.log('RAG Engine Performance Benchmark');
  console.log('='.repeat(60));
  console.log();

  const results: BenchmarkResult[] = [];

  for (const query of TEST_QUERIES) {
    console.log(`Testing: "${query.substring(0, 50)}..."`);

    // Benchmark search
    const searchStart = Date.now();
    const searchResults = await enhancedSearch(query, {
      match_count: 5,
      similarity_threshold: 0.7,
      enable_cache: false, // Disable cache for accurate timing
    });
    const searchTime = Date.now() - searchStart;

    // Calculate average similarity
    const avgSimilarity = searchResults.length > 0
      ? searchResults.reduce((sum, r) => sum + r.similarity, 0) / searchResults.length
      : 0;

    // Benchmark context building
    const contextStart = Date.now();
    const context = buildContext(searchResults, {
      max_tokens: 8000,
      format: 'markdown',
    });
    const contextTime = Date.now() - contextStart;

    results.push({
      query,
      search_time_ms: searchTime,
      results_count: searchResults.length,
      avg_similarity: avgSimilarity,
      context_build_time_ms: contextTime,
      total_tokens: context.total_tokens,
    });

    console.log(`  ✓ Search: ${searchTime}ms | Results: ${searchResults.length} | Context: ${contextTime}ms`);
    console.log();
  }

  // Calculate aggregate statistics
  console.log('='.repeat(60));
  console.log('Performance Summary');
  console.log('='.repeat(60));
  console.log();

  const avgSearchTime = results.reduce((sum, r) => sum + r.search_time_ms, 0) / results.length;
  const maxSearchTime = Math.max(...results.map(r => r.search_time_ms));
  const minSearchTime = Math.min(...results.map(r => r.search_time_ms));

  const avgContextTime = results.reduce((sum, r) => sum + r.context_build_time_ms, 0) / results.length;
  const avgTokens = results.reduce((sum, r) => sum + r.total_tokens, 0) / results.length;
  const avgResults = results.reduce((sum, r) => sum + r.results_count, 0) / results.length;
  const avgSimilarity = results.reduce((sum, r) => sum + r.avg_similarity, 0) / results.length;

  console.log(`Total Queries Tested: ${results.length}`);
  console.log();
  console.log('Search Performance:');
  console.log(`  Average Time: ${avgSearchTime.toFixed(2)}ms`);
  console.log(`  Min Time: ${minSearchTime}ms`);
  console.log(`  Max Time: ${maxSearchTime}ms`);
  console.log(`  Target: < 2000ms (${avgSearchTime < 2000 ? '✓ PASS' : '✗ FAIL'})`);
  console.log();
  console.log('Context Building:');
  console.log(`  Average Time: ${avgContextTime.toFixed(2)}ms`);
  console.log(`  Target: < 100ms (${avgContextTime < 100 ? '✓ PASS' : '✗ FAIL'})`);
  console.log();
  console.log('Result Quality:');
  console.log(`  Average Results per Query: ${avgResults.toFixed(2)}`);
  console.log(`  Average Similarity Score: ${avgSimilarity.toFixed(3)}`);
  console.log(`  Average Context Tokens: ${avgTokens.toFixed(0)}`);
  console.log();

  // Cache metrics
  const cacheMetrics = await getSearchMetrics();
  console.log('Cache Performance:');
  console.log(`  Total Searches: ${cacheMetrics.total_searches}`);
  console.log(`  Cache Hits: ${cacheMetrics.cache_hits}`);
  console.log(`  Cache Misses: ${cacheMetrics.cache_misses}`);
  console.log(`  Hit Rate: ${(cacheMetrics.cache_hit_rate * 100).toFixed(2)}%`);
  console.log();

  // Performance grade
  const searchPassed = avgSearchTime < 2000;
  const contextPassed = avgContextTime < 100;
  const qualityPassed = avgSimilarity > 0.7 && avgResults >= 3;

  console.log('='.repeat(60));
  console.log('Overall Performance Grade:');
  console.log(`  Search Speed: ${searchPassed ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  Context Speed: ${contextPassed ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  Result Quality: ${qualityPassed ? '✓ PASS' : '✗ FAIL'}`);
  console.log();

  if (searchPassed && contextPassed && qualityPassed) {
    console.log('🎉 All benchmarks passed!');
  } else {
    console.log('⚠️  Some benchmarks failed. Review performance optimizations.');
  }

  console.log('='.repeat(60));
}

// Run benchmark if executed directly
if (require.main === module) {
  runBenchmark()
    .then(() => {
      console.log('\nBenchmark complete.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Benchmark failed:', error);
      process.exit(1);
    });
}

export { runBenchmark };
