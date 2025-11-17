'use client';

/**
 * Lesson Components Example
 *
 * Example usage of LessonCard, VideoMetadataPanel, and ProgressIndicator components
 * This file demonstrates:
 * - How to use each component with sample data
 * - Different states (selected, unselected, completed, in-progress)
 * - Responsive layouts
 * - Component integration patterns
 */

import { useState } from 'react';
import { LessonCard } from './LessonCard';
import { VideoMetadataPanel } from '../video/VideoMetadataPanel';
// import { ProgressIndicator } from '../video/ProgressIndicator'; // TODO: File doesn't exist

// Sample lesson data
const sampleLessons = [
  {
    id: '1',
    title: 'Introduction to React Hooks - useState and useEffect Explained',
    thumbnail: 'https://i.ytimg.com/vi/O6P86uwfdR0/mqdefault.jpg',
    duration_seconds: 1567, // 26:07
    source_type: 'youtube' as const,
  },
  {
    id: '2',
    title: 'Advanced TypeScript Patterns for React',
    thumbnail: null,
    duration_seconds: 2145, // 35:45
    source_type: 'loom' as const,
  },
  {
    id: '3',
    title: 'Building a Full-Stack Next.js Application',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    duration_seconds: 3600, // 1:00:00
    source_type: 'mux' as const,
  },
  {
    id: '4',
    title: 'CSS Grid and Flexbox Mastery',
    thumbnail: 'https://i.ytimg.com/vi/example/mqdefault.jpg',
    duration_seconds: 900, // 15:00
    source_type: 'upload' as const,
  },
];

// Sample video metadata
const sampleVideo = {
  id: '9e6b2942-7c8a-4f1d-b3e5-6d2c9a1f8e3b',
  title: 'Introduction to React Hooks - useState and useEffect Explained',
  duration_seconds: 1567,
};

// Sample progress data
const sampleProgress = {
  percent_complete: 67,
  watch_time_seconds: 1050, // 17:30
  last_watched: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
};

