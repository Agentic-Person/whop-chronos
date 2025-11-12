# Quick Setup: Create Thumbnails Bucket

## Current Status

✓ `videos` bucket exists and is configured
✗ `thumbnails` bucket is MISSING

## Why This is Needed

The thumbnails bucket is required for:
- Storing video thumbnail images
- Auto-generated thumbnails during video processing
- Custom course thumbnails uploaded by creators

Without it, video uploads will succeed but thumbnail operations will fail.

## Quick Fix (5 minutes)

### Method 1: Supabase Dashboard (Easiest)

1. Open your Supabase project dashboard
2. Click **Storage** in the left sidebar
3. Click the **New Bucket** button
4. Fill in the form:
   - **Name**: `thumbnails`
   - **Public bucket**: Leave UNCHECKED (keep it private)
5. Click **Create bucket**
6. Done! Run `npm run verify:storage` to confirm

### Method 2: Run SQL Script (Automated)

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New query**
4. Copy and paste the entire contents of `supabase/setup-storage.sql`
5. Click **Run**
6. Done! This will create the bucket AND set up all policies

### Method 3: Supabase CLI (Developer-Friendly)

```bash
# Make sure you're linked to your project
supabase link --project-ref <your-project-ref>

# Create the bucket
supabase storage create thumbnails --public=false

# Apply policies
supabase db push
```

## Verify Setup

After creating the bucket, run:

```bash
npm run verify:storage
```

You should see:

```
✓ Bucket 'videos' exists
✓ Bucket 'thumbnails' exists
✓ Upload URL generated successfully
✓ File uploaded successfully
✓ File downloaded successfully
✓ All storage verification tests passed!
```

## What Gets Created

The thumbnails bucket will have:

- **Max file size**: 10 MB
- **Allowed types**: JPEG, PNG, WebP, GIF
- **Access**: Private (requires authentication)
- **Policies**:
  - Creators can upload thumbnails to their folder
  - Creators can read their own thumbnails
  - Creators can delete their own thumbnails
  - Service role has full access (for background jobs)

## Troubleshooting

### "Already exists" Error

If you get an error that the bucket already exists:
1. Check if it's in a different Supabase project
2. Run `npm run verify:storage` to confirm
3. If it exists but verification fails, check RLS policies

### RLS Policies Not Working

After creating the bucket, make sure to run the SQL script to set up policies:

1. Go to SQL Editor in Supabase Dashboard
2. Run the contents of `supabase/setup-storage.sql`

Or check policies manually:
1. Go to **Storage** > **Policies**
2. Select the `thumbnails` bucket
3. You should see 4 policies listed

## Next Steps

After setup:
1. Run verification script
2. Test video upload in the app
3. Check that thumbnails are being generated
4. Monitor storage usage in Supabase Dashboard

## Need Help?

- See full guide: [STORAGE_SETUP.md](./STORAGE_SETUP.md)
- Check verification report: [STORAGE_VERIFICATION_REPORT.md](./STORAGE_VERIFICATION_REPORT.md)
- Review Supabase docs: https://supabase.com/docs/guides/storage
