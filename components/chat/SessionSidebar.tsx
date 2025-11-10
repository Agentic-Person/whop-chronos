"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Plus, Search, MessageSquare, Trash2, Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ChatSession {
  id: string;
  title: string;
  preview: string;
  lastMessageAt: Date;
  messageCount: number;
}

interface SessionSidebarProps {
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  className?: string;
}

export function SessionSidebar({
  currentSessionId,
  onSessionSelect,
  onNewChat,
  className,
}: SessionSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch chat sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch("/api/chat/sessions");
        if (response.ok) {
          const data = await response.json();
          setSessions(data.sessions || []);
        }
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this conversation?")) {
      return;
    }

    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSessions(sessions.filter((s) => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          onNewChat();
        }
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const handleRename = async (sessionId: string) => {
    if (!editingTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editingTitle }),
      });

      if (response.ok) {
        setSessions(
          sessions.map((s) =>
            s.id === sessionId ? { ...s, title: editingTitle } : s
          )
        );
        setEditingId(null);
      }
    } catch (error) {
      console.error("Failed to rename session:", error);
    }
  };

  const startEditing = (session: ChatSession) => {
    setEditingId(session.id);
    setEditingTitle(session.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const filteredSessions = sessions.filter(
    (session) =>
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r border-gray-200 bg-white",
        className
      )}
    >
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <Button
          variant="primary"
          className="w-full"
          icon={<Plus className="h-4 w-4" />}
          onClick={onNewChat}
        >
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="border-b border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="text-sm text-gray-500">Loading chats...</div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex h-32 items-center justify-center px-4 text-center">
            <div className="text-sm text-gray-500">
              {searchQuery
                ? "No conversations found"
                : "No conversations yet"}
            </div>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group relative rounded-lg transition-colors",
                  currentSessionId === session.id
                    ? "bg-purple-50 shadow-sm"
                    : "hover:bg-gray-50"
                )}
              >
                {editingId === session.id ? (
                  /* Editing mode */
                  <div className="flex items-center gap-2 p-3">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(session.id);
                        if (e.key === "Escape") cancelEditing();
                      }}
                      className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRename(session.id)}
                      className="rounded p-1 text-green-600 hover:bg-green-50"
                      title="Save"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="rounded p-1 text-gray-600 hover:bg-gray-100"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  /* Normal mode */
                  <button
                    onClick={() => onSessionSelect(session.id)}
                    className="w-full p-3 text-left"
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <MessageSquare className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        <h4 className="line-clamp-1 text-sm font-medium text-gray-900">
                          {session.title}
                        </h4>
                      </div>

                      {/* Action buttons (visible on hover) */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(session);
                          }}
                          className="rounded p-1 text-gray-600 hover:bg-gray-200"
                          title="Rename"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(session.id);
                          }}
                          className="rounded p-1 text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="mb-1 line-clamp-2 text-xs text-gray-600">
                      {session.preview}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {session.messageCount}{" "}
                        {session.messageCount === 1 ? "message" : "messages"}
                      </span>
                      <span>
                        {formatDistanceToNow(session.lastMessageAt, {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