export default function LessonComponentsExample() {
  const [selectedLessonId, setSelectedLessonId] = useState<string>('1');

  return (
    <div className="min-h-screen bg-gray-1 p-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-12 mb-2">
            Lesson Components Example
          </h1>
          <p className="text-gray-11">
            Interactive examples of LessonCard, VideoMetadataPanel, and ProgressIndicator
          </p>
        </div>

        {/* LessonCard Examples */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-12">LessonCard Component</h2>
          <p className="text-sm text-gray-11">
            Click on a lesson card to select it. Notice the hover effects and selected state.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sampleLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                isSelected={selectedLessonId === lesson.id}
                onSelect={setSelectedLessonId}
              />
            ))}
          </div>
        </section>

        {/* VideoMetadataPanel Examples */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-12">VideoMetadataPanel Component</h2>

          <div className="space-y-6">
            {/* With Progress */}
            <div className="bg-gray-2 border border-gray-a4 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-11 mb-4">With Progress</h3>
              <VideoMetadataPanel video={sampleVideo} progress={sampleProgress} />
            </div>

            {/* Without Progress */}
            <div className="bg-gray-2 border border-gray-a4 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-11 mb-4">Without Progress</h3>
              <VideoMetadataPanel video={sampleVideo} />
            </div>
          </div>
        </section>

        {/* ProgressIndicator Examples - DISABLED: Component file doesn't exist */}
        {/* <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-12">ProgressIndicator Component</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-2 border border-gray-a4 rounded-lg p-6 flex flex-col items-center">
              <h3 className="text-sm font-semibold text-gray-11 mb-4">0-25% (Gray)</h3>
              <ProgressIndicator
                percent={15}
                resumeSeconds={235}
                isCompleted={false}
                size="md"
              />
            </div>

            <div className="bg-gray-2 border border-gray-a4 rounded-lg p-6 flex flex-col items-center">
              <h3 className="text-sm font-semibold text-gray-11 mb-4">26-50% (Yellow)</h3>
              <ProgressIndicator
                percent={42}
                resumeSeconds={658}
                isCompleted={false}
                size="md"
              />
            </div>

            <div className="bg-gray-2 border border-gray-a4 rounded-lg p-6 flex flex-col items-center">
              <h3 className="text-sm font-semibold text-gray-11 mb-4">51-99% (Blue)</h3>
              <ProgressIndicator
                percent={67}
                resumeSeconds={1050}
                isCompleted={false}
                size="md"
              />
            </div>

            <div className="bg-gray-2 border border-gray-a4 rounded-lg p-6 flex flex-col items-center">
              <h3 className="text-sm font-semibold text-gray-11 mb-4">100% (Completed)</h3>
              <ProgressIndicator
                percent={100}
                isCompleted={true}
                size="md"
              />
            </div>
          </div>

          <div className="bg-gray-2 border border-gray-a4 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-11 mb-4">Size Variations</h3>
            <div className="flex items-center justify-around">
              <div className="text-center">
                <p className="text-xs text-gray-11 mb-2">Small</p>
                <ProgressIndicator
                  percent={67}
                  resumeSeconds={1050}
                  isCompleted={false}
                  size="sm"
                />
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-11 mb-2">Medium (Default)</p>
                <ProgressIndicator
                  percent={67}
                  resumeSeconds={1050}
                  isCompleted={false}
                  size="md"
                />
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-11 mb-2">Large</p>
                <ProgressIndicator
                  percent={67}
                  resumeSeconds={1050}
                  isCompleted={false}
                  size="lg"
                />
              </div>
            </div>
          </div>
        </section> */}

        {/* Integration Example */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-12">Integrated Layout Example</h2>
          <p className="text-sm text-gray-11">
            How these components work together in a typical lesson interface
          </p>

          <div className="bg-gray-2 border border-gray-a4 rounded-lg p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left: Video Metadata */}
              <div className="flex-1">
                <VideoMetadataPanel video={sampleVideo} progress={sampleProgress} />
              </div>

              {/* Right: Progress Indicator - DISABLED */}
              {/* <div className="flex items-start justify-center lg:justify-end">
                <ProgressIndicator
                  percent={sampleProgress.percent_complete}
                  resumeSeconds={804}
                  isCompleted={false}
                  size="lg"
                />
              </div> */}
            </div>

            {/* Bottom: Lesson List */}
            <div className="mt-8 pt-6 border-t border-gray-a4">
              <h3 className="text-lg font-semibold text-gray-12 mb-4">Course Lessons</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {sampleLessons.map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    isSelected={selectedLessonId === lesson.id}
                    onSelect={setSelectedLessonId}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Usage Notes */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-12">Usage Notes</h2>
          <div className="bg-gray-2 border border-gray-a4 rounded-lg p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-12 mb-2">LessonCard</h3>
              <ul className="text-sm text-gray-11 space-y-1 list-disc list-inside">
                <li>80x45px thumbnail (16:9 aspect ratio)</li>
                <li>Source type badge in top-left corner</li>
                <li>Duration badge in bottom-right corner</li>
                <li>2-line title truncation</li>
                <li>Hover scale and shadow effects</li>
                <li>Selected state with blue ring</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-12 mb-2">VideoMetadataPanel</h3>
              <ul className="text-sm text-gray-11 space-y-1 list-disc list-inside">
                <li>Large title (2xl on mobile, 3xl on desktop)</li>
                <li>Duration in human-readable format</li>
                <li>Truncated video ID badge</li>
                <li>Optional progress bar with color coding</li>
                <li>Last watched relative timestamp</li>
                <li>Responsive flex layout</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-12 mb-2">ProgressIndicator</h3>
              <ul className="text-sm text-gray-11 space-y-1 list-disc list-inside">
                <li>SVG circular progress ring</li>
                <li>Color coding: Gray (0-25%), Yellow (26-50%), Blue (51-99%), Green (100%)</li>
                <li>Resume point badge with timestamp</li>
                <li>Completion badge with checkmark</li>
                <li>Three size variants: sm (80px), md (120px), lg (160px)</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
