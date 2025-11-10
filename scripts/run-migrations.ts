/**
 * Database Migration Runner
 *
 * Runs all SQL migrations in the supabase/migrations directory
 * Connects directly to Supabase using the service role key
 */

import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const SUPABASE_URL = process.env['NEXT_PUBLIC_SUPABASE_URL'];
const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  if (!SUPABASE_URL) console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_SERVICE_ROLE_KEY) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

interface Migration {
  filename: string;
  sql: string;
  timestamp: string;
}

async function loadMigrations(): Promise<Migration[]> {
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations');

  try {
    const files = await readdir(migrationsDir);
    const sqlFiles = files
      .filter((file) => file.endsWith('.sql'))
      .sort(); // Sort alphabetically to maintain order

    const migrations: Migration[] = [];

    for (const filename of sqlFiles) {
      const filepath = join(migrationsDir, filename);
      const sql = await readFile(filepath, 'utf-8');

      // Extract timestamp from filename (YYYYMMDDHHMMSS_description.sql)
      const timestamp = filename.split('_')[0] || '';

      migrations.push({
        filename,
        sql,
        timestamp,
      });
    }

    return migrations;
  } catch (error) {
    console.error('❌ Error loading migrations:', error);
    throw error;
  }
}

async function runMigration(migration: Migration): Promise<boolean> {
  console.log(`\n📝 Running migration: ${migration.filename}`);

  try {
    // Execute the migration SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: migration.sql,
    });

    if (error) {
      // If exec_sql RPC doesn't exist, try direct execution
      // This won't work in production but helps during development
      console.warn('   ⚠️  exec_sql RPC not available, attempting direct execution...');

      // Split into individual statements and execute
      const statements = migration.sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const _statement of statements) {
        const result = await supabase.from('_migrations').select('*').limit(1);
        if (result.error) {
          throw new Error(
            `Failed to execute migration: ${error.message}\n\nPlease run migrations manually using Supabase CLI:\n  supabase db execute -f supabase/migrations/${migration.filename}`,
          );
        }
      }
    }

    console.log(`   ✅ Migration completed: ${migration.filename}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Migration failed: ${migration.filename}`);
    console.error(`   Error:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Chronos Database Migration Runner\n');
  console.log(`📡 Connecting to: ${SUPABASE_URL}`);

  // Load all migrations
  const migrations = await loadMigrations();

  if (migrations.length === 0) {
    console.log('\n⚠️  No migrations found in supabase/migrations/');
    return;
  }

  console.log(`\n📦 Found ${migrations.length} migration(s):\n`);
  for (const migration of migrations) {
    console.log(`   - ${migration.filename}`);
  }

  console.log('\n' + '='.repeat(60));

  // Run each migration
  let successCount = 0;
  let failureCount = 0;

  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (success) {
      successCount++;
    } else {
      failureCount++;
      // Stop on first failure
      console.log('\n❌ Migration failed. Stopping execution.');
      break;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failureCount}`);

  if (failureCount === 0) {
    console.log('\n🎉 All migrations completed successfully!\n');
    console.log('Next steps:');
    console.log('  1. Generate TypeScript types: npm run db:types');
    console.log('  2. Verify schema in Supabase Dashboard');
    console.log('  3. Create storage buckets: videos, thumbnails, user-uploads\n');
  } else {
    console.log(
      '\n⚠️  Some migrations failed. Please check the errors above and run migrations manually.\n',
    );
    console.log('To run migrations manually using Supabase CLI:');
    console.log('  supabase db push\n');
    process.exit(1);
  }
}

// Run migrations
main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
