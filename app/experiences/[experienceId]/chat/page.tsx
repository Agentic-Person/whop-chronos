'use client';

/**
 * Student AI Chat Page
 *
 * Full-screen AI chat interface for students.
 * Uses native Whop authentication via the layout.
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MessageSquare, Plus } from 'lucide-react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { VideoContextSelector } from '@/components/chat/VideoContextSelector';
import { ChatExportButton } from '@/components/chat/ChatExportButton';
import { Button, Text } from 'frosted-ui';

export default function StudentChatPage() {
  const params = useParams();
  const experienceId = params.experienceId as string;

  // Context from server
  const [studentContext, setStudentContext] = useState<{
    studentId: string;
    creatorId: string;
    experienceId: string;
  } | null>(null);

  // Chat state
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const [currentSessionTitle, setCurrentSessionTitle] = useState('New Chat');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  // Load context from server-rendered data
  useEffect(() => {
    const contextElement = document.getElementById('student-context');
    if (contextElement) {
      try {
        const context = JSON.parse(contextElement.textContent || '{}');
        setStudentContext(context);
      } catch (e) {
        console.error('Failed to parse student context:', e);
      }
    }
  }, []);

  // Load saved context from session storage
  useEffect(() => {
    const savedVideoId = sessionStorage.getItem('chat_context_video_id');
    const savedCourseId = sessionStorage.getItem('chat_context_course_id');
    if (savedVideoId) {
      setSelectedVideoId(savedVideoId);
      setSelectedCourseId(savedCourseId || null);
    } else if (savedCourseId) {
      setSelectedCourseId(savedCourseId);
    }
  }, []);

  // Fetch session title when session changes
  useEffect(() => {
    if (!currentSessionId) {
      setCurrentSessionTitle('New Chat');
      return;
    }

    const fetchSessionTitle = async () => {
      try {
        const response = await fetch(`/api/chat/sessions/${currentSessionId}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentSessionTitle(data.title || 'Chat Session');
        }
      } catch (error) {
        console.error('Failed to fetch session title:', error);
      }
    };

    fetchSessionTitle();
  }, [currentSessionId]);

  const handleSessionChange = (sessionId: string) => {
    setCurrentSessionId(sessionId || undefined);
  };

  const handleContextChange = (courseId: string | null, videoId: string | null) => {
    setSelectedCourseId(courseId);
    setSelectedVideoId(videoId);
  };

  const handleNewChat = () => {
    setCurrentSessionId(undefined);
    setCurrentSessionTitle('New Chat');
  };

  if (!studentContext) {
    return (
      <div className="flex h-[calc(100vh-12rem)] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-9 mx-auto mb-4"></div>
          <Text className="text-gray-11">Loading chat...</Text>
        </div>
      </div>
    );
  }

  const { studentId, creatorId } = studentContext;

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Chat Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-a4">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-purple-11" />
          <h1 className="text-lg font-semibold text-gray-12">AI Chat</h1>
          {currentSessionTitle !== 'New Chat' && (
            <span className="text-sm text-gray-11">- {currentSessionTitle}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Video context selector */}
          <VideoContextSelector
            studentId={studentId}
            creatorId={creatorId}
            selectedCourseId={selectedCourseId || undefined}
            selectedVideoId={selectedVideoId || undefined}
            onContextChange={handleContextChange}
          />

          {/* Export button */}
          {currentSessionId && (
            <ChatExportButton
              sessionId={currentSessionId}
              sessionTitle={currentSessionTitle}
            />
          )}

          {/* New chat button */}
          <Button onClick={handleNewChat} variant="solid" size="2">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>New Chat</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden mt-4">
        <ChatInterface
          sessionId={currentSessionId}
          onSessionChange={handleSessionChange}
          currentVideoId={selectedVideoId || undefined}
          className="h-full"
          creatorId={creatorId}
          studentId={studentId}
        />
      </div>
    </div>
  );
}
