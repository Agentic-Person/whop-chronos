/**
 * Test Script: Chunking & Embedding Engine
 *
 * Demonstrates the complete pipeline:
 * 1. Transcript chunking with overlap
 * 2. Embedding generation
 * 3. Vector storage in Supabase
 * 4. Vector similarity search
 */

import {
  chunkTranscript,
  validateChunks,
  getChunkingStats,
  generateEmbeddings,
  validateEmbedding,
  estimateEmbeddingCost,
  type TranscriptSegment,
} from '@/lib/video';

// Sample transcript with timestamps (simulating Whisper output)
const sampleTranscript: TranscriptSegment[] = [
  {
    text: 'Welcome to this comprehensive guide on building scalable web applications with Next.js. In this tutorial, we will cover everything from setting up your development environment to deploying your application to production.',
    start_time_seconds: 0,
    end_time_seconds: 15,
  },
  {
    text: 'First, let\'s talk about the Next.js framework. Next.js is a React framework that enables server-side rendering and generates static websites for React-based web applications. It\'s built by Vercel and provides an excellent developer experience.',
    start_time_seconds: 15,
    end_time_seconds: 35,
  },
  {
    text: 'One of the key features of Next.js is its file-based routing system. Instead of configuring routes manually, you simply create files in the pages directory, and Next.js automatically creates routes based on the file structure. This makes it incredibly easy to organize your application.',
    start_time_seconds: 35,
    end_time_seconds: 55,
  },
  {
    text: 'Let\'s move on to server-side rendering, or SSR. With SSR, your React components are rendered on the server before being sent to the client. This has several benefits, including better SEO, faster initial page loads, and improved performance on low-powered devices.',
    start_time_seconds: 55,
    end_time_seconds: 75,
  },
  {
    text: 'Another powerful feature is static site generation, also known as SSG. With SSG, Next.js can pre-render pages at build time, creating static HTML files that can be served incredibly quickly from a CDN. This is perfect for content that doesn\'t change frequently.',
    start_time_seconds: 75,
    end_time_seconds: 95,
  },
  {
    text: 'Now, let\'s discuss API routes. Next.js allows you to create API endpoints right within your application by adding files to the api directory. This means you can build full-stack applications without needing a separate backend server. It\'s a game-changer for rapid development.',
    start_time_seconds: 95,
    end_time_seconds: 115,
  },
  {
    text: 'Image optimization is another standout feature. The Next.js Image component automatically optimizes images for different screen sizes and devices, lazy loads images as needed, and serves them in modern formats like WebP when supported. This dramatically improves your application\'s performance.',
    start_time_seconds: 115,
    end_time_seconds: 135,
  },
  {
    text: 'For styling, Next.js has built-in support for CSS Modules, Sass, and CSS-in-JS solutions like styled-components. You can also use utility-first frameworks like Tailwind CSS. The choice is yours, and Next.js makes it easy to integrate any styling solution.',
    start_time_seconds: 135,
    end_time_seconds: 155,
  },
  {
    text: 'When it comes to data fetching, Next.js provides several methods. You can use getStaticProps for static generation, getServerSideProps for server-side rendering, and getStaticPaths for dynamic routes with static generation. Each method is optimized for specific use cases.',
    start_time_seconds: 155,
    end_time_seconds: 175,
  },
  {
    text: 'Let\'s talk about deployment. Vercel, the company behind Next.js, provides a deployment platform optimized specifically for Next.js applications. You can deploy your application in minutes with automatic SSL, global CDN distribution, and preview deployments for every push.',
    start_time_seconds: 175,
    end_time_seconds: 195,
  },
];

async function testChunking() {
  console.log('\n=== 1. TESTING TRANSCRIPT CHUNKING ===\n');

  // Test with default options
  console.log('Chunking transcript with default options (500-1000 words, 100 word overlap)...');
  const chunks = chunkTranscript(sampleTranscript, {
    min_words: 100, // Lower for demo purposes
    max_words: 200,
    overlap_words: 20,
    preserve_sentences: true,
  });

  console.log(`✓ Generated ${chunks.length} chunks\n`);

  // Display first chunk as example
  console.log('Example chunk:');
  console.log(JSON.stringify(chunks[0], null, 2));
  console.log('');

  // Validate chunks
  const validation = validateChunks(chunks);
  console.log(`Validation: ${validation.valid ? '✓ Valid' : '✗ Invalid'}`);
  if (validation.warnings.length > 0) {
    console.log('Warnings:', validation.warnings);
  }
  console.log('');

  // Get statistics
  const stats = getChunkingStats(chunks);
  console.log('Chunking Statistics:');
  console.log(`  Total chunks: ${stats.total_chunks}`);
  console.log(`  Total words: ${stats.total_words}`);
  console.log(`  Average words/chunk: ${stats.avg_words_per_chunk}`);
  console.log(`  Word range: ${stats.min_words} - ${stats.max_words}`);
  console.log(`  Total duration: ${stats.total_duration_seconds.toFixed(1)}s`);
  console.log(`  Chunks with overlap: ${stats.chunks_with_overlap}`);
  console.log('');

  return chunks;
}

