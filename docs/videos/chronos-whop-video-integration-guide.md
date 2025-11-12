# ChronosAI - Whop Video Integration Guide
## Complete API Reference & Video Processing Pipeline

**Date:** November 11, 2025  
**Version:** 1.0  
**For:** Claude Code Implementation

---

## 🚀 Quick Reference

### **Key Discoveries**

✅ **Whop uses Mux** for all video storage - you don't need to build storage  
✅ **Multiple transcript sources** - YouTube (free), Mux captions (free), Whisper (paid)  
✅ **Access via API** - Get video assets through `video_asset` object  
✅ **No upload API** - Creators upload through Whop UI, your app reads existing videos  

### **Transcript Extraction Methods**

| Source | Method | Cost | When to Use |
|--------|--------|------|-------------|
| **YouTube** | Captions API | FREE | YouTube embeds |
| **Loom** | Loom API | FREE | Loom embeds |
| **Mux Captions** | Check first | FREE | If available |
| **Whisper** | OpenAI API | $0.006/min | Mux uploads (fallback) |

### **Cost Example: 100 Hours of Video**

- YouTube/Loom: **$0** (free captions)
- Mux with auto-captions: **$0** (check first)
- Whisper for remaining: **~$36** (100 hrs × 60 min × $0.006)

### **Implementation Priority**

1. ✅ Video discovery from Whop API
2. ✅ Check free transcript sources first (YouTube, Mux captions)
3. ✅ Fallback to Whisper for Mux uploads
4. ✅ Chunk transcripts with timestamps
5. ✅ Vectorize and store in Supabase
6. ✅ Build semantic search with citations

---

