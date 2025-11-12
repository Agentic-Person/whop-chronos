/**
 * Video URL Processing Library
 * Handles downloading videos from YouTube and other platforms using yt-dlp
 */

import { create as createYTDlp } from 'yt-dlp-exec';
import { getServiceSupabase } from '@/lib/db/client';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Use system-installed yt-dlp with full path
const YTDlpWrap = createYTDlp('C:\\Users\\jimmy\\AppData\\Local\\Programs\\Python\\Python313\\Scripts\\yt-dlp.exe');

export interface VideoMetadata {
  title: string;
  duration: number; // in seconds
  description: string;
  thumbnail: string;
  fileSize?: number; // in bytes
}

export interface ProcessedVideo {
  storagePath: string;
  supabaseUrl: string;
  metadata: VideoMetadata;
}

/**
 * Validate if URL is a supported video platform
 */
export function isValidVideoUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const supportedDomains = [
      'youtube.com',
      'youtu.be',
      'www.youtube.com',
      'm.youtube.com',
    ];

    return supportedDomains.some((domain) => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Extract video metadata without downloading
 */
export async function extractVideoMetadata(
  url: string,
): Promise<VideoMetadata> {
  try {
    console.log('[URL Processor] Extracting metadata from:', url);

    // Use yt-dlp to get video info without downloading
    const info = await YTDlpWrap(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
    });

    const metadata: VideoMetadata = {
      title: info.title || 'Untitled Video',
      duration: parseInt(info.duration as string, 10) || 0,
      description: info.description || '',
      thumbnail: info.thumbnail || '',
      fileSize: info.filesize || info.filesize_approx || undefined,
    };

    console.log('[URL Processor] Metadata extracted:', {
      title: metadata.title,
      duration: metadata.duration,
      fileSize: metadata.fileSize,
    });

    return metadata;
  } catch (error) {
    console.error('[URL Processor] Error extracting metadata:', error);
    throw new Error(
      `Failed to extract video metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Download video from URL and upload to Supabase Storage
 */
export async function downloadAndUploadVideo(
  url: string,
  creatorId: string,
  videoId: string,
  onProgress?: (progress: number) => void,
): Promise<ProcessedVideo> {
  let tempFilePath: string | null = null;

  try {
    // Validate URL
    if (!isValidVideoUrl(url)) {
      throw new Error(
        'Invalid video URL. Only YouTube URLs are currently supported.',
      );
    }

    console.log('[URL Processor] Starting video download from:', url);

    // Get video info first
    const metadata = await extractVideoMetadata(url);

    // Create temp directory for download
    const tempDir = path.join(os.tmpdir(), 'chronos-video-downloads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Generate temp file path
    const timestamp = Date.now();
    tempFilePath = path.join(tempDir, `${videoId}-${timestamp}.mp4`);

    console.log('[URL Processor] Downloading to temp file:', tempFilePath);

    // Download video using yt-dlp
    await YTDlpWrap(url, {
      output: tempFilePath,
      format: 'best[ext=mp4]/best',
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      addHeader: [
        'referer:youtube.com',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ],
    });

    console.log('[URL Processor] Download complete, file size:', fs.statSync(tempFilePath).size);

    // Get actual file size
    const actualFileSize = fs.statSync(tempFilePath).size;
    metadata.fileSize = actualFileSize;

    // Create storage path
    const storagePath = `${creatorId}/${videoId}/${timestamp}.mp4`;

    // Upload to Supabase Storage
    console.log('[URL Processor] Uploading to Supabase Storage...');
    const supabase = getServiceSupabase();

    const fileBuffer = fs.readFileSync(tempFilePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(storagePath, fileBuffer, {
        contentType: 'video/mp4',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('[URL Processor] Upload error:', uploadError);
      throw new Error(`Failed to upload to storage: ${uploadError.message}`);
    }

    console.log('[URL Processor] Upload successful:', uploadData.path);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('videos').getPublicUrl(storagePath);

    // Clean up temp file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      console.log('[URL Processor] Temp file cleaned up');
    }

    return {
      storagePath: uploadData.path,
      supabaseUrl: publicUrl,
      metadata,
    };
  } catch (error) {
    console.error('[URL Processor] Error downloading/uploading video:', error);

    // Clean up temp file on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log('[URL Processor] Temp file cleaned up after error');
      } catch (cleanupError) {
        console.error('[URL Processor] Failed to clean up temp file:', cleanupError);
      }
    }

    throw new Error(
      `Failed to process video URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
