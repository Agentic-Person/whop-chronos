const fs = require('fs');
const { Client } = require('pg');

const client = new Client({
  host: 'aws-1-us-east-2.pooler.supabase.com',
  port: 6543,
  user: 'postgres.dddttlnrkwaddzjvkacp',
  password: 'TsM2WqCrk22bbLGu',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  await client.connect();
  console.log('Connected to Supabase\n');

  try {
    // Step 1: Add columns without constraint
    console.log('Step 1: Adding source_type column...');
    await client.query(`
      ALTER TABLE videos
      ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'upload';
    `);
    console.log('✓ source_type column added\n');

    console.log('Step 2: Adding YouTube-specific columns...');
    await client.query(`
      ALTER TABLE videos
      ADD COLUMN IF NOT EXISTS youtube_video_id TEXT,
      ADD COLUMN IF NOT EXISTS youtube_channel_id TEXT;
    `);
    console.log('✓ YouTube columns added\n');

    // Step 2: Update existing rows based on their data
    console.log('Step 3: Updating existing records...');
    // Set to 'upload' where storage_path exists
    await client.query(`
      UPDATE videos
      SET source_type = 'upload'
      WHERE storage_path IS NOT NULL AND source_type IS NULL;
    `);

    // Check records with null storage_path
    const nullPathResult = await client.query(`
      SELECT id, title, storage_path, url
      FROM videos
      WHERE storage_path IS NULL;
    `);
    console.log('Records with null storage_path:', nullPathResult.rows.length);
    console.table(nullPathResult.rows);

    // For seed/test data, set a placeholder storage_path
    await client.query(`
      UPDATE videos
      SET storage_path = 'seed-data/' || id::text || '.mp4'
      WHERE storage_path IS NULL AND source_type = 'upload';
    `);
    console.log('✓ Updated existing records\n');

    // Step 3: Create indexes
    console.log('Step 4: Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_videos_source_type ON videos(source_type);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_videos_youtube_video_id ON videos(youtube_video_id) WHERE youtube_video_id IS NOT NULL;
    `);
    console.log('✓ Indexes created\n');

    // Step 4: Add constraint (now that data is clean)
    console.log('Step 5: Adding validation constraint...');
    await client.query(`
      ALTER TABLE videos
      ADD CONSTRAINT videos_source_validation CHECK (
        (source_type = 'youtube' AND youtube_video_id IS NOT NULL AND storage_path IS NULL) OR
        (source_type = 'upload' AND storage_path IS NOT NULL AND youtube_video_id IS NULL)
      );
    `);
    console.log('✓ Constraint added\n');

    // Step 5: Add comments
    console.log('Step 6: Adding column comments...');
    await client.query(`
      COMMENT ON COLUMN videos.source_type IS 'Source of video: youtube (embedded) or upload (file upload)';
      COMMENT ON COLUMN videos.youtube_video_id IS 'YouTube video ID (11 characters) for embedded videos';
      COMMENT ON COLUMN videos.youtube_channel_id IS 'YouTube channel ID for attribution and analytics';
    `);
    console.log('✓ Comments added\n');

    console.log('✅ Migration completed successfully!');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}

runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
