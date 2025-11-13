/**
 * RAG Setup Verification Script
 *
 * Verifies that the RAG engine is properly configured:
 * - pgvector extension enabled
 * - Vector index exists and is healthy
 * - Search function available
 * - Cache connectivity
 *
 * Run with: npx tsx lib/rag/verify-setup.ts
 */

import { getServiceSupabase } from '@/lib/db/client';
import { kv } from '@vercel/kv';
import { getSearchStats } from '@/lib/video/vector-search';

interface VerificationResult {
  check: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: unknown;
}

const results: VerificationResult[] = [];

function logResult(result: VerificationResult): void {
  const icon = result.status === 'pass' ? '✓' : result.status === 'fail' ? '✗' : '⚠';
  const color = result.status === 'pass' ? '\x1b[32m' : result.status === 'fail' ? '\x1b[31m' : '\x1b[33m';
  const reset = '\x1b[0m';

  console.log(`${color}${icon}${reset} ${result.check}: ${result.message}`);
  if (result.details) {
    console.log(`  Details:`, result.details);
  }

  results.push(result);
}

async function verifyPgVector(): Promise<void> {
  console.log('\n1. Checking pgvector extension...');

  try {
    const supabase = getServiceSupabase();

    const { data: _data, error } = await (supabase as any).rpc('pg_extension_exists', {
      extension_name: 'vector',
    });

    if (error) {
      // Extension check function might not exist, try direct query
      const { data: extensions, error: extError } = await supabase
        .from('pg_extension')
        .select('extname')
        .eq('extname', 'vector')
        .single();

      if (extError) {
        logResult({
          check: 'pgvector Extension',
          status: 'fail',
          message: 'Unable to verify extension installation',
          details: extError,
        });
        return;
      }

      if (extensions) {
        logResult({
          check: 'pgvector Extension',
          status: 'pass',
          message: 'pgvector extension is installed',
        });
      }
    } else {
      logResult({
        check: 'pgvector Extension',
        status: 'pass',
        message: 'pgvector extension is enabled',
      });
    }
  } catch (error) {
    logResult({
      check: 'pgvector Extension',
      status: 'fail',
      message: 'Failed to check extension',
      details: error,
    });
  }
}

async function verifyVectorIndex(): Promise<void> {
  console.log('\n2. Checking vector similarity index...');

  try {
    const supabase = getServiceSupabase();

    // Check if index exists
    const { data: indexes, error } = await supabase
      .from('pg_indexes')
      .select('indexname, indexdef')
      .like('indexname', '%embedding%');

    if (error) {
      logResult({
        check: 'Vector Index',
        status: 'warn',
        message: 'Unable to verify index (permission issue)',
      });
      return;
    }

    const vectorIndex = indexes?.find((idx: any) =>
      idx.indexname === 'idx_video_chunks_embedding_cosine'
    );

    if (vectorIndex) {
      logResult({
        check: 'Vector Index',
        status: 'pass',
        message: 'IVFFlat index exists for cosine similarity',
        details: {
          index_name: (vectorIndex as any).indexname,
        },
      });
    } else {
      logResult({
        check: 'Vector Index',
        status: 'fail',
        message: 'Vector index not found (run migration 003)',
      });
    }
  } catch (error) {
    logResult({
      check: 'Vector Index',
      status: 'fail',
      message: 'Failed to check index',
      details: error,
    });
  }
}

async function verifySearchFunction(): Promise<void> {
  console.log('\n3. Checking search_video_chunks function...');

  try {
    const supabase = getServiceSupabase();

    // Try calling the function with a dummy embedding
    const dummyEmbedding = new Array(1536).fill(0);

    const { data: _data, error } = await (supabase as any).rpc('search_video_chunks', {
      query_embedding: dummyEmbedding,
      match_count: 1,
      similarity_threshold: 0.9,
      filter_video_ids: null,
    });

    if (error) {
      logResult({
        check: 'Search Function',
        status: 'fail',
        message: 'search_video_chunks function not available',
        details: error,
      });
    } else {
      logResult({
        check: 'Search Function',
        status: 'pass',
        message: 'search_video_chunks function is callable',
      });
    }
  } catch (error) {
    logResult({
      check: 'Search Function',
      status: 'fail',
      message: 'Failed to test search function',
      details: error,
    });
  }
}

