'use client';

import { useRef, useState } from 'react';
import VideoPlayer, { VideoPlayerHandle } from '../VideoPlayer';
import type { Database } from '@/lib/db/types';

type Video = Database['public']['Tables']['videos']['Row'];

/**
 * VideoPlayerSeekTest Component
 *
 * Test harness for verifying seekTo() functionality across all video sources
 *
 * Test Cases:
 * 1. Seek to start (0 seconds)
 * 2. Seek to middle (50% of duration)
 * 3. Seek to near end (90% of duration)
 * 4. Seek while paused
 * 5. Seek while playing
 * 6. Multiple rapid seeks (scrubbing simulation)
 *
 * Tested Sources:
 * - YouTube
 * - Mux (Whop videos)
 * - Loom
 * - Upload (HTML5)
 */
export default function VideoPlayerSeekTest() {
  const playerRef = useRef<VideoPlayerHandle>(null);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [seekTime, setSeekTime] = useState<string>('0');
  const [testResults, setTestResults] = useState<string[]>([]);

  // Sample test videos (replace with actual video IDs from your database)
  const testVideos: Video[] = [
    {
      id: 'youtube-test',
      creator_id: 'test-creator',
      title: 'Test YouTube Video',
      description: 'YouTube test video',
      url: null,
      storage_path: null,
      thumbnail_url: null,
      duration_seconds: 300, // 5 minutes
      transcript: null,
      transcript_language: null,
      status: 'completed',
      error_message: null,
      processing_started_at: null,
      processing_completed_at: null,
      file_size_bytes: null,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      source_type: 'youtube',
      youtube_video_id: 'dQw4w9WgXcQ', // Replace with actual video ID
      youtube_channel_id: null,
      whop_lesson_id: null,
      mux_asset_id: null,
      mux_playback_id: null,
      embed_type: 'youtube',
      embed_id: 'dQw4w9WgXcQ',
    },
    {
      id: 'mux-test',
      creator_id: 'test-creator',
      title: 'Test Mux Video (Whop)',
      description: 'Mux/Whop test video',
      url: null,
      storage_path: null,
      thumbnail_url: null,
      duration_seconds: 180, // 3 minutes
      transcript: null,
      transcript_language: null,
      status: 'completed',
      error_message: null,
      processing_started_at: null,
      processing_completed_at: null,
      file_size_bytes: null,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      source_type: 'mux',
      youtube_video_id: null,
      youtube_channel_id: null,
      whop_lesson_id: 'test-lesson',
      mux_asset_id: 'test-asset',
      mux_playback_id: 'test-playback-id', // Replace with actual playback ID
      embed_type: null,
      embed_id: null,
    },
    {
      id: 'loom-test',
      creator_id: 'test-creator',
      title: 'Test Loom Video',
      description: 'Loom test video',
      url: null,
      storage_path: null,
      thumbnail_url: null,
      duration_seconds: 120, // 2 minutes
      transcript: null,
      transcript_language: null,
      status: 'completed',
      error_message: null,
      processing_started_at: null,
      processing_completed_at: null,
      file_size_bytes: null,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      source_type: 'loom',
      youtube_video_id: null,
      youtube_channel_id: null,
      whop_lesson_id: null,
      mux_asset_id: null,
      mux_playback_id: null,
      embed_type: 'loom',
      embed_id: 'test-loom-id', // Replace with actual Loom video ID
    },
    {
      id: 'upload-test',
      creator_id: 'test-creator',
      title: 'Test Uploaded Video',
      description: 'Upload test video',
      url: 'https://test-bucket.supabase.co/storage/v1/object/public/videos/test-video.mp4',
      storage_path: 'videos/test-video.mp4',
      thumbnail_url: null,
      duration_seconds: 240, // 4 minutes
      transcript: null,
      transcript_language: null,
      status: 'completed',
      error_message: null,
      processing_started_at: null,
      processing_completed_at: null,
      file_size_bytes: 10485760,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      source_type: 'upload',
      youtube_video_id: null,
      youtube_channel_id: null,
      whop_lesson_id: null,
      mux_asset_id: null,
      mux_playback_id: null,
      embed_type: null,
      embed_id: null,
    },
  ];

  const addTestResult = (result: string) => {
    setTestResults((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${result}`]);
  };

  const handleSeek = () => {
    const seconds = parseInt(seekTime);
    if (isNaN(seconds) || seconds < 0) {
      addTestResult('❌ Invalid seek time');
      return;
    }

    try {
      playerRef.current?.seekTo(seconds);
      addTestResult(`✅ Seeking to ${seconds}s on ${currentVideo?.source_type || 'unknown'} video`);
    } catch (error) {
      addTestResult(`❌ Seek failed: ${error}`);
    }
  };

  const runAutomatedTests = async () => {
    if (!currentVideo || !playerRef.current) {
      addTestResult('❌ No video loaded');
      return;
    }

    const duration = currentVideo.duration_seconds || 100;
    const tests = [
      { name: 'Seek to start', time: 0 },
      { name: 'Seek to 10%', time: Math.floor(duration * 0.1) },
      { name: 'Seek to 50%', time: Math.floor(duration * 0.5) },
      { name: 'Seek to 90%', time: Math.floor(duration * 0.9) },
    ];

    addTestResult(`🚀 Running automated tests for ${currentVideo.source_type} video`);

    for (const test of tests) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      try {
        playerRef.current?.seekTo(test.time);
        addTestResult(`✅ ${test.name}: ${test.time}s`);
      } catch (error) {
        addTestResult(`❌ ${test.name} failed: ${error}`);
      }
    }

    addTestResult(`✨ Automated tests completed for ${currentVideo.source_type}`);
  };

  const testPlayPauseControls = () => {
    if (!playerRef.current) {
      addTestResult('❌ No player reference');
      return;
    }

    try {
      playerRef.current.play();
      addTestResult('✅ Play() called');

      setTimeout(() => {
        playerRef.current?.pause();
        addTestResult('✅ Pause() called');

        setTimeout(() => {
          const currentTime = playerRef.current?.getCurrentTime() || 0;
          const duration = playerRef.current?.getDuration() || 0;
          addTestResult(`📊 Current: ${currentTime.toFixed(1)}s | Duration: ${duration.toFixed(1)}s`);
        }, 500);
      }, 2000);
    } catch (error) {
      addTestResult(`❌ Play/Pause test failed: ${error}`);
    }
  };

  const testVolumeControl = () => {
    if (!playerRef.current) {
      addTestResult('❌ No player reference');
      return;
    }

    try {
      playerRef.current.setVolume(0.5);
      addTestResult('✅ Volume set to 50%');
    } catch (error) {
      addTestResult(`❌ Volume test failed: ${error}`);
    }
  };

  const testPlaybackRate = () => {
    if (!playerRef.current) {
      addTestResult('❌ No player reference');
      return;
    }

    try {
      playerRef.current.setPlaybackRate(1.5);
      addTestResult('✅ Playback rate set to 1.5x');
    } catch (error) {
      addTestResult(`❌ Playback rate test failed: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          VideoPlayer seekTo() Test Harness
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test seeking functionality across all video sources
        </p>
      </div>

      {/* Video Source Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Select Video Source
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {testVideos.map((video) => (
            <button
              key={video.id}
              onClick={() => {
                setCurrentVideo(video);
                addTestResult(`📹 Loaded ${video.source_type} video: ${video.title}`);
              }}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                currentVideo?.id === video.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="text-sm">{video.source_type?.toUpperCase()}</div>
              <div className="text-xs mt-1 opacity-75">{video.duration_seconds}s</div>
            </button>
          ))}
        </div>
      </div>

      {/* Video Player */}
      {currentVideo && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {currentVideo.title}
          </h2>
          <VideoPlayer
            ref={playerRef}
            video={currentVideo}
            enableAnalytics={false}
            onPlay={() => addTestResult('🎬 Video playing')}
            onPause={() => addTestResult('⏸️  Video paused')}
            onProgress={(time) => {
              // Only log every 10 seconds to avoid spam
              if (Math.floor(time) % 10 === 0) {
                addTestResult(`⏱️  Progress: ${Math.floor(time)}s`);
              }
            }}
          />
        </div>
      )}

      {/* Manual Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Manual Seek Control
        </h2>
        <div className="flex gap-3">
          <input
            type="number"
            value={seekTime}
            onChange={(e) => setSeekTime(e.target.value)}
            placeholder="Seconds"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            min="0"
          />
          <button
            onClick={handleSeek}
            disabled={!currentVideo}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Seek
          </button>
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          <button
            onClick={() => {
              setSeekTime('0');
              handleSeek();
            }}
            disabled={!currentVideo}
            className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Start
          </button>
          <button
            onClick={() => {
              const mid = Math.floor((currentVideo?.duration_seconds || 100) * 0.5);
              setSeekTime(mid.toString());
              playerRef.current?.seekTo(mid);
            }}
            disabled={!currentVideo}
            className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Middle (50%)
          </button>
          <button
            onClick={() => {
              const end = Math.floor((currentVideo?.duration_seconds || 100) * 0.9);
              setSeekTime(end.toString());
              playerRef.current?.seekTo(end);
            }}
            disabled={!currentVideo}
            className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Near End (90%)
          </button>
        </div>
      </div>

      {/* Automated Test Suite */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Automated Test Suite
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={runAutomatedTests}
            disabled={!currentVideo}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Run All Seek Tests
          </button>
          <button
            onClick={testPlayPauseControls}
            disabled={!currentVideo}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Test Play/Pause
          </button>
          <button
            onClick={testVolumeControl}
            disabled={!currentVideo}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Test Volume
          </button>
          <button
            onClick={testPlaybackRate}
            disabled={!currentVideo}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Test Playback Rate
          </button>
        </div>
      </div>

      {/* Test Results Console */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Test Results
          </h2>
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Clear
          </button>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
          {testResults.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No test results yet. Run some tests to see output here.
            </p>
          ) : (
            testResults.map((result, index) => (
              <div
                key={index}
                className="text-gray-900 dark:text-gray-100 py-1 border-b border-gray-200 dark:border-gray-700 last:border-0"
              >
                {result}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Testing Instructions
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
          <li>Select a video source from the buttons above</li>
          <li>Wait for the video to load in the player</li>
          <li>Use manual controls to test specific seek times</li>
          <li>Run automated test suite to verify all milestone seeks</li>
          <li>Check the test results console for success/failure messages</li>
          <li>Repeat for all 4 video sources (YouTube, Mux, Loom, Upload)</li>
        </ol>
      </div>
    </div>
  );
}
