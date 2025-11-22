#!/usr/bin/env node
/**
 * Check Video Embeddings Script
 *
 * Verifies that video chunks and embeddings were created successfully
 * for the imported Rick Astley video.
 *
 * Usage: npx tsx scripts/check-video-embeddings.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test creator ID
const TEST_CREATOR_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  console.log('🔍 Checking video embeddings...\n');

  // Get the most recent video
  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select('id, title, status, source_type, created_at')
    .eq('creator_id', TEST_CREATOR_ID)
    .order('created_at', { ascending: false })
    .limit(1);

  if (videosError) {
    console.error('❌ Error fetching videos:', videosError);
    return;
  }

  if (!videos || videos.length === 0) {
    console.log('⚠️  No videos found for test creator');
    return;
  }

  const video = videos[0];
  console.log('📹 Video Details:');
  console.log(`   ID: ${video.id}`);
  console.log(`   Title: ${video.title}`);
  console.log(`   Status: ${video.status}`);
  console.log(`   Source: ${video.source_type}`);
  console.log(`   Created: ${video.created_at}\n`);

  // Check video chunks
  const { data: chunks, error: chunksError } = await supabase
    .from('video_chunks')
    .select('id, chunk_index, start_time_seconds, end_time_seconds, chunk_text, embedding')
    .eq('video_id', video.id)
    .order('chunk_index');

  if (chunksError) {
    console.error('❌ Error fetching chunks:', chunksError);
    return;
  }

  console.log(`📦 Video Chunks: ${chunks?.length || 0} total\n`);

  if (chunks && chunks.length > 0) {
    // Count embeddings
    const embeddings_count = chunks.filter(c => c.embedding !== null).length;
    console.log(`✅ Embeddings: ${embeddings_count}/${chunks.length} chunks have embeddings\n`);

    // Show first 3 chunks
    console.log('📝 Sample Chunks (first 3):\n');
    chunks.slice(0, 3).forEach(chunk => {
      console.log(`   Chunk ${chunk.chunk_index}:`);
      console.log(`   - Time: ${chunk.start_time_seconds}s → ${chunk.end_time_seconds}s`);
      console.log(`   - Text: ${chunk.chunk_text.substring(0, 100)}...`);
      console.log(`   - Embedding: ${chunk.embedding ? 'YES ✓' : 'NO ✗'}\n`);
    });

    // Summary
    if (embeddings_count === chunks.length) {
      console.log('✅ SUCCESS: All chunks have embeddings! RAG search ready.\n');
    } else {
      console.log(`⚠️  WARNING: ${chunks.length - embeddings_count} chunks missing embeddings\n`);
    }
  } else {
    console.log('⚠️  No chunks found - video processing may not be complete\n');
  }
}

main().catch(console.error);