## Table of Contents
1. [Video Storage Architecture](#video-storage-architecture)
2. [Whop API Endpoints for Video Access](#whop-api-endpoints)
3. [Video Processing Pipeline Design](#video-processing-pipeline)
4. [Implementation Code Examples](#implementation-examples)
5. [Database Schema Integration](#database-integration)

---

## Video Storage Architecture

### Key Discovery: Whop Uses Mux for Video Hosting

**Critical Finding:** Whop handles all video storage through **Mux** (professional video infrastructure service). This means:

✅ **You DO NOT need to build video storage into ChronosAI**  
✅ **Videos are already hosted and managed by Mux through Whop**  
✅ **You only need to reference videos via their IDs**  
✅ **No S3 buckets, no video hosting costs for your app**

### How Mux Integration Works

```
Creator Uploads Video → Whop UI → Mux Storage → Mux Asset ID Generated
                                                         ↓
                                              Stored in Whop Database
                                                         ↓
                                              Your App Accesses via API
```

### Video Asset Structure

When you retrieve a video lesson from Whop, you get:

```typescript
interface VideoAsset {
  id: string;              // Internal Whop ID
  asset_id: string;        // Mux's ID for the video
  playback_id: string;     // Public playback ID for streaming
}
```

**Important:** 
- `asset_id` - Use this to reference the Mux video
- `playback_id` - Use this to generate playback URLs for streaming
- Mux handles all transcoding, streaming, and delivery

---

## Whop API Endpoints for Video Access

### 1. List Courses in an Experience

**Endpoint:** `GET /courses`

**Purpose:** Get all courses for a specific Whop experience (your app instance)

**Required Permissions:** `courses:read`

**Parameters:**
```typescript
{
  experience_id?: string;  // Filter by experience
  company_id?: string;     // Filter by company
  first?: number;          // Pagination limit
  after?: string;          // Cursor for pagination
}
```

**Response:**
```typescript
{
  data: Course[];
  page_info: {
    has_next_page: boolean;
    end_cursor: string;
  }
}
```

**TypeScript SDK Example:**
```typescript
import Whop from '@whop/sdk';

const client = new Whop({
  apiKey: process.env.WHOP_API_KEY,
});

// Get all courses for your experience
const courses = await client.courses.list({
  experience_id: 'exp_xxxxxxxxxxxxx'
});

for await (const course of courses) {
  console.log(course.id, course.title);
}
```

---

### 2. Retrieve Course Details

**Endpoint:** `GET /courses/{id}`

**Purpose:** Get full course details including all chapters and lessons

**Required Permissions:** `courses:read`

**Response Structure:**
```typescript
interface Course {
  id: string;                    // cors_XXX
  title: string;
  description: string;
  chapters: Chapter[];           // Full nested structure
  language: string;              // For transcription
  thumbnail: {
    optimized_url: string;       // Use this for display
    source_url: string;          // Original S3 link
  };
}

interface Chapter {
  id: string;                    // chap_XXX
  title: string;
  order: number;
  lessons: Lesson[];             // Basic lesson info
}
```

**Usage Example:**
```typescript
const course = await client.courses.retrieve('cors_xxxxxxxxxxxxx');

// Iterate through all videos in course
for (const chapter of course.chapters) {
  for (const lesson of chapter.lessons) {
    if (lesson.lesson_type === 'video') {
      console.log(`Found video: ${lesson.title} (${lesson.id})`);
    }
  }
}
```

---

### 3. Retrieve Lesson Details (VIDEO DATA HERE!)

**Endpoint:** `GET /course_lessons/{id}`

**Purpose:** Get complete lesson details including Mux video asset

**Required Permissions:** `courses:read`

**⭐ THIS IS WHERE YOU GET THE VIDEO ASSET! ⭐**

**Response Structure:**
```typescript
interface Lesson {
  id: string;
  title: string;
  lesson_type: 'video' | 'text' | 'pdf' | 'multi' | 'quiz' | 'knowledge_check';
  content: string;                // Text content
  
  // ⭐ VIDEO INFORMATION ⭐
  video_asset: {
    id: string;                   // Whop's internal ID
    asset_id: string;             // ⭐ MUX ASSET ID ⭐
    playback_id: string;          // ⭐ MUX PLAYBACK ID ⭐
  } | null;
  
  // Alternative video sources
  embed_type: 'youtube' | 'loom' | null;
  embed_id: string | null;        // YouTube/Loom ID
  
  // Additional metadata
  thumbnail: { url: string };
  order: number;
  visibility: 'visible' | 'hidden';
  attachments: Attachment[];      // PDFs, etc.
}
```

**Usage Example:**
```typescript
const lesson = await client.courseLessons.retrieve('lesn_xxxxxxxxxxxxx');

if (lesson.lesson_type === 'video' && lesson.video_asset) {
  const muxAssetId = lesson.video_asset.asset_id;
  const muxPlaybackId = lesson.video_asset.playback_id;
  
  console.log('Mux Asset ID:', muxAssetId);
  console.log('Mux Playback ID:', muxPlaybackId);
  
  // Generate Mux playback URL
  const videoUrl = `https://stream.mux.com/${muxPlaybackId}.m3u8`;
  
  // This is what you'll use for transcription!
  await processVideoForTranscription(videoUrl, muxAssetId);
}
```

---

### 4. List All Lessons (Batch Processing)

**Endpoint:** `GET /course_lessons`

**Purpose:** List lessons with pagination for batch processing

**Parameters:**
```typescript
{
  course_id?: string;     // Get all lessons in a course
  chapter_id?: string;    // Get lessons in a chapter
  first?: number;         // Results per page
  after?: string;         // Cursor pagination
}
```

**Usage Example:**
```typescript
// Get all video lessons in a course
const lessons = await client.courseLessons.list({
  course_id: 'cors_xxxxxxxxxxxxx'
});

const videoLessons = [];
for await (const lesson of lessons) {
  if (lesson.lesson_type === 'video') {
    videoLessons.push(lesson);
  }
}

console.log(`Found ${videoLessons.length} video lessons to process`);
```

---

## Video Processing Pipeline Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     ChronosAI Pipeline                      │
└─────────────────────────────────────────────────────────────┘

1. DISCOVER VIDEOS
   ↓
   Whop API: List Courses → List Lessons → Filter video_type
   
2. EXTRACT VIDEO DATA
   ↓
   For each video lesson:
   - Get video_asset.playback_id
   - Get metadata (title, duration, etc.)
   - Store Mux Asset ID in DB
   
3. GENERATE TRANSCRIPT
   ↓
   Mux Playback URL → Whisper API → Timestamped Transcript
   
4. CHUNK & VECTORIZE
   ↓
   Transcript → Text Chunks (500 words) → OpenAI Embeddings
   
5. STORE IN SUPABASE
   ↓
   Video metadata + Chunks + Vectors → pgvector search
```

### Pipeline Implementation Phases

#### Phase 1: Video Discovery & Metadata Extraction

**Purpose:** Find all videos in a creator's Whop courses

```typescript
// lib/whop/video-discovery.ts

import Whop from '@whop/sdk';

export interface VideoMetadata {
  lessonId: string;
  courseId: string;
  chapterId: string;
  title: string;
  muxAssetId: string;
  muxPlaybackId: string;
  thumbnailUrl: string;
  order: number;
  duration?: number;
}

export async function discoverAllVideos(
  creatorId: string,
  experienceId: string
): Promise<VideoMetadata[]> {
  const whop = new Whop({ apiKey: process.env.WHOP_API_KEY });
  const videos: VideoMetadata[] = [];
  
  // 1. Get all courses for this experience
  const courses = await whop.courses.list({
    experience_id: experienceId
  });
  
  for await (const course of courses) {
    // 2. For each course, get all lessons
    const lessons = await whop.courseLessons.list({
      course_id: course.id
    });
    
    for await (const lesson of lessons) {
      // 3. Filter for video lessons with Mux assets
      if (lesson.lesson_type === 'video' && lesson.video_asset) {
        videos.push({
          lessonId: lesson.id,
          courseId: course.id,
          chapterId: lesson.chapter_id, // From parent context
          title: lesson.title,
          muxAssetId: lesson.video_asset.asset_id,
          muxPlaybackId: lesson.video_asset.playback_id,
          thumbnailUrl: lesson.thumbnail?.url || '',
          order: lesson.order,
        });
      }
    }
  }
  
  return videos;
}
```

---

#### Phase 2: Video Transcription (Multiple Methods)

**Purpose:** Extract transcripts from various video sources with timestamps

---

### **🎯 Transcript Extraction Strategy**

ChronosAI supports multiple video sources. Here's how to handle each:

| Video Source | Method | Cost | Accuracy | Speed |
|--------------|--------|------|----------|-------|
| **Mux Videos** (uploaded) | OpenAI Whisper | $0.006/min | 95% | Medium |
| **YouTube Embeds** | YouTube Captions API | Free | 90% | Fast |
| **Loom Embeds** | Loom Captions | Free | 85% | Fast |
| **Mux Auto-Captions** | Check first | Free | 80% | Instant |

---

### **Method 1: OpenAI Whisper (RECOMMENDED for Mux)**

**Best for:** Videos uploaded from hard drive (Mux-hosted)

```typescript
// lib/transcription/whisper-transcriber.ts

import fetch from 'node-fetch';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface TranscriptSegment {
  text: string;
  startTime: number;  // seconds
  endTime: number;    // seconds
  tokens?: number[];
}

export interface WhisperTranscriptResult {
  fullText: string;
  segments: TranscriptSegment[];
  language: string;
  duration: number;
}

export async function transcribeFromMux(
  muxPlaybackId: string,
  lessonId: string
): Promise<WhisperTranscriptResult> {
  try {
    console.log(`🎤 Starting Whisper transcription for ${lessonId}`);
    
    // 1. Download audio from Mux (audio-only stream is more efficient)
    const audioUrl = `https://stream.mux.com/${muxPlaybackId}/audio.m4a`;
    const audioResponse = await fetch(audioUrl);
    
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio: ${audioResponse.statusText}`);
    }
    
    const audioBuffer = await audioResponse.buffer();
    
    // 2. Convert to File object for Whisper API
    const audioFile = new File([audioBuffer], `${lessonId}.m4a`, {
      type: 'audio/m4a'
    });
    
    // 3. Send to OpenAI Whisper with timestamps
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',  // Get full details + timestamps
      timestamp_granularities: ['segment'],  // Can also use 'word' for word-level
      language: 'en'  // Optional: specify if known
    });
    
    // 4. Format response
    const segments: TranscriptSegment[] = transcription.segments.map(seg => ({
      text: seg.text.trim(),
      startTime: seg.start,
      endTime: seg.end,
      tokens: seg.tokens
    }));
    
    const duration = segments[segments.length - 1]?.endTime || 0;
    
    console.log(`✅ Transcription complete: ${segments.length} segments, ${duration}s duration`);
    
    return {
      fullText: transcription.text,
      segments,
      language: transcription.language,
      duration
    };
    
  } catch (error) {
    console.error(`❌ Whisper transcription failed for ${lessonId}:`, error);
    throw new Error(`Transcription error: ${error.message}`);
  }
}

// Calculate cost for budgeting
export function calculateWhisperCost(result: WhisperTranscriptResult): number {
  const minutes = result.duration / 60;
  const costPerMinute = 0.006;
  return Number((minutes * costPerMinute).toFixed(4));
}
```

**Whisper API Response Example:**
```json
{
  "text": "Hello everyone, welcome to today's lesson on trading strategies...",
  "segments": [
    {
      "id": 0,
      "start": 0.0,
      "end": 3.5,
      "text": "Hello everyone, welcome to today's lesson",
      "tokens": [50364, 15947, ...]
    },
    {
      "id": 1,
      "start": 3.5,
      "end": 8.2,
      "text": "on trading strategies for cryptocurrency markets",
      "tokens": [...]
    }
  ],
  "language": "en"
}
```

---

### **Method 2: Check Mux Auto-Captions First (FREE)**

**Best for:** Cost optimization - check before paying for Whisper

```typescript
// lib/transcription/mux-captions.ts

export async function checkMuxCaptions(
  muxAssetId: string,
  muxPlaybackId: string
): Promise<string | null> {
  try {
    // Mux may auto-generate captions (WebVTT format)
    const captionUrl = `https://stream.mux.com/${muxPlaybackId}/text.vtt`;
    
    const response = await fetch(captionUrl);
    
    if (response.ok) {
      const vttContent = await response.text();
      console.log('✅ Found Mux auto-captions (free!)');
      
      // Parse VTT to plain text
      return parseVTTToText(vttContent);
    }
    
    // No captions available
    return null;
    
  } catch (error) {
    // Captions not available, will fall back to Whisper
    return null;
  }
}

function parseVTTToText(vttContent: string): string {
  // Remove VTT headers, timestamps, and formatting
  const lines = vttContent.split('\n');
  
  const textLines = lines.filter(line => {
    const trimmed = line.trim();
    return (
      trimmed !== '' &&
      !trimmed.startsWith('WEBVTT') &&
      !trimmed.includes('-->') &&
      !trimmed.match(/^\d+$/)  // Remove line numbers
    );
  });
  
  return textLines.join(' ').replace(/\s+/g, ' ').trim();
}

// Parse VTT with timestamps preserved
export interface VTTSegment {
  start: number;
  end: number;
  text: string;
}

export function parseVTTWithTimestamps(vttContent: string): VTTSegment[] {
  const segments: VTTSegment[] = [];
  const lines = vttContent.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for timestamp lines (e.g., "00:00:10.500 --> 00:00:15.200")
    if (line.includes('-->')) {
      const [startStr, endStr] = line.split('-->').map(s => s.trim());
      const start = parseVTTTimestamp(startStr);
      const end = parseVTTTimestamp(endStr);
      
      // Next line(s) contain the text
      const textLines = [];
      let j = i + 1;
      while (j < lines.length && lines[j].trim() !== '' && !lines[j].includes('-->')) {
        textLines.push(lines[j].trim());
        j++;
      }
      
      if (textLines.length > 0) {
        segments.push({
          start,
          end,
          text: textLines.join(' ')
        });
      }
      
      i = j - 1;
    }
  }
  
  return segments;
}

function parseVTTTimestamp(timestamp: string): number {
  // Convert "00:01:30.500" to seconds
  const parts = timestamp.split(':');
  const seconds = parts[parts.length - 1].split('.');
  
  const hours = parts.length === 3 ? parseInt(parts[0]) : 0;
  const minutes = parseInt(parts[parts.length - 2]);
  const secs = parseInt(seconds[0]);
  const ms = parseInt(seconds[1] || '0');
  
  return hours * 3600 + minutes * 60 + secs + ms / 1000;
}
```

---

### **Method 3: YouTube Transcript Extraction**

**Best for:** YouTube embedded videos (keep your existing method)

```typescript
// lib/transcription/youtube-transcriber.ts

export async function getYouTubeTranscript(
  videoId: string
): Promise<string> {
  try {
    // Use youtube-transcript library or your existing scraping method
    const YouTubeTranscript = require('youtube-transcript');
    
    const transcript = await YouTubeTranscript.fetchTranscript(videoId);
    
    const fullText = transcript
      .map((item: any) => item.text)
      .join(' ');
    
    console.log(`✅ YouTube transcript extracted for ${videoId}`);
    return fullText;
    
  } catch (error) {
    console.error(`❌ YouTube transcript failed for ${videoId}:`, error);
    throw new Error('YouTube transcript unavailable');
  }
}

// With timestamps
export async function getYouTubeTranscriptWithTimestamps(
  videoId: string
): Promise<TranscriptSegment[]> {
  const YouTubeTranscript = require('youtube-transcript');
  const transcript = await YouTubeTranscript.fetchTranscript(videoId);
  
  return transcript.map((item: any) => ({
    text: item.text,
    startTime: item.offset / 1000,  // Convert ms to seconds
    endTime: (item.offset + item.duration) / 1000
  }));
}
```

---

### **Method 4: Unified Transcript Handler (SMART)**

**This is what you'll actually use in your app:**

```typescript
// lib/transcription/unified-handler.ts

import { transcribeFromMux } from './whisper-transcriber';
import { checkMuxCaptions, parseVTTWithTimestamps } from './mux-captions';
import { getYouTubeTranscript } from './youtube-transcriber';

export interface TranscriptResult {
  source: 'whisper' | 'mux_captions' | 'youtube' | 'loom';
  fullText: string;
  segments?: TranscriptSegment[];
  cost: number;
  duration?: number;
}

export async function getTranscriptFromLesson(
  lesson: WhopLesson
): Promise<TranscriptResult> {
  
  // PRIORITY 1: YouTube embeds (free captions)
  if (lesson.embed_type === 'youtube' && lesson.embed_id) {
    console.log('📺 Extracting YouTube transcript...');
    
    const transcript = await getYouTubeTranscript(lesson.embed_id);
    
    return {
      source: 'youtube',
      fullText: transcript,
      cost: 0
    };
  }
  
  // PRIORITY 2: Loom embeds (free captions)
  if (lesson.embed_type === 'loom' && lesson.embed_id) {
    console.log('🎥 Extracting Loom transcript...');
    
    // Loom provides auto-captions
    const transcript = await getLoomTranscript(lesson.embed_id);
    
    return {
      source: 'loom',
      fullText: transcript,
      cost: 0
    };
  }
  
  // PRIORITY 3: Mux videos (uploaded from hard drive)
  if (lesson.video_asset?.mux_playback_id) {
    const { mux_playback_id, mux_asset_id } = lesson.video_asset;
    
    // Step 1: Check for free Mux auto-captions first
    console.log('🔍 Checking for Mux auto-captions...');
    const muxCaptions = await checkMuxCaptions(mux_asset_id, mux_playback_id);
    
    if (muxCaptions) {
      console.log('✅ Using Mux auto-captions (free!)');
      
      // Try to get segments with timestamps
      const segments = parseVTTWithTimestamps(muxCaptions);
      
      return {
        source: 'mux_captions',
        fullText: muxCaptions,
        segments: segments.length > 0 ? segments : undefined,
        cost: 0
      };
    }
    
    // Step 2: Fall back to Whisper (paid but accurate)
    console.log('🎤 Generating transcript with Whisper...');
    const whisperResult = await transcribeFromMux(mux_playback_id, lesson.id);
    
    return {
      source: 'whisper',
      fullText: whisperResult.fullText,
      segments: whisperResult.segments,
      duration: whisperResult.duration,
      cost: calculateWhisperCost(whisperResult)
    };
  }
  
  throw new Error('No video source found for lesson');
}

async function getLoomTranscript(loomId: string): Promise<string> {
  // Loom provides transcripts via their API or embed
  // Implementation depends on Loom's current API
  
  try {
    const response = await fetch(
      `https://www.loom.com/api/campaigns/sessions/${loomId}/transcriptions`
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.transcription?.text || '';
    }
  } catch (error) {
    console.warn('Loom transcript unavailable, falling back to Whisper');
  }
  
  // Fall back to other methods if Loom transcript unavailable
  throw new Error('Loom transcript unavailable');
}
```

---

### **Method 5: Alternative Services (If Needed)**

#### **AssemblyAI (Better Speaker Detection)**

```typescript
// lib/transcription/assemblyai-transcriber.ts

import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY
});

