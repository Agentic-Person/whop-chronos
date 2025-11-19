/**
 * Script to run seed.sql against Supabase database
 * Usage: npx tsx scripts/run-seed.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runSeedData() {
  console.log('📦 Loading seed.sql...');

  // Read seed.sql file
  const seedPath = path.join(process.cwd(), 'supabase', 'seed.sql');
  const seedSQL = fs.readFileSync(seedPath, 'utf-8');

  console.log('🚀 Executing seed data...');
  console.log(`   SQL file size: ${(seedSQL.length / 1024).toFixed(2)} KB`);

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: seedSQL });

    if (error) {
      // Supabase doesn't have exec_sql RPC by default, so let's split and execute
      console.log('⚙️  Executing SQL in chunks...');

      // Split by statement (naive split by semicolon, may need refinement)
      const statements = seedSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`   Found ${statements.length} SQL statements`);

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];

        // Skip comments
        if (statement.startsWith('--')) continue;

        try {
          await supabase.rpc('exec', { sql: statement + ';' });
          successCount++;

          if (i % 10 === 0) {
            console.log(`   Progress: ${i + 1}/${statements.length}`);
          }
        } catch (err: any) {
          // Some errors are OK (like "already exists" for ON CONFLICT DO NOTHING)
          if (err.message?.includes('already exists') ||
              err.message?.includes('duplicate key')) {
            successCount++;
            continue;
          }

          console.warn(`   ⚠️  Statement ${i + 1} failed:`, err.message);
          errorCount++;
        }
      }

      console.log(`\n✅ Seed data execution complete!`);
      console.log(`   Successful: ${successCount} statements`);
      console.log(`   Errors: ${errorCount} statements`);
    } else {
      console.log('✅ Seed data applied successfully!');
    }

    console.log('\n🎉 Done! Test accounts created:');
    console.log('   Creator ID: 00000000-0000-0000-0000-000000000001');
    console.log('   Student ID: 00000000-0000-0000-0000-000000000002');

  } catch (error: any) {
    console.error('❌ Error executing seed data:', error.message);
    process.exit(1);
  }
}

runSeedData().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
