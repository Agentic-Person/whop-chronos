'use client';

/**
 * Video Debug Page
 *
 * Admin debug interface for diagnosing and fixing stuck video processing
 * Located at: /dashboard/creator/videos/debug
 *
 * Features:
 * - Inngest health monitoring
 * - Stuck videos diagnostics
 * - Manual retry capabilities
 * - System status overview
 * - Real-time updates
 */

import { useState } from 'react';
import { ArrowLeft, AlertTriangle, Settings } from 'lucide-react';
import { Button, Card } from 'frosted-ui';
import { VideoDebugPanel } from '@/components/admin/VideoDebugPanel';
import Link from 'next/link';

export default function VideoDebugPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/dashboard/creator/videos">
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Back to Videos
            </Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-amber-3 border border-amber-a4">
                <Settings className="h-6 w-6 text-amber-11" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-12">Video Debug Panel</h1>
                <p className="mt-1 text-gray-11">
                  Diagnose and fix stuck video processing issues
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-11 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded border-gray-a4 text-purple-9 focus:ring-purple-9"
              />
              Auto-refresh (30s)
            </label>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <Card className="mb-6 bg-amber-2 border-amber-a4">
        <div className="flex items-start gap-3 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-11 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-amber-12 mb-1">Admin Debug Interface</h3>
            <p className="text-sm text-amber-11">
              This panel is for troubleshooting stuck video processing. Videos are considered
              "stuck" if they've been in a processing state for more than 10 minutes. Use the
              retry functions to manually trigger Inngest jobs.
            </p>
          </div>
        </div>
      </Card>

      {/* Debug Panel */}
      <VideoDebugPanel autoRefresh={autoRefresh} refreshInterval={30000} />

      {/* Documentation */}
      <Card className="mt-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-12 mb-4">Troubleshooting Guide</h2>

          <div className="space-y-4 text-sm text-gray-11">
            <div>
              <h3 className="font-medium text-gray-12 mb-2">1. Check Inngest Status</h3>
              <p>
                If Inngest shows as disconnected, start the Inngest dev server:
              </p>
              <code className="block mt-2 px-3 py-2 bg-gray-3 rounded text-gray-12 font-mono text-xs">
                npx inngest-cli dev -u http://localhost:3007/api/inngest
              </code>
              <p className="mt-2">
                Access Inngest dashboard at:{' '}
                <a
                  href="http://localhost:8288"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-11 hover:underline"
                >
                  http://localhost:8288
                </a>
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-12 mb-2">2. Understanding Video States</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>Pending:</strong> Video created, waiting for transcription
                </li>
                <li>
                  <strong>Transcribing:</strong> Extracting transcript from video
                </li>
                <li>
                  <strong>Processing:</strong> Chunking transcript into segments
                </li>
                <li>
                  <strong>Embedding:</strong> Generating vector embeddings for chunks
                </li>
                <li>
                  <strong>Completed:</strong> All processing finished successfully
                </li>
                <li>
                  <strong>Failed:</strong> Processing encountered an error
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-12 mb-2">3. Retry Logic</h3>
              <p>
                The retry function intelligently determines which Inngest event to send based on
                the video's current state:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                <li>
                  If stuck in <strong>pending/transcribing</strong> without transcript → Retry
                  transcription
                </li>
                <li>
                  If stuck in <strong>transcribing</strong> with transcript → Skip to chunking
                </li>
                <li>
                  If stuck in <strong>processing</strong> → Retry chunking
                </li>
                <li>
                  If stuck in <strong>embedding</strong> → Retry embedding generation
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-12 mb-2">4. Common Issues</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>Inngest not running:</strong> Videos will never progress. Start Inngest
                  dev server.
                </li>
                <li>
                  <strong>Missing transcript:</strong> Check if YouTube/Loom API is accessible.
                </li>
                <li>
                  <strong>Zero chunks:</strong> Transcript may be empty or chunking failed.
                </li>
                <li>
                  <strong>Long stuck duration:</strong> Check Inngest logs for errors.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-12 mb-2">5. Manual Recovery</h3>
              <p>
                If retry doesn't work, you can manually fix videos using the database or scripts:
              </p>
              <code className="block mt-2 px-3 py-2 bg-gray-3 rounded text-gray-12 font-mono text-xs">
                npx tsx scripts/trigger-embeddings.ts
              </code>
              <code className="block mt-2 px-3 py-2 bg-gray-3 rounded text-gray-12 font-mono text-xs">
                npx tsx scripts/check-database.ts
              </code>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