export async function transcribeWithAssemblyAI(
  muxPlaybackId: string
): Promise<TranscriptResult> {
  
  const audioUrl = `https://stream.mux.com/${muxPlaybackId}/audio.m4a`;
  
  const transcript = await client.transcripts.transcribe({
    audio_url: audioUrl,
    speaker_labels: true,      // Identify different speakers!
    auto_chapters: true,        // Auto-detect topic changes
    auto_highlights: true,      // Extract key points
    entity_detection: true      // Identify names, places, etc.
  });
  
  // Wait for completion
  if (transcript.status === 'error') {
    throw new Error(transcript.error);
  }
  
  return {
    source: 'assemblyai',
    fullText: transcript.text,
    segments: transcript.utterances?.map(u => ({
      text: u.text,
      startTime: u.start / 1000,
      endTime: u.end / 1000,
      speakerId: u.speaker
    })),
    cost: (transcript.audio_duration / 1000 / 60) * 0.015  // $0.015 per minute
  };
}
```

**When to use AssemblyAI:**
- Multi-speaker lessons (identifies Speaker A, B, C)
- Want automatic chapters/highlights
- Need entity detection (names, companies, etc.)

---

### **Processing Queue with Retry Logic**

```typescript
// lib/transcription/processor.ts

import { Queue, Worker } from 'bullmq';

