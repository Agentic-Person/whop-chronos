# Supabase Storage Verification Report

## Date: 2025-11-11

## Summary

This report documents the Supabase Storage configuration status for the Chronos project.

## Verification Results

### Bucket Status

| Bucket Name | Status | Public | Created Date |
|-------------|--------|--------|--------------|
| `videos` | ✓ Exists | No (Private) | 10/25/2025, 10:06:40 PM |
| `thumbnails` | ✗ Missing | - | - |

### Issues Found

1. **Missing Thumbnails Bucket**
   - Status: Not created
   - Impact: Video thumbnail uploads will fail
   - Priority: High
   - Action Required: Create the bucket manually

## How to Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New Bucket**
4. Create the `thumbnails` bucket:
   - **Name**: `thumbnails`
   - **Public bucket**: Unchecked (keep it private)
   - Click **Create bucket**

### Option 2: Using SQL Script

Run the storage setup SQL script that's already in the project:

```bash
# Navigate to Supabase Dashboard > SQL Editor
# Copy and paste the contents of: supabase/setup-storage.sql
# Execute the script
```

Or run it via psql CLI:

```bash
psql -h <your-supabase-host> -U postgres -d postgres -f supabase/setup-storage.sql
```

### Option 3: Using Supabase CLI

```bash
# Make sure you're linked to your Supabase project
supabase link --project-ref <your-project-ref>

# Create the thumbnails bucket
supabase storage create thumbnails --public=false
```

## Bucket Configuration Details

### Videos Bucket (Already Configured)

- **Purpose**: Store uploaded video files
- **Access**: Private (requires authentication)
- **Max File Size**: 5 GB
- **Allowed MIME Types**:
  - video/mp4
  - video/webm
  - video/quicktime
  - video/x-msvideo (AVI)
  - video/x-matroska (MKV)
- **File Path Structure**: `{creatorId}/{videoId}/{timestamp}.{ext}`

### Thumbnails Bucket (Needs to be Created)

- **Purpose**: Store video thumbnail images
- **Access**: Private (requires authentication)
- **Max File Size**: 10 MB
- **Allowed MIME Types**:
  - image/jpeg
  - image/png
  - image/webp
  - image/gif
- **File Path Structure**: `{creatorId}/{videoId}/thumbnail-{timestamp}.jpg`

## Storage Policies Required

After creating the `thumbnails` bucket, ensure these RLS policies are in place:

### Thumbnails Bucket Policies

1. **Upload Policy**
   ```sql
   CREATE POLICY "Creators can upload thumbnails"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'thumbnails' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

2. **Read Policy**
   ```sql
   CREATE POLICY "Creators can read their own thumbnails"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (
     bucket_id = 'thumbnails' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

3. **Delete Policy**
   ```sql
   CREATE POLICY "Creators can delete their own thumbnails"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (
     bucket_id = 'thumbnails' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

4. **Service Role Access**
   ```sql
   CREATE POLICY "Service role has full access to thumbnails"
   ON storage.objects FOR ALL
   TO service_role
   USING (bucket_id = 'thumbnails')
   WITH CHECK (bucket_id = 'thumbnails');
   ```

**Note**: These policies are automatically created if you run the `supabase/setup-storage.sql` script.

## Verification Script

The project includes a verification script to test storage configuration:

```bash
npm run verify:storage
```

This script:
1. ✓ Checks if buckets exist
2. ✓ Tests upload URL generation
3. ✓ Uploads a small test file
4. ✓ Tests download URL generation
5. ✓ Downloads the test file
6. ✓ Cleans up test files

### Script Output

When properly configured, you should see:

```
Chronos Storage Verification
This script will verify Supabase Storage configuration

=== Checking Storage Buckets ===
✓ Bucket 'videos' exists
  - ID: videos
  - Public: false
  - Created: 10/25/2025, 10:06:40 PM
✓ Bucket 'thumbnails' exists
  - ID: thumbnails
  - Public: false
  - Created: [date]

=== Checking Bucket Policies ===
ℹ Bucket policies should be configured as follows:
...

=== Creating Test File ===
✓ Test file created

=== Testing Upload URL Generation ===
✓ Upload URL generated successfully

=== Testing File Upload ===
✓ File uploaded successfully

=== Testing Download URL Generation ===
✓ Download URL generated successfully

=== Testing File Download ===
✓ File downloaded successfully

=== Cleaning Up ===
✓ Test file deleted from storage
✓ Local test file deleted

=== Verification Summary ===
✓ All storage verification tests passed!

Storage is properly configured for video uploads.
```

## Related Files

- **Verification Script**: `scripts/verify-storage.ts`
- **Storage Utilities**: `lib/video/storage.ts`
- **Storage Setup SQL**: `supabase/setup-storage.sql`
- **Setup Documentation**: `docs/STORAGE_SETUP.md`
- **Supabase Client**: `lib/db/client.ts`

## Next Steps

1. **Create the thumbnails bucket** using one of the methods above
2. **Run the verification script** again: `npm run verify:storage`
3. **Verify all tests pass** before deploying to production
4. **Set up storage policies** if not already done via the SQL script

## Security Checklist

- [x] Videos bucket is private (requires authentication)
- [ ] Thumbnails bucket is private (needs to be created)
- [x] Service role key is stored in environment variables (not committed)
- [x] RLS policies enforce creator-specific access
- [x] File size limits are enforced at bucket level
- [x] MIME type restrictions are in place

## Storage Quotas by Tier

| Tier | Storage Limit | Max Videos | Monthly Uploads | Max File Size |
|------|---------------|------------|-----------------|---------------|
| Basic | 10 GB | 50 | 20 | 2 GB |
| Pro | 100 GB | 500 | 100 | 5 GB |
| Enterprise | 1 TB | Unlimited | Unlimited | Unlimited |

Quotas are enforced in `lib/video/storage.ts` before upload URL generation.

## Troubleshooting

### "Bucket not found" Error

**Cause**: The bucket doesn't exist or the name is misspelled.

**Solution**: Create the bucket using the instructions above.

### "Permission denied" Error

**Cause**: RLS policies are not configured correctly.

**Solution**: Run the `supabase/setup-storage.sql` script to set up policies.

### Upload Fails After Bucket Creation

**Cause**: Browser cached old configuration.

**Solution**:
1. Clear browser cache
2. Restart development server
3. Regenerate upload URL

## Support

For more detailed information, see:
- [Storage Setup Guide](./STORAGE_SETUP.md)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Video API Endpoints](./API_VIDEO_ENDPOINTS.md)
