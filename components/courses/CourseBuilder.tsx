'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, GripVertical, MoreVertical, Trash2, Loader2 } from 'lucide-react';
import { useAnalytics } from '@/lib/contexts/AnalyticsContext';
import AddLessonDialog from './AddLessonDialog';
import VideoLibraryPicker from './VideoLibraryPicker';
import VideoUploader from './VideoUploader';
import VideoUrlUploader from './VideoUrlUploader';

interface Chapter {
  id: string;
  name: string;
  lessons: Lesson[];
  isExpanded: boolean;
  display_order: number;
}

interface Lesson {
  id: string;
  type: 'video' | 'quiz';
  title: string;
  videoId?: string;
  thumbnail?: string;
  duration?: number;
  lesson_order: number;
}

interface Course {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  aspectRatio: '16:9' | '9:16';
}

interface CourseBuilderProps {
  course: Course;
  onBack: () => void;
}

export default function CourseBuilder({ course, onBack }: CourseBuilderProps) {
  const { creatorId } = useAnalytics();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [showAddLessonDialog, setShowAddLessonDialog] = useState(false);
  const [addLessonToChapterId, setAddLessonToChapterId] = useState<string | null>(null);
  const [lessonCreationMode, setLessonCreationMode] = useState<'url' | 'insert' | 'upload' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId);
  const selectedLesson = selectedChapter?.lessons.find((l) => l.id === selectedLessonId);

  // Load chapters and lessons from database
  useEffect(() => {
    async function loadCourseData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch modules for this course
        const modulesRes = await fetch(`/api/courses/${course.id}/modules`);
        if (!modulesRes.ok) {
          throw new Error('Failed to load course modules');
        }

        const modulesData = await modulesRes.json();
        const modules = modulesData.data.modules || [];

        // Fetch lessons for each module
        const chaptersWithLessons = await Promise.all(
          modules.map(async (module: any) => {
            const lessonsRes = await fetch(`/api/modules/${module.id}/lessons`);
            if (!lessonsRes.ok) {
              console.error(`Failed to load lessons for module ${module.id}`);
              return {
                id: module.id,
                name: module.title,
                lessons: [],
                isExpanded: true,
                display_order: module.display_order,
              };
            }

            const lessonsData = await lessonsRes.json();
            const lessons = lessonsData.data.lessons || [];

            return {
              id: module.id,
              name: module.title,
              lessons: lessons.map((lesson: any) => ({
                id: lesson.id,
                type: 'video' as const,
                title: lesson.title,
                videoId: lesson.video_id,
                thumbnail: lesson.video?.thumbnail_url,
                duration: lesson.video?.duration_seconds,
                lesson_order: lesson.lesson_order,
              })),
              isExpanded: true,
              display_order: module.display_order,
            };
          })
        );

        // Sort by display_order
        chaptersWithLessons.sort((a, b) => a.display_order - b.display_order);

        setChapters(chaptersWithLessons);

        // Set first chapter as selected if none selected
        if (!selectedChapterId && chaptersWithLessons.length > 0) {
          setSelectedChapterId(chaptersWithLessons[0].id);
        }
      } catch (err) {
        console.error('Error loading course data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load course data');
      } finally {
        setIsLoading(false);
      }
    }

    loadCourseData();
  }, [course.id]);

  const addChapter = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const nextOrder = chapters.length > 0
        ? Math.max(...chapters.map(c => c.display_order)) + 1
        : 1;

      const response = await fetch(`/api/courses/${course.id}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Chapter ${chapters.length + 1}`,
          description: '',
          display_order: nextOrder,
          creator_id: creatorId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create chapter');
      }

      const data = await response.json();
      const newChapter: Chapter = {
        id: data.data.id,
        name: data.data.title,
        lessons: [],
        isExpanded: true,
        display_order: data.data.display_order,
      };

      setChapters([...chapters, newChapter]);
    } catch (err) {
      console.error('Error adding chapter:', err);
      setError(err instanceof Error ? err.message : 'Failed to add chapter');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteChapter = async (chapterId: string) => {
    if (chapters.length === 1) {
      alert('Cannot delete the last chapter');
      return;
    }
    if (!confirm('Are you sure you want to delete this chapter? All lessons will be removed.')) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/modules/${chapterId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_id: creatorId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete chapter');
      }

      setChapters(chapters.filter((c) => c.id !== chapterId));
      if (selectedChapterId === chapterId) {
        const remainingChapters = chapters.filter((c) => c.id !== chapterId);
        setSelectedChapterId(remainingChapters.length > 0 ? remainingChapters[0].id : null);
      }
    } catch (err) {
      console.error('Error deleting chapter:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete chapter');
    } finally {
      setIsSaving(false);
    }
  };

  const renameChapter = (chapterId: string, newName: string) => {
    setChapters(
      chapters.map((c) => (c.id === chapterId ? { ...c, name: newName } : c))
    );
  };

  const toggleChapter = (chapterId: string) => {
    setChapters(
      chapters.map((c) =>
        c.id === chapterId ? { ...c, isExpanded: !c.isExpanded } : c
      )
    );
  };

  const handleAddLesson = (chapterId: string) => {
    setAddLessonToChapterId(chapterId);
    setShowAddLessonDialog(true);
  };

  const handleLessonTypeSelected = (type: 'url' | 'insert' | 'upload') => {
    setShowAddLessonDialog(false);
    setLessonCreationMode(type);
  };

  const handleVideoSelected = async (video: any) => {
    if (!addLessonToChapterId) return;

    try {
      setIsSaving(true);
      setError(null);

      const chapter = chapters.find((c) => c.id === addLessonToChapterId);
      if (!chapter) return;

      const nextOrder = chapter.lessons.length > 0
        ? Math.max(...chapter.lessons.map(l => l.lesson_order)) + 1
        : 1;

      const response = await fetch(`/api/modules/${addLessonToChapterId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: video.id,
          title: video.title,
          lesson_order: nextOrder,
          creator_id: creatorId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add lesson');
      }

      const data = await response.json();
      const newLesson: Lesson = {
        id: data.data.id,
        type: 'video',
        title: video.title,
        videoId: video.id,
        thumbnail: video.thumbnail,
        duration: video.duration,
        lesson_order: nextOrder,
      };

      setChapters(
        chapters.map((c) =>
          c.id === addLessonToChapterId
            ? { ...c, lessons: [...c.lessons, newLesson] }
            : c
        )
      );

      setLessonCreationMode(null);
      setAddLessonToChapterId(null);
      setSelectedLessonId(newLesson.id);
    } catch (err) {
      console.error('Error adding lesson:', err);
      setError(err instanceof Error ? err.message : 'Failed to add lesson');
      // Don't clear the dialog on error so user can retry
    } finally {
      setIsSaving(false);
    }
  };

  const handleVideoUploaded = async (video: any) => {
    if (!addLessonToChapterId) return;

    try {
      setIsSaving(true);
      setError(null);

      const chapter = chapters.find((c) => c.id === addLessonToChapterId);
      if (!chapter) return;

      // Handle both string (legacy) and object (new) formats
      let videoData;
      if (typeof video === 'string') {
        // Legacy format: video is just an ID, fetch full data
        const videoResponse = await fetch(`/api/video/${video}`);
        if (!videoResponse.ok) {
          throw new Error('Failed to fetch video data');
        }
        const videoResult = await videoResponse.json();
        if (videoResult.success && videoResult.data) {
          videoData = {
            id: videoResult.data.id,
            title: videoResult.data.title,
            thumbnail: videoResult.data.thumbnailUrl,
            duration: videoResult.data.duration,
          };
        } else {
          throw new Error('Invalid video data structure');
        }
      } else {
        // New format: video is already a full object
        videoData = video;
      }

      const nextOrder = chapter.lessons.length > 0
        ? Math.max(...chapter.lessons.map(l => l.lesson_order)) + 1
        : 1;

      const response = await fetch(`/api/modules/${addLessonToChapterId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: videoData.id,
          title: videoData.title,
          lesson_order: nextOrder,
          creator_id: creatorId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add lesson');
      }

      const data = await response.json();
      const newLesson: Lesson = {
        id: data.data.id,
        type: 'video',
        title: videoData.title,
        videoId: videoData.id,
        thumbnail: videoData.thumbnail,
        duration: videoData.duration,
        lesson_order: nextOrder,
      };

      setChapters(
        chapters.map((c) =>
          c.id === addLessonToChapterId
            ? { ...c, lessons: [...c.lessons, newLesson] }
            : c
        )
      );

      setLessonCreationMode(null);
      setAddLessonToChapterId(null);
      setSelectedLessonId(newLesson.id);
    } catch (err) {
      console.error('Error adding lesson:', err);
      setError(err instanceof Error ? err.message : 'Failed to add lesson');
      // Don't clear the dialog on error so user can retry
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLesson = async (chapterId: string, lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/modules/${chapterId}/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_id: creatorId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete lesson');
      }

      setChapters(
        chapters.map((c) =>
          c.id === chapterId
            ? { ...c, lessons: c.lessons.filter((l) => l.id !== lessonId) }
            : c
        )
      );
      if (selectedLessonId === lessonId) {
        setSelectedLessonId(null);
      }
    } catch (err) {
      console.error('Error deleting lesson:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete lesson');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-gray-1">
        <div className="border-b border-gray-6 px-6 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-11 hover:text-gray-12 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-xl font-semibold text-gray-12 mt-2">{course.name}</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-blue-9 animate-spin mx-auto mb-4" />
            <p className="text-gray-11">Loading course data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-1">
      {/* Header */}
      <div className="border-b border-gray-6 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-11 hover:text-gray-12 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-12 mt-2">{course.name}</h1>
          </div>
          {isSaving && (
            <div className="flex items-center gap-2 text-blue-11">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Saving...</span>
            </div>
          )}
        </div>
        {error && (
          <div className="mt-2 px-3 py-2 bg-red-3 border border-red-6 rounded text-red-11 text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Chapters */}
        <div className="w-64 border-r border-gray-6 overflow-y-auto bg-gray-2">
          <div className="p-4 space-y-2">
            {chapters.map((chapter) => (
              <div key={chapter.id} className="space-y-1">
                {/* Chapter header */}
                <div className="flex items-center gap-2 group">
                  <button
                    onClick={() => toggleChapter(chapter.id)}
                    className="flex-1 flex items-center gap-2 px-2 py-2 hover:bg-gray-3 rounded text-left"
                  >
                    <GripVertical className="w-4 h-4 text-gray-9" />
                    <span
                      className={`text-sm font-medium ${
                        selectedChapterId === chapter.id ? 'text-blue-11' : 'text-gray-12'
                      }`}
                    >
                      {chapter.name}
                    </span>
                  </button>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleAddLesson(chapter.id)}
                      className="p-1 hover:bg-gray-4 rounded"
                      title="Add lesson"
                    >
                      <Plus className="w-4 h-4 text-gray-11" />
                    </button>
                    <button
                      onClick={() => deleteChapter(chapter.id)}
                      className="p-1 hover:bg-gray-4 rounded"
                      title="Delete chapter"
                    >
                      <Trash2 className="w-4 h-4 text-red-9" />
                    </button>
                  </div>
                </div>

                {/* Lessons */}
                {chapter.isExpanded && (
                  <div className="ml-6 space-y-1">
                    {chapter.lessons.length === 0 ? (
                      <div className="py-4 text-center">
                        <p className="text-xs text-gray-10 mb-2">No lessons in this chapter</p>
                        <button
                          onClick={() => handleAddLesson(chapter.id)}
                          className="text-xs text-blue-11 hover:text-blue-12"
                        >
                          + Add lesson
                        </button>
                      </div>
                    ) : (
                      chapter.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          onClick={() => {
                            setSelectedChapterId(chapter.id);
                            setSelectedLessonId(lesson.id);
                          }}
                          className={`flex items-center gap-2 px-2 py-2 rounded cursor-pointer group ${
                            selectedLessonId === lesson.id
                              ? 'bg-blue-3 text-blue-11'
                              : 'hover:bg-gray-3 text-gray-11'
                          }`}
                        >
                          <span className="text-xs flex-1 truncate">{lesson.title}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLesson(chapter.id, lesson.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-3 rounded"
                          >
                            <Trash2 className="w-3 h-3 text-red-9" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Add Chapter Button */}
            <button
              onClick={addChapter}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-4 border border-dashed border-gray-6 rounded hover:border-blue-7 hover:bg-gray-3 transition-colors text-gray-11 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add new chapter
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedLessonId ? (
            <div className="flex items-center justify-center h-full text-gray-11">
              <p>No lesson selected</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-12 mb-6">{selectedLesson?.title}</h2>
              <p className="text-gray-11">Lesson content editor would go here...</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Lesson Dialog */}
      <AddLessonDialog
        isOpen={showAddLessonDialog}
        onClose={() => {
          setShowAddLessonDialog(false);
          setAddLessonToChapterId(null);
        }}
        onSelectType={handleLessonTypeSelected}
      />

      {/* Video URL Uploader */}
      {lessonCreationMode === 'url' && (
        <VideoUrlUploader
          isOpen={true}
          onComplete={handleVideoUploaded}
          onClose={() => {
            setLessonCreationMode(null);
            setAddLessonToChapterId(null);
          }}
          creatorId={creatorId}
        />
      )}

      {/* Video Library Picker */}
      {lessonCreationMode === 'insert' && (
        <VideoLibraryPicker
          onVideoSelected={handleVideoSelected}
          onClose={() => {
            setLessonCreationMode(null);
            setAddLessonToChapterId(null);
          }}
          onUploadNewVideo={() => setLessonCreationMode('upload')}
        />
      )}

      {/* Video Uploader */}
      {lessonCreationMode === 'upload' && (
        <VideoUploader
          onVideoUploaded={handleVideoUploaded}
          onClose={() => {
            setLessonCreationMode(null);
            setAddLessonToChapterId(null);
          }}
          onBackToLibrary={() => setLessonCreationMode('insert')}
        />
      )}
    </div>
  );
}
