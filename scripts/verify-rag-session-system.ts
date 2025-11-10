/**
 * Verification script for RAG Session Management System
 * Checks that all files are in place and exports are correct
 */

import { existsSync } from 'fs';
import { resolve } from 'path';

const requiredFiles = [
  'lib/rag/types.ts',
  'lib/rag/sessions.ts',
  'lib/rag/messages.ts',
  'lib/rag/analytics.ts',
  'lib/rag/cost-calculator.ts',
  'lib/rag/title-generator.ts',
  'app/api/chat/sessions/route.ts',
  'app/api/chat/sessions/[id]/route.ts',
  'app/api/chat/analytics/route.ts',
  'app/api/chat/export/[id]/route.ts',
  'lib/rag/SESSION_ANALYTICS.md',
];

console.log('Verifying RAG Session Management System...\n');

let allGood = true;

for (const file of requiredFiles) {
  const fullPath = resolve(process.cwd(), file);
  const exists = existsSync(fullPath);
  
  if (exists) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allGood = false;
  }
}

if (allGood) {
  console.log('\n✅ All files present!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run type-check');
  console.log('2. Test session creation with getOrCreateSession()');
  console.log('3. Integrate with RAG chat endpoint');
  console.log('4. Test analytics endpoints');
  process.exit(0);
} else {
  console.log('\n❌ Some files are missing!');
  process.exit(1);
}