async function verifyEmbeddingCoverage(): Promise<void> {
  console.log('\n4. Checking embedding coverage...');

  try {
    const stats = await getSearchStats();

    if (stats.total_chunks === 0) {
      logResult({
        check: 'Embedding Coverage',
        status: 'warn',
        message: 'No video chunks in database yet',
        details: stats,
      });
      return;
    }

    const coverage = stats.embedding_coverage_percent;

    if (coverage >= 95) {
      logResult({
        check: 'Embedding Coverage',
        status: 'pass',
        message: `Excellent coverage: ${coverage.toFixed(1)}%`,
        details: stats,
      });
    } else if (coverage >= 80) {
      logResult({
        check: 'Embedding Coverage',
        status: 'warn',
        message: `Good coverage: ${coverage.toFixed(1)}% (some chunks missing embeddings)`,
        details: stats,
      });
    } else {
      logResult({
        check: 'Embedding Coverage',
        status: 'fail',
        message: `Low coverage: ${coverage.toFixed(1)}% (many chunks without embeddings)`,
        details: stats,
      });
    }
  } catch (error) {
    logResult({
      check: 'Embedding Coverage',
      status: 'fail',
      message: 'Failed to get embedding statistics',
      details: error,
    });
  }
}

async function verifyCache(): Promise<void> {
  console.log('\n5. Checking Vercel KV cache connectivity...');

  try {
    // Try to write and read from cache
    const testKey = 'rag:test:verification';
    const testValue = { timestamp: Date.now(), test: true };

    await kv.set(testKey, testValue, { ex: 10 }); // 10 second expiry
    const retrieved = await kv.get(testKey);

    if (retrieved && typeof retrieved === 'object' && 'test' in retrieved) {
      logResult({
        check: 'Cache Connectivity',
        status: 'pass',
        message: 'Vercel KV cache is working',
      });

      // Clean up
      await kv.del(testKey);
    } else {
      logResult({
        check: 'Cache Connectivity',
        status: 'fail',
        message: 'Cache read/write test failed',
      });
    }
  } catch (error) {
    logResult({
      check: 'Cache Connectivity',
      status: 'fail',
      message: 'Unable to connect to Vercel KV',
      details: error,
    });
  }
}

async function verifyEnvironmentVariables(): Promise<void> {
  console.log('\n6. Checking environment variables...');

  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'VERCEL_KV_URL',
  ];

  const missing: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length === 0) {
    logResult({
      check: 'Environment Variables',
      status: 'pass',
      message: 'All required environment variables are set',
    });
  } else {
    logResult({
      check: 'Environment Variables',
      status: 'fail',
      message: `Missing environment variables: ${missing.join(', ')}`,
    });
  }
}

async function runVerification(): Promise<void> {
  console.log('='.repeat(60));
  console.log('RAG Engine Setup Verification');
  console.log('='.repeat(60));

  await verifyEnvironmentVariables();
  await verifyPgVector();
  await verifyVectorIndex();
  await verifySearchFunction();
  await verifyEmbeddingCoverage();
  await verifyCache();

  console.log('\n' + '='.repeat(60));
  console.log('Verification Summary');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warn').length;

  console.log(`\nTotal Checks: ${results.length}`);
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`⚠ Warnings: ${warnings}`);

  if (failed === 0) {
    console.log('\n🎉 All critical checks passed! RAG engine is ready.');
  } else {
    console.log('\n⚠️  Some checks failed. Please review the issues above.');
  }

  console.log('='.repeat(60));
}

// Run verification if executed directly
if (require.main === module) {
  runVerification()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\nVerification script failed:', error);
      process.exit(1);
    });
}

export { runVerification };
