'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, Download, Save, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';

interface LessonNotesProps {
  lessonId: string;
  studentId: string;
  videoTitle?: string;
  className?: string;
  defaultExpanded?: boolean;
}

interface NoteData {
  id?: string;
  content: string;
  updated_at?: string;
}

/**
 * LessonNotes Component
 *
 * Allows students to take notes while watching lessons.
 * Features:
 * - Auto-save every 2 seconds (debounced)
 * - Export notes as plain text
 * - Collapsible panel
 * - Last saved timestamp
 * - Persists across sessions
 *
 * Usage:
 * ```tsx
 * <LessonNotes
 *   lessonId={videoId}
 *   studentId={studentId}
 *   videoTitle="Introduction to React"
 * />
 * ```
 */
export function LessonNotes({
  lessonId,
  studentId,
  videoTitle,
  className,
  defaultExpanded = true,
}: LessonNotesProps) {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [error, setError] = useState<string | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  /**
   * Fetch existing notes on mount
   */
  useEffect(() => {
    fetchNotes();
  }, [lessonId, studentId]);

  /**
   * Auto-save when notes change (debounced)
   */
  useEffect(() => {
    // Don't save on initial load
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout to save after 2 seconds
    saveTimeoutRef.current = setTimeout(() => {
      saveNotes();
    }, 2000);

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [notes]);

  /**
   * Fetch notes from API
   */
  const fetchNotes = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/notes?lesson_id=${lessonId}&student_id=${studentId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }

      const data = await response.json();

      if (data.success && data.note) {
        setNotes(data.note.content || '');
        if (data.note.updated_at) {
          setLastSaved(new Date(data.note.updated_at));
        }
      }
    } catch (err) {
      console.error('[LessonNotes] Failed to fetch notes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save notes to API
   */
  const saveNotes = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId,
          student_id: studentId,
          content: notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save notes');
      }

      const data = await response.json();

      if (data.success) {
        setLastSaved(new Date());
      }
    } catch (err) {
      console.error('[LessonNotes] Failed to save notes:', err);
      setError(err instanceof Error ? err.message : 'Failed to save notes');
      toast.error('Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Export notes as text file
   */
  const exportNotes = () => {
    if (!notes.trim()) {
      toast.warning('No notes to export');
      return;
    }

    const filename = `notes-${videoTitle ? videoTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase() : lessonId}-${new Date().toISOString().split('T')[0]}.txt`;

    const content = `# Notes for ${videoTitle || 'Lesson'}\n\nDate: ${new Date().toLocaleDateString()}\n\n${notes}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Notes exported successfully');
  };

  /**
   * Format relative time
   */
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className={cn('transition-all', className)} padding="none">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">My Notes</h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Status indicator */}
          {!isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {isSaving ? (
                <>
                  <Save className="h-4 w-4 animate-pulse text-blue-600" />
                  <span className="text-blue-600">Saving...</span>
                </>
              ) : lastSaved ? (
                <>
                  <Clock className="h-4 w-4" />
                  <span>Saved {formatRelativeTime(lastSaved)}</span>
                </>
              ) : null}
            </div>
          )}

          {/* Expand/collapse button */}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {/* Loading state */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading notes...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Error display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Textarea */}
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Take notes while watching the lesson..."
                className={cn(
                  'w-full h-48 px-3 py-2 border border-gray-300 rounded-lg',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  'resize-none font-sans text-sm text-gray-900 placeholder:text-gray-400',
                  'transition-shadow'
                )}
                disabled={isLoading}
              />

              {/* Character count */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{notes.length} characters</span>
                <span>{notes.split('\n').length} lines</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={exportNotes}
                  variant="outline"
                  size="sm"
                  icon={<Download className="h-4 w-4" />}
                  iconPosition="left"
                  disabled={!notes.trim() || isLoading}
                >
                  Export Notes
                </Button>

                <Button
                  onClick={saveNotes}
                  variant="default"
                  size="sm"
                  icon={<Save className="h-4 w-4" />}
                  iconPosition="left"
                  disabled={isLoading}
                >
                  Save Now
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