const transcriptionQueue = new Queue('transcription', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: 6379
  }
});

export async function queueTranscription(
  lessonId: string,
  lesson: WhopLesson
) {
  await transcriptionQueue.add(
    'transcribe-lesson',
    { lessonId, lesson },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: true,
      removeOnFail: false
    }
  );
}

// Worker to process transcriptions
const worker = new Worker('transcription', async (job) => {
  const { lessonId, lesson } = job.data;
  
  try {
    console.log(`⚙️ Processing transcription for ${lessonId}`);
    
    // Get transcript using smart handler
    const result = await getTranscriptFromLesson(lesson);
    
    // Store in database
    await supabase
      .from('videos')
      .update({
        transcript_text: result.fullText,
        transcript_processed: true,
        transcription_source: result.source,
        transcription_cost: result.cost
      })
      .eq('whop_lesson_id', lessonId);
    
    // Chunk and vectorize
    if (result.segments) {
      await chunkAndVectorize(lessonId, result);
    }
    
    console.log(`✅ Transcription complete: ${lessonId} (${result.source}, $${result.cost})`);
    
    return { success: true, cost: result.cost };
    
  } catch (error) {
    console.error(`❌ Transcription failed for ${lessonId}:`, error);
    
    // Store error in database
    await supabase
      .from('videos')
      .update({
        processing_error: error.message,
        transcript_processed: false
      })
      .eq('whop_lesson_id', lessonId);
    
    throw error;
  }
}, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: 6379
  },
  concurrency: 5  // Process 5 videos simultaneously
});

worker.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed: $${result.cost}`);
});

worker.on('failed', (job, error) => {
  console.error(`❌ Job ${job?.id} failed:`, error);
});
```

---

#### Phase 3: Text Chunking & Embedding

**Purpose:** Split transcript into searchable chunks with timestamps

```typescript
// lib/rag/chunker.ts

export interface VideoChunk {
  videoId: string;
  chunkIndex: number;
  text: string;
  startTimestamp: number;
  endTimestamp: number;
  wordCount: number;
}

export function chunkTranscript(
  transcript: TranscriptSegment[],
  videoId: string,
  targetWordCount: number = 500
): VideoChunk[] {
  const chunks: VideoChunk[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;
  let chunkStartTime = transcript[0]?.startTime || 0;
  let chunkIndex = 0;
  
  for (const segment of transcript) {
    const words = segment.text.split(/\s+/);
    
    // Add to current chunk
    currentChunk.push(segment.text);
    currentWordCount += words.length;
    
    // Split chunk if we hit target size
    if (currentWordCount >= targetWordCount) {
      chunks.push({
        videoId,
        chunkIndex,
        text: currentChunk.join(' '),
        startTimestamp: chunkStartTime,
        endTimestamp: segment.endTime,
        wordCount: currentWordCount
      });
      
      // Reset for next chunk with 50-word overlap
      const overlapText = currentChunk.slice(-2).join(' ');
      currentChunk = [overlapText];
      currentWordCount = overlapText.split(/\s+/).length;
      chunkStartTime = segment.startTime;
      chunkIndex++;
    }
  }
  
  // Add final chunk
  if (currentChunk.length > 0) {
    chunks.push({
      videoId,
      chunkIndex,
      text: currentChunk.join(' '),
      startTimestamp: chunkStartTime,
      endTimestamp: transcript[transcript.length - 1].endTime,
      wordCount: currentWordCount
    });
  }
  
  return chunks;
}
```

---

#### Phase 4: Vector Embedding Generation

**Purpose:** Convert text chunks to searchable vectors

```typescript
// lib/rag/embedder.ts

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateEmbeddings(
  chunks: VideoChunk[]
): Promise<Array<VideoChunk & { embedding: number[] }>> {
  const embeddedChunks = [];
  
  // Batch process for efficiency (OpenAI allows batches)
  const batchSize = 100;
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    
    const embeddings = await openai.embeddings.create({
      model: 'text-embedding-3-small',  // Cost-effective
      input: batch.map(chunk => chunk.text),
      encoding_format: 'float'
    });
    
    batch.forEach((chunk, index) => {
      embeddedChunks.push({
        ...chunk,
        embedding: embeddings.data[index].embedding
      });
    });
    
    // Rate limiting: OpenAI allows 3000 RPM
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return embeddedChunks;
}
```

---

## Database Integration

### Supabase Schema for Video Storage

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Videos table (Whop video metadata)
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
    
    -- Whop identifiers
    whop_lesson_id VARCHAR(255) UNIQUE NOT NULL,
    whop_course_id VARCHAR(255) NOT NULL,
    whop_chapter_id VARCHAR(255) NOT NULL,
    
    -- Mux video data
    mux_asset_id VARCHAR(255) NOT NULL,
    mux_playback_id VARCHAR(255) NOT NULL,
    
    -- Metadata
    title VARCHAR(500) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    order_index INTEGER DEFAULT 0,
    
    -- Transcript processing status
    transcript_processed BOOLEAN DEFAULT FALSE,
    transcript_text TEXT,
    processing_error TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_synced_at TIMESTAMP DEFAULT NOW()
);

-- Video chunks table (for RAG)
CREATE TABLE video_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    
    -- Chunk metadata
    chunk_index INTEGER NOT NULL,
    text TEXT NOT NULL,
    word_count INTEGER NOT NULL,
    
    -- Timestamps (for video seeking)
    start_timestamp NUMERIC(10,2) NOT NULL,  -- seconds with decimals
    end_timestamp NUMERIC(10,2) NOT NULL,
    
    -- Vector embedding for semantic search
    embedding vector(1536),  -- OpenAI text-embedding-3-small dimension
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for performance
    UNIQUE(video_id, chunk_index)
);

-- Indexes for fast lookups
CREATE INDEX idx_videos_creator ON videos(creator_id);
CREATE INDEX idx_videos_whop_lesson ON videos(whop_lesson_id);
CREATE INDEX idx_videos_processed ON videos(transcript_processed);
CREATE INDEX idx_chunks_video ON video_chunks(video_id);

-- Vector similarity search index (HNSW for speed)
CREATE INDEX idx_chunks_embedding ON video_chunks 
  USING hnsw (embedding vector_cosine_ops);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### Supabase TypeScript Client Setup

```typescript
// lib/supabase/client.ts

import { createClient } from '@supabase/supabase-js';

interface Database {
  public: {
    Tables: {
      videos: {
        Row: {
          id: string;
          creator_id: string;
          whop_lesson_id: string;
          whop_course_id: string;
          whop_chapter_id: string;
          mux_asset_id: string;
          mux_playback_id: string;
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          duration_seconds: number | null;
          order_index: number;
          transcript_processed: boolean;
          transcript_text: string | null;
          processing_error: string | null;
          created_at: string;
          updated_at: string;
          last_synced_at: string;
        };
        Insert: Omit<Database['public']['Tables']['videos']['Row'], 
          'id' | 'created_at' | 'updated_at'>;
      };
      video_chunks: {
        Row: {
          id: string;
          video_id: string;
          chunk_index: number;
          text: string;
          word_count: number;
          start_timestamp: number;
          end_timestamp: number;
          embedding: number[] | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['video_chunks']['Row'], 
          'id' | 'created_at'>;
      };
    };
  };
}

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // Server-side only!
);
```

