#!/usr/bin/env tsx
/**
 * Measure and report bundle size after production build
 * Usage: npm run build && npx tsx scripts/measure-bundle-size.ts
 */

import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const CHUNKS_DIR = join(process.cwd(), '.next/static/chunks');
const MAX_SIZE_KB = 500; // 500KB limit

interface ChunkInfo {
  name: string;
  size: number;
  sizeKB: number;
  sizeMB: number;
}

function getChunks(): ChunkInfo[] {
  try {
    const files = readdirSync(CHUNKS_DIR);
    return files
      .filter(f => f.endsWith('.js'))
      .map(file => {
        const filePath = join(CHUNKS_DIR, file);
        const stats = statSync(filePath);
        return {
          name: file,
          size: stats.size,
          sizeKB: Math.round(stats.size / 1024),
          sizeMB: parseFloat((stats.size / 1024 / 1024).toFixed(2))
        };
      })
      .sort((a, b) => b.size - a.size);
  } catch (error) {
    console.error('Error reading chunks directory. Did you run `npm run build` first?');
    process.exit(1);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function main() {
  console.log('📦 Bundle Size Analysis\n');
  console.log('='.repeat(80));

  const chunks = getChunks();
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
  const totalSizeKB = Math.round(totalSize / 1024);
  const totalSizeMB = parseFloat((totalSize / 1024 / 1024).toFixed(2));

  // Overall Summary
  console.log('\n📊 OVERALL SUMMARY');
  console.log('-'.repeat(80));
  console.log(`Total Bundle Size: ${formatBytes(totalSize)} (${totalSizeKB}KB)`);
  console.log(`Total Chunks: ${chunks.length}`);
  console.log(`Maximum Allowed: ${MAX_SIZE_KB}KB`);

  const withinLimit = totalSizeKB <= MAX_SIZE_KB;
  console.log(`Status: ${withinLimit ? '✅ Within limits' : '❌ EXCEEDS LIMIT'}`);

  if (!withinLimit) {
    const excess = totalSizeKB - MAX_SIZE_KB;
    console.log(`⚠️  Exceeded by: ${excess}KB (${((excess / MAX_SIZE_KB) * 100).toFixed(1)}%)`);
  } else {
    const remaining = MAX_SIZE_KB - totalSizeKB;
    console.log(`✅ Remaining budget: ${remaining}KB (${((remaining / MAX_SIZE_KB) * 100).toFixed(1)}%)`);
  }

  // Largest Chunks
  console.log('\n🔝 LARGEST CHUNKS (Top 10)');
  console.log('-'.repeat(80));
  console.log('Size (KB)'.padEnd(12) + 'Size (MB)'.padEnd(12) + 'File Name');
  console.log('-'.repeat(80));

  chunks.slice(0, 10).forEach(chunk => {
    const kbStr = `${chunk.sizeKB}KB`.padEnd(12);
    const mbStr = `${chunk.sizeMB}MB`.padEnd(12);
    console.log(`${kbStr}${mbStr}${chunk.name}`);
  });

  // Size Distribution
  console.log('\n📈 SIZE DISTRIBUTION');
  console.log('-'.repeat(80));

  const ranges = [
    { label: '< 10KB', min: 0, max: 10 },
    { label: '10-50KB', min: 10, max: 50 },
    { label: '50-100KB', min: 50, max: 100 },
    { label: '100-500KB', min: 100, max: 500 },
    { label: '> 500KB', min: 500, max: Infinity }
  ];

  ranges.forEach(range => {
    const count = chunks.filter(c => c.sizeKB >= range.min && c.sizeKB < range.max).length;
    const percentage = ((count / chunks.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / 2));
    console.log(`${range.label.padEnd(12)}: ${count.toString().padStart(3)} chunks (${percentage.padStart(5)}%) ${bar}`);
  });

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('-'.repeat(80));

  const largeChunks = chunks.filter(c => c.sizeKB > 100);
  if (largeChunks.length > 0) {
    console.log('⚠️  Found large chunks (>100KB):');
    largeChunks.forEach(chunk => {
      console.log(`   - ${chunk.name}: ${chunk.sizeKB}KB`);
    });
    console.log('\n   Consider:');
    console.log('   1. Dynamic imports for heavy libraries');
    console.log('   2. Code splitting for route-specific code');
    console.log('   3. Tree-shaking unused exports');
  }

  const vendorChunks = chunks.filter(c => c.name.includes('vendor'));
  if (vendorChunks.length > 0) {
    const vendorSize = vendorChunks.reduce((sum, c) => sum + c.size, 0);
    const vendorPercentage = ((vendorSize / totalSize) * 100).toFixed(1);
    console.log(`\n📦 Vendor chunks: ${formatBytes(vendorSize)} (${vendorPercentage}% of total)`);
    if (parseFloat(vendorPercentage) > 50) {
      console.log('   ⚠️  Vendor code exceeds 50% of bundle');
      console.log('   Consider splitting vendors by usage frequency');
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Analysis complete! Run `npm run analyze` for interactive visualization.\n');

  // Exit with error if exceeds limit (for CI)
  if (!withinLimit && process.env.CI) {
    process.exit(1);
  }
}

main();
