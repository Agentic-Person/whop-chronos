"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Plus } from "lucide-react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { VideoContextSelector } from "@/components/chat/VideoContextSelector";
import { ChatExportButton } from "@/components/chat/ChatExportButton";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button, Card, Text } from "frosted-ui";

/**
 * StudentChatPage
 *
 * Standalone AI chat interface for students
 * Features:
 * - Full-page ChatInterface component
 * - Video context selector
 * - Session management
 * - Export functionality
 * - Responsive layout
 */
export default function StudentChatPage() {
  const router = useRouter();
  const { userId: studentId, creatorId, isAuthenticated } = useAuth();

  // State
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const [currentSessionTitle, setCurrentSessionTitle] = useState("New Chat");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Load saved context from session storage
  useEffect(() => {
    const savedVideoId = sessionStorage.getItem("chat_context_video_id");
    const savedCourseId = sessionStorage.getItem("chat_context_course_id");
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
      setCurrentSessionTitle("New Chat");
      return;
    }

    const fetchSessionTitle = async () => {
      try {
        const response = await fetch(`/api/chat/sessions/${currentSessionId}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentSessionTitle(data.title || "Chat Session");
        }
      } catch (error) {
        console.error("Failed to fetch session title:", error);
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
    setCurrentSessionTitle("New Chat");
  };

  if (!isAuthenticated || !studentId || !creatorId) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-1">
        <div className="text-center">
          <Text className="text-gray-11">Loading...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-1">
      {/* Header */}
      <div className="border-b border-gray-a4 shadow-sm bg-[#1a1a1a] p-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Left: Title */}
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-purple-600" />
            <h1 className="text-lg font-semibold text-gray-12">AI Chat</h1>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-3">
            {/* Video context selector */}
            {studentId && creatorId && (
              <VideoContextSelector
                studentId={studentId}
                creatorId={creatorId}
                selectedCourseId={selectedCourseId || undefined}
                selectedVideoId={selectedVideoId || undefined}
                onContextChange={handleContextChange}
              />
            )}

            {/* Export button (only show if there's an active session) */}
            {currentSessionId && (
              <ChatExportButton
                sessionId={currentSessionId}
                sessionTitle={currentSessionTitle}
              />
            )}

            {/* New chat button */}
            <Button
              onClick={handleNewChat}
              variant="solid"
              size="2"
            >
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>New Chat</span>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto h-full max-w-7xl">
          <ChatInterface
            sessionId={currentSessionId}
            onSessionChange={handleSessionChange}
            currentVideoId={selectedVideoId || undefined}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