---

## Implementation Examples

### Complete Video Processing Workflow

```typescript
// app/api/process-videos/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { discoverAllVideos } from '@/lib/whop/video-discovery';
import { transcribeFromMux } from '@/lib/transcription/mux-transcriber';
import { chunkTranscript } from '@/lib/rag/chunker';
import { generateEmbeddings } from '@/lib/rag/embedder';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  const { creatorId, experienceId } = await req.json();
  
  try {
    // 1. Discover all videos from Whop
    console.log('🔍 Discovering videos...');
    const videos = await discoverAllVideos(creatorId, experienceId);
    console.log(`Found ${videos.length} videos`);
    
    // 2. Store video metadata in database
    for (const video of videos) {
      const { error: insertError } = await supabase
        .from('videos')
        .upsert({
          creator_id: creatorId,
          whop_lesson_id: video.lessonId,
          whop_course_id: video.courseId,
          whop_chapter_id: video.chapterId,
          mux_asset_id: video.muxAssetId,
          mux_playback_id: video.muxPlaybackId,
          title: video.title,
          thumbnail_url: video.thumbnailUrl,
          order_index: video.order,
          last_synced_at: new Date().toISOString()
        }, {
          onConflict: 'whop_lesson_id',
          ignoreDuplicates: false
        });
        
      if (insertError) {
        console.error(`Failed to store video ${video.lessonId}:`, insertError);
      }
    }
    
    // 3. Process each video (queue for background processing)
    const processingQueue = videos.map(async (video) => {
      return processVideo(creatorId, video);
    });
    
    // Wait for all to complete (or use a job queue like BullMQ)
    await Promise.allSettled(processingQueue);
    
    return NextResponse.json({
      success: true,
      videosDiscovered: videos.length,
      message: 'Video processing started'
    });
    
  } catch (error) {
    console.error('Video processing error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

async function processVideo(creatorId: string, video: VideoMetadata) {
  try {
    console.log(`🎥 Processing: ${video.title}`);
    
    // 1. Check if already processed
    const { data: existingVideo } = await supabase
      .from('videos')
      .select('transcript_processed')
      .eq('whop_lesson_id', video.lessonId)
      .single();
      
    if (existingVideo?.transcript_processed) {
      console.log(`✅ Already processed: ${video.title}`);
      return;
    }
    
    // 2. Transcribe video
    console.log(`📝 Transcribing: ${video.title}`);
    const transcript = await transcribeFromMux(
      video.muxPlaybackId,
      video.lessonId
    );
    
    // 3. Store full transcript
    const fullTranscript = transcript.map(seg => seg.text).join(' ');
    await supabase
      .from('videos')
      .update({
        transcript_text: fullTranscript,
        duration_seconds: Math.ceil(transcript[transcript.length - 1]?.endTime || 0)
      })
      .eq('whop_lesson_id', video.lessonId);
    
    // 4. Chunk transcript
    console.log(`✂️ Chunking: ${video.title}`);
    const chunks = chunkTranscript(transcript, video.lessonId, 500);
    
    // 5. Generate embeddings
    console.log(`🧠 Embedding: ${video.title}`);
    const embeddedChunks = await generateEmbeddings(chunks);
    
    // 6. Store chunks in database
    const { data: videoRecord } = await supabase
      .from('videos')
      .select('id')
      .eq('whop_lesson_id', video.lessonId)
      .single();
      
    if (!videoRecord) {
      throw new Error(`Video record not found for ${video.lessonId}`);
    }
    
    for (const chunk of embeddedChunks) {
      await supabase.from('video_chunks').insert({
        video_id: videoRecord.id,
        chunk_index: chunk.chunkIndex,
        text: chunk.text,
        word_count: chunk.wordCount,
        start_timestamp: chunk.startTimestamp,
        end_timestamp: chunk.endTimestamp,
        embedding: chunk.embedding
      });
    }
    
    // 7. Mark as processed
    await supabase
      .from('videos')
      .update({ transcript_processed: true })
      .eq('whop_lesson_id', video.lessonId);
      
    console.log(`✅ Completed: ${video.title}`);
    
  } catch (error) {
    console.error(`❌ Failed: ${video.title}`, error);
    
    // Store error in database
    await supabase
      .from('videos')
      .update({
        processing_error: error.message,
        transcript_processed: false
      })
      .eq('whop_lesson_id', video.lessonId);
  }
}
```

---

### Semantic Video Search with Timestamps

```typescript
// app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: NextRequest) {
  const { query, creatorId } = await req.json();
  
  try {
    // 1. Generate embedding for user query
    const queryEmbedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query
    });
    
    const embedding = queryEmbedding.data[0].embedding;
    
    // 2. Semantic search in Supabase using pgvector
    const { data: results, error } = await supabase.rpc('search_video_chunks', {
      query_embedding: embedding,
      creator_id: creatorId,
      match_threshold: 0.7,
      match_count: 5
    });
    
    if (error) throw error;
    
    // 3. Format results with video context
    const contextChunks = results.map((result: any) => ({
      videoTitle: result.video_title,
      videoId: result.whop_lesson_id,
      text: result.chunk_text,
      timestamp: result.start_timestamp,
      similarity: result.similarity
    }));
    
    // 4. Generate AI response using Claude
    const systemPrompt = `You are an AI learning assistant. Answer the user's question based ONLY on the provided video transcripts. Include exact video timestamps in your response.

Format timestamps as [VideoTitle @ MM:SS]

