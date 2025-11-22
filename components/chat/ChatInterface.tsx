"use client";

import { useState, useRef, useEffect } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { SessionSidebar } from "./SessionSidebar";
import { Card, Button, Spinner } from "frosted-ui";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  videoReferences?: VideoReference[];
  isStreaming?: boolean;
}

export interface VideoReference {
  videoId: string;
  videoTitle: string;
  thumbnailUrl: string;
  timestamp: number; // in seconds
  excerpt: string;
  relevanceScore?: number;
}

export interface ChatInterfaceProps {
  sessionId?: string;
  onSessionChange?: (sessionId: string) => void;
  className?: string;
  currentVideoId?: string;
  onTimestampClick?: (seconds: number, videoId: string) => void;
  creatorId: string;
  studentId: string;
}

export function ChatInterface({
  sessionId,
  onSessionChange,
  className,
  currentVideoId,
  onTimestampClick,
  creatorId,
  studentId,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message (only when messages exist)
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: content,
          creatorId,
          studentId,
          stream: false, // Use non-streaming mode for simpler JSON response handling
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: data.id || `assistant-${Date.now()}`,
        role: "assistant",
        content: data.content,
        timestamp: new Date(data.timestamp),
        videoReferences: data.videoReferences,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send message"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    // Retry last user message
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((m) => m.role === "user");
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.content);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setError(null);
    onSessionChange?.("");
  };

  return (
    <div className={cn("flex h-full w-full", className)}>
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-gray-1 border border-gray-a4 p-2 shadow-md lg:hidden hover:bg-gray-a2"
        aria-label="Toggle sidebar"
      >
        {isSidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-gray-1 shadow-lg transition-transform lg:relative lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SessionSidebar
          currentSessionId={sessionId}
          onSessionSelect={(id) => {
            onSessionChange?.(id);
            setIsSidebarOpen(false);
          }}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        <Card className="flex h-full flex-col" padding="none">
          {/* Chat header */}
          <div className="border-b border-gray-a4 p-4">
            <h2 className="text-lg font-semibold text-gray-900">
              AI Learning Assistant
            </h2>
            <p className="text-sm text-gray-600">
              Ask questions about your course videos
            </p>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    Start a conversation
                  </h3>
                  <p className="text-sm text-gray-600">
                    Ask me anything about your course content
                  </p>
                </div>
              </div>
            ) : (
              <MessageList
                messages={messages}
                currentVideoId={currentVideoId}
                onTimestampClick={onTimestampClick}
              />
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <Spinner size="sm" />
                <span>AI is typing...</span>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900">
                      Something went wrong
                    </h4>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className="border-t border-gray-a4 p-4">
            <MessageInput
              onSend={handleSendMessage}
              disabled={isLoading}
              placeholder="Ask a question about your course..."
            />
          </div>
        </Card>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
