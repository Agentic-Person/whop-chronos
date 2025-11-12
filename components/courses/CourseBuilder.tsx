'use client';

import { useState } from 'react';
import { ArrowLeft, Plus, GripVertical, MoreVertical, Trash2 } from 'lucide-react';
import AddLessonDialog from './AddLessonDialog';
import VideoLibraryPicker from './VideoLibraryPicker';
import VideoUploader from './VideoUploader';
import VideoUrlUploader from './VideoUrlUploader';

interface Chapter {
  id: string;
  name: string;
  lessons: Lesson[];
  isExpanded: boolean;
}

interface Lesson {
  id: string;
  type: 'video' | 'quiz';
  title: string;
  videoId?: string;
  thumbnail?: string;
  duration?: number;
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
  const [chapters, setChapters] = useState<Chapter[]>([
    { id: '1', name: 'Chapter 1', lessons: [], isExpanded: true },
  ]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>('1');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [showAddLessonDialog, setShowAddLessonDialog] = useState(false);
  const [addLessonToChapterId, setAddLessonToChapterId] = useState<string | null>(null);
  const [lessonCreationMode, setLessonCreationMode] = useState<'url' | 'insert' | 'upload' | null>(null);

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId);
  const selectedLesson = selectedChapter?.lessons.find((l) => l.id === selectedLessonId);

  const addChapter = () => {
    const newChapterId = (chapters.length + 1).toString();
    setChapters([
      ...chapters,
      {
        id: newChapterId,
        name: `Chapter ${newChapterId}`,
        lessons: [],
        isExpanded: true,
      },
    ]);
  };

  const deleteChapter = (chapterId: string) => {
    if (chapters.length === 1) {
      alert('Cannot delete the last chapter');
      return;
    }
    if (confirm('Are you sure you want to delete this chapter?')) {
      setChapters(chapters.filter((c) => c.id !== chapterId));
      if (selectedChapterId === chapterId) {
        setSelectedChapterId(chapters[0].id);
      }
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

  const handleVideoSelected = (video: any) => {
    if (!addLessonToChapterId) return;

    const newLesson: Lesson = {
      id: Date.now().toString(),
      type: 'video',
      title: video.title,
      videoId: video.id,
      thumbnail: video.thumbnail,
      duration: video.duration,
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
  };

  const handleVideoUploaded = (video: any) => {
    if (!addLessonToChapterId) return;

    const newLesson: Lesson = {
      id: Date.now().toString(),
      type: 'video',
      title: video.title,
      videoId: video.id,
      thumbnail: video.thumbnail,
      duration: video.duration,
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
  };

  const deleteLesson = (chapterId: string, lessonId: string) => {
    if (confirm('Are you sure you want to delete this lesson?')) {
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
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-1">
      {/* Header */}
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
          creatorId="e5f9d8c7-4b3a-4e2d-9f1a-8c7b6a5d4e3f"
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