Video Context:
${contextChunks.map(c => 
  `[${c.videoTitle} @ ${formatTimestamp(c.timestamp)}]
  ${c.text}`
).join('\n\n')}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ]
    });
    
    const answer = completion.choices[0].message.content;
    
    return NextResponse.json({
      answer,
      sources: contextChunks
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

---

### Supabase RPC Function for Vector Search

```sql
-- Create RPC function for semantic search
CREATE OR REPLACE FUNCTION search_video_chunks(
  query_embedding vector(1536),
  creator_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  chunk_id uuid,
  video_id uuid,
  whop_lesson_id varchar,
  video_title varchar,
  chunk_text text,
  start_timestamp numeric,
  end_timestamp numeric,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vc.id as chunk_id,
    vc.video_id,
    v.whop_lesson_id,
    v.title as video_title,
    vc.text as chunk_text,
    vc.start_timestamp,
    vc.end_timestamp,
    1 - (vc.embedding <=> query_embedding) as similarity
  FROM video_chunks vc
  JOIN videos v ON v.id = vc.video_id
  WHERE v.creator_id = search_video_chunks.creator_id
    AND 1 - (vc.embedding <=> query_embedding) > match_threshold
  ORDER BY vc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## Transcript Method Comparison & Cost Analysis

### **Decision Matrix: Which Method to Use?**

```
┌─────────────────────────────────────────────────────────────────┐
│                   TRANSCRIPTION FLOW CHART                      │
└─────────────────────────────────────────────────────────────────┘

Is it a YouTube embed?
├─ YES → Use YouTube Captions API (FREE) ✅
└─ NO ↓

Is it a Loom embed?
├─ YES → Use Loom Transcript (FREE) ✅
└─ NO ↓

Is it a Mux video?
├─ YES ↓
    │
    ├─ Check Mux Auto-Captions (FREE)
    │  ├─ Available? → Use Mux Captions ✅
    │  └─ Not Available ↓
    │
    └─ Use OpenAI Whisper ($0.006/min) ✅
         ├─ Need speaker ID? → Use AssemblyAI ($0.015/min)
         └─ Need speed? → Use Deepgram ($0.0125/min)
```

### **Cost Breakdown (Example: 100 Hours of Video)**

| Method | Cost per Hour | 100 Hours Total | Features |
|--------|---------------|-----------------|----------|
| **YouTube Captions** | $0 | **$0** | Free, auto-generated |
| **Mux Auto-Captions** | $0 | **$0** | Free, check first |
| **OpenAI Whisper** | $0.36 | **$36** | High accuracy, timestamps |
| **AssemblyAI** | $0.90 | **$90** | Speaker ID, topics, highlights |
| **Deepgram** | $0.75 | **$75** | Fastest, real-time capable |

### **Accuracy Comparison**

```
Transcription Accuracy (English):

Whisper:          ████████████████████░ 95%
AssemblyAI:       ███████████████████░░ 93%
Deepgram:         ██████████████████░░░ 90%
Mux Auto:         ████████████████░░░░░ 80%
YouTube Auto:     ███████████████░░░░░░ 75%
```

### **Processing Speed Comparison**

For a 1-hour video:

| Service | Processing Time | Notes |
|---------|----------------|-------|
| **Mux/YouTube** | Instant | Already available |
| **Deepgram** | 2-5 minutes | Fastest API |
| **Whisper** | 5-10 minutes | Good speed/accuracy balance |
| **AssemblyAI** | 8-15 minutes | Worth it for speaker ID |

### **Recommended Strategy for ChronosAI**

```typescript
// config/transcription-strategy.ts

export const TRANSCRIPTION_CONFIG = {
  // Always check free sources first
  checkFreeSourcesFirst: true,
  
  // Default to Whisper for uploaded videos
  defaultPaidService: 'whisper',
  
  // Use AssemblyAI for these cases
  useAssemblyAIWhen: {
    multiSpeaker: true,        // Lessons with multiple instructors
    languageLearning: true,    // Need precise speaker detection
    longForm: false            // Not necessary for length
  },
  
  // Processing limits
  maxConcurrent: 5,            // Process 5 videos at once
  retryAttempts: 3,
  
  // Cost control
  monthlyBudget: 100,          // $100/month limit
  alertThreshold: 80           // Alert at 80% of budget
};
```

---

## Critical Implementation Notes

### ⚠️ Important Constraints

1. **Video Upload Flow NOT in API**
   - Videos must be uploaded through Whop UI by creators
   - Your app reads existing videos via API only
   - No direct video upload endpoint available

2. **Mux Direct Access**
   - You CAN access Mux playback URLs directly
   - Format: `https://stream.mux.com/{playback_id}.m3u8`
   - No Mux API key needed (public playback IDs)

3. **Rate Limiting**
   - Whop API: Check their rate limits
   - OpenAI Whisper: 50 RPM on free tier
   - OpenAI Embeddings: 3000 RPM

4. **Cost Considerations**
   - Whisper: $0.006 per minute of audio
   - Embeddings: $0.0001 per 1K tokens
   - Supabase: Storage + compute costs for vectors

---

## Environment Variables Needed

```bash
# .env.local

# ==========================================
# WHOP INTEGRATION
# ==========================================
WHOP_API_KEY=your_whop_api_key_here
WHOP_CLIENT_ID=your_client_id
WHOP_CLIENT_SECRET=your_client_secret

# ==========================================
# TRANSCRIPTION SERVICES
# ==========================================

# OpenAI (Whisper + Embeddings) - REQUIRED
OPENAI_API_KEY=your_openai_api_key_here

# AssemblyAI (Optional - for speaker detection)
ASSEMBLYAI_API_KEY=your_assemblyai_key_here

# Deepgram (Optional - for faster processing)
DEEPGRAM_API_KEY=your_deepgram_key_here

# ==========================================
# SUPABASE DATABASE
# ==========================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here

# ==========================================
# REDIS (For processing queue)
# ==========================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password  # Optional

# ==========================================
# APPLICATION CONFIG
# ==========================================
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Getting API Keys**

#### **OpenAI (Required)**
1. Go to https://platform.openai.com/api-keys
2. Create new API key
3. Add billing method (pay-as-you-go)
4. Cost: ~$0.006/minute for Whisper

#### **AssemblyAI (Optional)**
1. Sign up at https://www.assemblyai.com/
2. Get free $50 credits
3. Generate API key
4. Cost after credits: $0.015/minute

#### **Deepgram (Optional)**
1. Sign up at https://deepgram.com/
2. Get $200 free credits
3. Generate API key
4. Cost after credits: $0.0125/minute

---

---

## Complete End-to-End Example

### **Scenario: Creator Uploads 50 Videos to Whop**

Here's how ChronosAI processes them:

```typescript
// app/api/sync-creator-videos/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { discoverAllVideos } from '@/lib/whop/video-discovery';
import { getTranscriptFromLesson } from '@/lib/transcription/unified-handler';
import { queueTranscription } from '@/lib/transcription/processor';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  const { creatorId, experienceId } = await req.json();
  
  console.log(`🚀 Starting video sync for creator ${creatorId}`);
  
  try {
    // ==========================================
    // STEP 1: DISCOVER ALL VIDEOS FROM WHOP
    // ==========================================
    console.log('🔍 Step 1: Discovering videos...');
    const videos = await discoverAllVideos(creatorId, experienceId);
    console.log(`Found ${videos.length} videos`);
    
    // Categorize by source
    const stats = {
      mux: videos.filter(v => v.muxPlaybackId).length,
      youtube: videos.filter(v => v.embedType === 'youtube').length,
      loom: videos.filter(v => v.embedType === 'loom').length
    };
    
    console.log('Video sources:', stats);
    
    // ==========================================
    // STEP 2: STORE VIDEO METADATA
    // ==========================================
    console.log('💾 Step 2: Storing metadata...');
    
    for (const video of videos) {
      await supabase.from('videos').upsert({
        creator_id: creatorId,
        whop_lesson_id: video.lessonId,
        whop_course_id: video.courseId,
        whop_chapter_id: video.chapterId,
        mux_asset_id: video.muxAssetId,
        mux_playback_id: video.muxPlaybackId,
        embed_type: video.embedType,
        embed_id: video.embedId,
        title: video.title,
        thumbnail_url: video.thumbnailUrl,
        order_index: video.order,
        last_synced_at: new Date().toISOString()
      }, {
        onConflict: 'whop_lesson_id',
        ignoreDuplicates: false
      });
    }
    
    // ==========================================
    // STEP 3: QUEUE TRANSCRIPTION JOBS
    // ==========================================
    console.log('⚙️ Step 3: Queueing transcription jobs...');
    
    let queuedCount = 0;
    let skippedCount = 0;
    
    for (const video of videos) {
      // Check if already processed
      const { data: existing } = await supabase
        .from('videos')
        .select('transcript_processed')
        .eq('whop_lesson_id', video.lessonId)
        .single();
      
      if (existing?.transcript_processed) {
        skippedCount++;
        continue;
      }
      
      // Queue for processing
      await queueTranscription(video.lessonId, video);
      queuedCount++;
    }
    
    console.log(`✅ Queued ${queuedCount} videos, skipped ${skippedCount} already processed`);
    
    // ==========================================
    // STEP 4: ESTIMATE COSTS
    // ==========================================
    const estimatedCost = estimateTranscriptionCost(videos);
    
    return NextResponse.json({
      success: true,
      summary: {
        totalVideos: videos.length,
        bySource: stats,
        queued: queuedCount,
        skipped: skippedCount,
        estimatedCost: {
          mux: estimatedCost.mux,
          total: estimatedCost.total,
          breakdown: estimatedCost.breakdown
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Video sync failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

function estimateTranscriptionCost(videos: VideoMetadata[]) {
  // Assume average video length: 15 minutes
  const avgMinutes = 15;
  const whisperCostPerMin = 0.006;
  
  const muxVideos = videos.filter(v => v.muxPlaybackId).length;
  const freeVideos = videos.filter(v => 
    v.embedType === 'youtube' || v.embedType === 'loom'
  ).length;
  
  const muxCost = muxVideos * avgMinutes * whisperCostPerMin;
  
  return {
    mux: `$${muxCost.toFixed(2)}`,
    total: `$${muxCost.toFixed(2)}`,
    breakdown: {
      muxVideos: `${muxVideos} videos × ${avgMinutes} min × $${whisperCostPerMin}/min`,
      freeVideos: `${freeVideos} videos (YouTube/Loom) - FREE`,
      note: 'Actual cost may be lower if Mux provides auto-captions'
    }
  };
}
```

---

### **Example Output**

```json
{
  "success": true,
  "summary": {
    "totalVideos": 50,
    "bySource": {
      "mux": 35,
      "youtube": 10,
      "loom": 5
    },
    "queued": 35,
    "skipped": 15,
    "estimatedCost": {
      "mux": "$3.15",
      "total": "$3.15",
      "breakdown": {
        "muxVideos": "35 videos × 15 min × $0.006/min",
        "freeVideos": "15 videos (YouTube/Loom) - FREE",
        "note": "Actual cost may be lower if Mux provides auto-captions"
      }
    }
  }
}
```

---

### **Student Chat Experience**

```typescript
// app/api/chat/route.ts - What students see

import { NextRequest, NextResponse } from 'next/server';
import { searchVideoChunks } from '@/lib/rag/search';
import { generateAIResponse } from '@/lib/ai/response-generator';

export async function POST(req: NextRequest) {
  const { query, studentId, creatorId } = await req.json();
  
  // 1. Search across all vectorized transcripts
  const relevantChunks = await searchVideoChunks(query, creatorId, {
    limit: 5,
    threshold: 0.7
  });
  
  // 2. Generate AI response with video citations
  const response = await generateAIResponse(query, relevantChunks);
  
  // 3. Return with clickable timestamps
  return NextResponse.json({
    answer: response.text,
    sources: relevantChunks.map(chunk => ({
      videoTitle: chunk.videoTitle,
      videoId: chunk.videoId,
      timestamp: chunk.startTimestamp,
      snippet: chunk.text.substring(0, 150) + '...',
      // Generate deep link to exact moment
      playUrl: `/watch/${chunk.videoId}?t=${Math.floor(chunk.startTimestamp)}`
    }))
  });
}
```

**Example Student Query:**
```
Student: "How do I set up my first trading strategy?"

Response:
"To set up your first trading strategy, start by defining your risk tolerance 
and capital allocation. [Trading 101 @ 3:45] explains the basics of position 
sizing. Then, choose a technical indicator like RSI or MACD that matches your 
trading style [Advanced Strategies @ 12:30]. Always backtest your strategy 
before using real money [Risk Management @ 8:15]."

Sources:
1. Trading 101 - Introduction to Position Sizing [Watch at 3:45]
2. Advanced Strategies - Technical Indicators Deep Dive [Watch at 12:30]
3. Risk Management - The Importance of Backtesting [Watch at 8:15]
```

---

### **Cost Tracking Dashboard**

```typescript
// app/api/admin/transcription-costs/route.ts

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const creatorId = searchParams.get('creatorId');
  
  // Get all processed videos with costs
  const { data: videos } = await supabase
    .from('videos')
    .select('transcription_source, transcription_cost, created_at')
    .eq('creator_id', creatorId)
    .eq('transcript_processed', true);
  
  const summary = {
    totalVideos: videos.length,
    totalCost: videos.reduce((sum, v) => sum + (v.transcription_cost || 0), 0),
    bySource: {
      whisper: videos.filter(v => v.transcription_source === 'whisper').length,
      muxCaptions: videos.filter(v => v.transcription_source === 'mux_captions').length,
      youtube: videos.filter(v => v.transcription_source === 'youtube').length,
      loom: videos.filter(v => v.transcription_source === 'loom').length
    },
    savingsFromFreeSources: calculateSavings(videos)
  };
  
  return NextResponse.json(summary);
}

function calculateSavings(videos: any[]) {
  const freeVideos = videos.filter(v => 
    ['mux_captions', 'youtube', 'loom'].includes(v.transcription_source)
  );
  
  // Assume 15 min average, $0.006/min if we had used Whisper
  const savedCost = freeVideos.length * 15 * 0.006;
  
  return {
    freeVideosUsed: freeVideos.length,
    estimatedSavings: `$${savedCost.toFixed(2)}`
  };
}
```

---

## Testing Checklist

### **Phase 1: Video Discovery ✅**
- [ ] Can list all courses for an experience
- [ ] Can retrieve course details with chapters
- [ ] Can get lesson details with video_asset
- [ ] Mux playback IDs are valid and accessible
- [ ] YouTube embed IDs are extracted correctly
- [ ] Loom embed IDs are extracted correctly
- [ ] Store video metadata in Supabase successfully
- [ ] Handle pagination for courses with 100+ lessons

### **Phase 2: Transcript Extraction ✅**

#### **2a. Mux Auto-Captions**
- [ ] Check for Mux auto-captions before using Whisper
- [ ] Parse VTT format correctly
- [ ] Extract timestamps accurately
- [ ] Handle missing captions gracefully

#### **2b. OpenAI Whisper**
- [ ] Download audio from Mux successfully
- [ ] Whisper generates accurate transcripts
- [ ] Timestamps align with video (±5 seconds)
- [ ] Handle transcription errors gracefully
- [ ] Calculate costs correctly
- [ ] Respect rate limits (50 RPM)

#### **2c. YouTube Transcripts**
- [ ] Extract YouTube auto-captions
- [ ] Parse timestamps correctly
- [ ] Handle videos without captions
- [ ] Fallback to Whisper if needed

#### **2d. Unified Handler**
- [ ] Correctly identifies video source type
- [ ] Prioritizes free sources first
- [ ] Falls back to paid services when needed
- [ ] Tracks source used in database
- [ ] Cost calculation is accurate

### **Phase 3: Chunking & Embedding ✅**
- [ ] Chunks are ~500 words each (±50 words)
- [ ] Timestamps preserved in chunks
- [ ] 50-word overlap between chunks works
- [ ] Embedding generation succeeds for all chunks
- [ ] Vectors stored in Supabase correctly
- [ ] Vector dimensions are correct (1536 for text-embedding-3-small)
- [ ] Batch processing handles 100+ chunks

### **Phase 4: Search & Retrieval ✅**
- [ ] Semantic search returns relevant results
- [ ] Similarity threshold (0.7) filters appropriately
- [ ] Timestamps are accurate (±5 seconds)
- [ ] AI responses cite correct videos
- [ ] Response latency < 5 seconds
- [ ] Search works across multiple courses
- [ ] Handles queries with no results gracefully

### **Phase 5: Queue & Processing ✅**
- [ ] Redis queue accepts jobs
- [ ] Workers process jobs concurrently (5 at a time)
- [ ] Retry logic works (3 attempts)
- [ ] Failed jobs are logged
- [ ] Completed jobs update database
- [ ] Progress tracking works
- [ ] Cost tracking is accurate

### **Phase 6: Error Handling ✅**
- [ ] Network errors are caught and logged
- [ ] API rate limits are respected
- [ ] Corrupted videos are handled
- [ ] Database connection errors are handled
- [ ] User-friendly error messages shown
- [ ] Failed jobs can be retried manually

### **Phase 7: Performance ✅**
- [ ] Process 50 videos in < 2 hours
- [ ] Database queries are optimized
- [ ] Vector search is < 500ms
- [ ] Memory usage stays under control
- [ ] CPU usage is reasonable
- [ ] No memory leaks in queue workers

---

## Next Steps for Implementation

1. **Set up Whop SDK in your Next.js project**
   ```bash
   npm install @whop/sdk @whop/react
   ```

2. **Configure Supabase client with pgvector**
   ```bash
   npm install @supabase/supabase-js
   ```

3. **Install AI dependencies**
   ```bash
   npm install openai
   ```

4. **Implement video discovery endpoint first**
   - Test with a single creator's experience
   - Verify Mux asset IDs are returned

5. **Build transcription pipeline**
   - Start with one video manually
   - Validate transcript quality
   - Then automate for all videos

6. **Deploy vector search**
   - Create Supabase RPC function
   - Test semantic search accuracy
   - Tune similarity thresholds

7. **Build chat interface**
   - Connect to vector search
   - Implement timestamp links
   - Add source citations

---

## Support & Resources

- **Whop API Docs:** https://docs.whop.com/api-reference
- **Whop Developer Discord:** Contact for upload API questions
- **Mux Docs:** https://docs.mux.com/
- **Supabase pgvector:** https://supabase.com/docs/guides/ai
- **OpenAI Whisper:** https://platform.openai.com/docs/guides/speech-to-text

---

---

## Troubleshooting Guide

### **Issue: Mux Audio Download Fails (403/404)**

**Problem:** Can't download audio from `https://stream.mux.com/{playback_id}/audio.m4a`

**Solutions:**
1. Verify playback_id is correct (not asset_id)
2. Check if video is still processing in Mux
3. Try the video URL instead: `https://stream.mux.com/{playback_id}.m3u8`
4. Wait 5 minutes and retry (Mux may still be processing)

```typescript
// Add retry logic
async function downloadWithRetry(url: string, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.buffer();
      
      if (response.status === 404) {
        console.log(`Attempt ${i + 1}: Video not ready, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      if (i === attempts - 1) throw error;
    }
  }
  throw new Error('Failed after all retries');
}
```

---

### **Issue: Whisper API Rate Limits**

**Problem:** `RateLimitError: Rate limit exceeded`

**Solutions:**
1. Reduce concurrent workers (default: 5 → 2)
2. Add delays between requests
3. Upgrade OpenAI plan for higher limits

```typescript
// Add rate limiting
import pLimit from 'p-limit';

const limit = pLimit(2); // Only 2 concurrent requests

const transcriptions = await Promise.all(
  videos.map(video => 
    limit(() => transcribeFromMux(video.muxPlaybackId, video.id))
  )
);
```

---

### **Issue: Poor Transcript Quality**

**Problem:** Whisper produces inaccurate transcripts

**Solutions:**
1. Check audio quality (background noise, multiple speakers)
2. Specify language explicitly: `language: 'en'`
3. Try AssemblyAI for better accuracy on specific content
4. Use word-level timestamps: `timestamp_granularities: ['word']`

```typescript
const transcription = await openai.audio.transcriptions.create({
  file: audioFile,
  model: 'whisper-1',
  language: 'en',  // Specify language
  prompt: 'Trading, cryptocurrency, bitcoin'  // Context helps!
});
```

---

### **Issue: Vector Search Returns Irrelevant Results**

**Problem:** Semantic search doesn't find the right videos

**Solutions:**
1. Lower similarity threshold (0.7 → 0.6)
2. Increase number of results (5 → 10)
3. Check embeddings are stored correctly
4. Try different query phrasing

```typescript
// Debug vector search
const { data, error } = await supabase.rpc('search_video_chunks', {
  query_embedding: embedding,
  creator_id: creatorId,
  match_threshold: 0.6,  // Lower threshold
  match_count: 10  // More results
});

console.log('Search results:', data?.length);
console.log('Top similarity:', data?.[0]?.similarity);
```

---

### **Issue: High Transcription Costs**

**Problem:** Whisper costs are too high

**Solutions:**
1. Always check Mux auto-captions first
2. Process only new videos (check `transcript_processed`)
3. Use YouTube captions when possible
4. Set monthly budget alerts

```typescript
// Cost tracking middleware
async function checkBudget(creatorId: string) {
  const { data } = await supabase
    .from('videos')
    .select('transcription_cost')
    .eq('creator_id', creatorId)
    .gte('created_at', startOfMonth());
    
  const monthlySpend = data.reduce((sum, v) => sum + v.transcription_cost, 0);
  
  if (monthlySpend > 100) {
    throw new Error('Monthly transcription budget exceeded');
  }
}
```

---

### **Issue: Queue Workers Not Processing**

**Problem:** Videos stuck in queue, not processing

**Solutions:**
1. Check Redis connection
2. Verify worker is running
3. Check for failed jobs in BullMQ UI
4. Review error logs

```bash
# Check Redis connection
redis-cli ping
# Should return: PONG

# Check BullMQ dashboard
npm install -g bull-board
bull-board

# View failed jobs
node -e "
const { Queue } = require('bullmq');
const queue = new Queue('transcription');
queue.getFailed().then(jobs => console.log(jobs.length + ' failed'));
"
```

---

### **Issue: Database Performance Slow**

**Problem:** Vector searches taking > 2 seconds

**Solutions:**
1. Add HNSW index on embeddings
2. Increase Supabase compute size
3. Limit search to specific courses
4. Cache frequent searches

```sql
-- Create optimized index
CREATE INDEX IF NOT EXISTS idx_chunks_embedding 
  ON video_chunks 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Vacuum and analyze
VACUUM ANALYZE video_chunks;
```

---

### **Issue: Memory Issues with Large Files**

**Problem:** Node.js crashes with large video files

**Solutions:**
1. Increase Node.js memory: `node --max-old-space-size=4096`
2. Stream files instead of loading into memory
3. Process in smaller batches
4. Use server with more RAM

```typescript
// Stream instead of buffer
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

async function downloadAudioStreaming(url: string, outputPath: string) {
  const response = await fetch(url);
  await pipeline(
    response.body,
    createWriteStream(outputPath)
  );
  return outputPath;
}
```

---

## Summary: What You DON'T Need to Build

✅ **Video storage** - Handled by Mux through Whop  
✅ **Video hosting** - Mux delivers via CDN  
✅ **Video transcoding** - Mux handles all formats  
✅ **Video upload UI** - Creators use Whop dashboard  

## What ChronosAI DOES Build

✅ **Video discovery from Whop API**  
✅ **Transcript extraction from Mux videos**  
✅ **Text chunking & vectorization**  
✅ **Semantic search with timestamps**  
✅ **AI chat interface with video citations**  
✅ **Student progress tracking**

---

**Ready to implement?** Start with the video discovery endpoint and verify you can access Mux playback IDs. The rest of the pipeline builds on that foundation!