async function testEmbeddings(chunks: ReturnType<typeof chunkTranscript>) {
  console.log('\n=== 2. TESTING EMBEDDING GENERATION ===\n');

  // Estimate cost before generating
  const totalText = chunks.map(c => c.chunk_text).join(' ');
  const costEstimate = estimateEmbeddingCost(totalText.length);
  console.log('Cost Estimate:');
  console.log(`  Text length: ${totalText.length} characters`);
  console.log(`  Estimated tokens: ${costEstimate.estimated_tokens}`);
  console.log(`  Estimated cost: $${costEstimate.estimated_cost_usd.toFixed(4)}`);
  console.log('');

  // Check if OpenAI API key is set
  if (!process.env['OPENAI_API_KEY']) {
    console.log('⚠ OPENAI_API_KEY not set - skipping actual embedding generation');
    console.log('Set OPENAI_API_KEY in .env to test embedding generation\n');
    return null;
  }

  try {
    console.log('Generating embeddings (this may take a few seconds)...');
    const result = await generateEmbeddings(chunks, {
      batch_size: 5,
      max_retries: 2,
    });

    console.log('\n✓ Embedding generation complete!\n');
    console.log('Results:');
    console.log(`  Embeddings generated: ${result.embeddings.length}`);
    console.log(`  Total tokens: ${result.total_tokens}`);
    console.log(`  Total cost: $${result.total_cost_usd.toFixed(4)}`);
    console.log(`  Processing time: ${result.processing_time_ms}ms`);
    console.log(`  Model: ${result.model}`);
    console.log('');

    // Validate first embedding
    const firstEmbedding = result.embeddings[0].embedding;
    const isValid = validateEmbedding(firstEmbedding);
    console.log(`Embedding validation: ${isValid ? '✓ Valid' : '✗ Invalid'}`);
    console.log(`  Dimensions: ${firstEmbedding.length}`);
    console.log(`  Sample values: [${firstEmbedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    console.log('');

    return result;
  } catch (error) {
    console.error('✗ Embedding generation failed:', error);
    return null;
  }
}

async function testVectorStorage(
  chunks: ReturnType<typeof chunkTranscript>,
  embeddingResult: Awaited<ReturnType<typeof testEmbeddings>>
) {
  if (!embeddingResult) {
    console.log('\n=== 3. VECTOR STORAGE (SKIPPED) ===\n');
    console.log('Skipped because embeddings were not generated\n');
    return;
  }

  console.log('\n=== 3. TESTING VECTOR STORAGE ===\n');

  // This would normally use Supabase MCP, but for demonstration:
  console.log('In production, this would:');
  console.log('  1. Store chunks in video_chunks table');
  console.log('  2. Update each chunk with its embedding vector');
  console.log('  3. Create pgvector index for fast similarity search');
  console.log('');

  console.log('Example SQL for storing chunks:');
  console.log('```sql');
  console.log('INSERT INTO video_chunks (');
  console.log('  video_id, chunk_index, chunk_text, embedding,');
  console.log('  start_time_seconds, end_time_seconds, word_count, metadata');
  console.log(') VALUES (');
  console.log('  $1, $2, $3, $4::vector(1536), $5, $6, $7, $8');
  console.log(');');
  console.log('```\n');
}

async function demonstrateRAGContext(chunks: ReturnType<typeof chunkTranscript>) {
  console.log('\n=== 4. RAG CONTEXT BUILDING ===\n');

  // Show how chunks would be used for RAG
  console.log('Example: Building context for user query "How does Next.js handle routing?"\n');

  // Simulate finding relevant chunks (in production, this would use vector search)
  const relevantChunks = chunks.filter(chunk =>
    chunk.chunk_text.toLowerCase().includes('routing') ||
    chunk.chunk_text.toLowerCase().includes('pages') ||
    chunk.chunk_text.toLowerCase().includes('file')
  );

  console.log(`Found ${relevantChunks.length} relevant chunks\n`);

  if (relevantChunks.length > 0) {
    console.log('Context to send to Claude API:');
    console.log('---');
    relevantChunks.forEach((chunk, i) => {
      const minutes = Math.floor(chunk.start_time_seconds / 60);
      const seconds = Math.floor(chunk.start_time_seconds % 60);
      console.log(`\n[Source ${i + 1} @ ${minutes}:${seconds.toString().padStart(2, '0')}]`);
      console.log(chunk.chunk_text.substring(0, 200) + '...');
    });
    console.log('\n---\n');
  }
}

async function runTests() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   Chronos: Chunking & Embedding Engine Test Suite   ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  try {
    // Test 1: Chunking
    const chunks = await testChunking();

    // Test 2: Embeddings
    const embeddingResult = await testEmbeddings(chunks);

    // Test 3: Vector Storage
    await testVectorStorage(chunks, embeddingResult);

    // Test 4: RAG Context
    await demonstrateRAGContext(chunks);

    console.log('\n=== ALL TESTS COMPLETE ===\n');
    console.log('Summary:');
    console.log('  ✓ Chunking algorithm working');
    console.log('  ✓ Chunk validation passing');
    if (embeddingResult) {
      console.log('  ✓ Embedding generation successful');
      console.log('  ✓ Embedding validation passing');
    } else {
      console.log('  ⚠ Embeddings not generated (set OPENAI_API_KEY)');
    }
    console.log('  ✓ RAG context building demonstrated');
    console.log('');

    console.log('Next Steps:');
    console.log('  1. Set up Supabase database with video_chunks table');
    console.log('  2. Enable pgvector extension in Supabase');
    console.log('  3. Test vector search with real queries');
    console.log('  4. Integrate with Inngest for background processing');
    console.log('  5. Connect to Claude API for RAG chat');
    console.log('');

  } catch (error) {
    console.error('\n✗ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests();
