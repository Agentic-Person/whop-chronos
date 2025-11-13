'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Select,
  Tooltip,
  DropdownMenu,
  AlertDialog,
  ScrollArea,
} from '@whop/react/components';
import {
  MessageSquare,
  Search,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Archive,
  Download,
  Send,
  Video,
  Clock,
  DollarSign,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { calculateCompleteCost } from '@/lib/rag/cost-calculator';

// Real data types
interface VideoReference {
  video_id: string;
  video_title: string;
  timestamp: number;
  thumbnail_url?: string;
  snippet?: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  video_references?: VideoReference[];
  token_count?: number;
  model?: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  title: string | null;
  student_id: string;
  creator_id: string;
  last_message_at: string | null;
  message_count: number;
  preview?: string | null;
  created_at: string;
}

// API functions
async function fetchSessions(creatorId: string, searchQuery?: string, sortBy?: string) {
  const params = new URLSearchParams({
    creator_id: creatorId,
    ...(searchQuery && { search: searchQuery }),
    ...(sortBy && { sort_by: sortBy }),
  });

  const response = await fetch(`/api/chat/sessions?${params}`);
  if (!response.ok) throw new Error('Failed to fetch sessions');
  return response.json();
}

async function fetchMessages(sessionId: string) {
  const response = await fetch(`/api/chat/sessions/${sessionId}/messages`);
  if (!response.ok) throw new Error('Failed to fetch messages');
  return response.json();
}

async function sendMessage(sessionId: string, content: string) {
  return fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: content,
      sessionId,
      stream: true,
    }),
  });
}

async function deleteSessionAPI(sessionId: string) {
  const response = await fetch(`/api/chat/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete session');
  return response.json();
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function VideoReferenceBadge({ reference }: { reference: VideoReference }) {
  const [_showPreview, setShowPreview] = useState(false);

  return (
    <Tooltip
      content={
        <div className="max-w-xs">
          <p className="font-medium text-xs mb-1">{reference.video_title}</p>
          {reference.snippet && (
            <p className="text-xs text-gray-11">{reference.snippet}</p>
          )}
        </div>
      }
    >
      <button
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-blue-a3 hover:bg-blue-a4 text-blue-11 hover:text-blue-12 transition-colors text-xs font-medium border border-blue-a6"
        onClick={() => {
          console.log('Navigate to video:', reference.video_id, 'at', reference.timestamp);
        }}
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
      >
        <Video className="w-3 h-3" />
        <span>{reference.video_title}</span>
        <span className="text-blue-10">@ {formatTimestamp(reference.timestamp)}</span>
      </button>
    </Tooltip>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  // Calculate cost if token_count is available
  const cost = message.token_count && message.model
    ? calculateCompleteCost({
        model: message.model,
        input_tokens: Math.floor(message.token_count * 0.3), // Estimate 30% input
        output_tokens: Math.floor(message.token_count * 0.7), // Estimate 70% output
        embedding_queries: 1,
      }).total_cost
    : null;

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <div className="px-3 py-1.5 bg-gray-a3 rounded-full text-xs text-gray-11">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <Avatar
        size="2"
        fallback={isUser ? 'S' : 'AI'}
        className={cn(isUser ? 'bg-gray-a3' : 'bg-blue-a3')}
      />
      <div className={cn('flex flex-col gap-1.5 max-w-[70%]', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'px-4 py-3 rounded-lg',
            isUser
              ? 'bg-gray-a3 text-gray-12'
              : 'bg-blue-a3 text-gray-12 border border-blue-a6'
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Video references */}
        {message.video_references && message.video_references.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.video_references.map((ref, idx) => (
              <VideoReferenceBadge key={idx} reference={ref} />
            ))}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-2 text-xs text-gray-10">
          <Clock className="w-3 h-3" />
          <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
          {cost && (
            <Tooltip content={`Tokens: ${message.token_count || 0} | Model: ${message.model || 'N/A'}`}>
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                ${cost.toFixed(4)}
              </span>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionListItem({
  session,
  isActive,
  onClick,
  onDelete,
}: {
  session: ChatSession;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteSessionAPI(session.id);
      setShowDeleteDialog(false);
      onDelete();
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session. Please try again.');
    }
  };

  return (
    <>
      <Card
        className={cn(
          'p-3 cursor-pointer transition-all hover:bg-gray-a3',
          isActive && 'bg-gray-a4 border-blue-a6'
        )}
        onClick={onClick}
      >
        <div className="flex items-start gap-3">
          <Avatar
            size="2"
            fallback="S"
            className="bg-gray-a3"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="text-sm font-medium text-gray-12 truncate">
                {session.title || 'New Chat'}
              </h4>
              <div className="flex items-center gap-1 shrink-0">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger>
                    <Button
                      variant="ghost"
                      size="1"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content>
                    <DropdownMenu.Item>
                      <Edit2 className="w-4 h-4" />
                      Rename
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>
                      <Archive className="w-4 h-4" />
                      Archive
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>
                      <Download className="w-4 h-4" />
                      Export
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                      color="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>
            </div>
            <p className="text-xs text-gray-10 truncate mb-2">{session.preview || 'No messages yet'}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-10">
                {session.last_message_at
                  ? formatDistanceToNow(new Date(session.last_message_at), { addSuffix: true })
                  : 'Just created'}
              </span>
              <span className="text-xs text-gray-9">•</span>
              <span className="text-xs text-gray-10">{session.message_count} messages</span>
            </div>
          </div>
        </div>
      </Card>

      <AlertDialog.Root open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialog.Content>
          <AlertDialog.Title>Delete Session</AlertDialog.Title>
          <AlertDialog.Description>
            Are you sure you want to delete this chat session? This action cannot be undone.
          </AlertDialog.Description>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialog.Cancel>
              <Button variant="soft">Cancel</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button variant="solid" color="red" onClick={handleDelete}>
                Delete
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </>
  );
}

function EmptyState({ type }: { type: 'sessions' | 'messages' }) {
  if (type === 'sessions') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-a3 flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-gray-11" />
        </div>
        <h3 className="text-4 font-semibold text-gray-12 mb-2">No chat sessions yet</h3>
        <p className="text-3 text-gray-11 mb-4 max-w-sm">
          When students start asking questions, their conversations will appear here.
        </p>
        <Button variant="solid">
          <Plus className="w-4 h-4" />
          Start First Conversation
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-16 h-16 rounded-full bg-gray-a3 flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-gray-11" />
      </div>
      <h3 className="text-4 font-semibold text-gray-12 mb-2">Select a session</h3>
      <p className="text-3 text-gray-11 max-w-sm">
        Choose a chat session from the list to view the conversation history.
      </p>
    </div>
  );
}

function LoadingSkeleton({ type }: { type: 'sessions' | 'messages' }) {
  if (type === 'sessions') {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="p-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-a3 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-a3 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-gray-a3 rounded animate-pulse" />
                <div className="h-3 w-full bg-gray-a3 rounded animate-pulse" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className={cn('flex gap-3', i % 2 === 0 ? 'flex-row-reverse' : '')}>
          <div className="w-8 h-8 rounded-full bg-gray-a3 animate-pulse" />
          <div className="space-y-2 max-w-[70%]">
            <div className="h-20 w-full rounded-lg bg-gray-a3 animate-pulse" />
            <div className="h-3 w-32 bg-gray-a3 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ChatPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'last_message_at' | 'message_count'>('last_message_at');
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [newMessage, setNewMessage] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Hardcoded creator ID for now - in production, get from auth
  const CREATOR_ID = '00000000-0000-0000-0000-000000000001';

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [searchQuery, sortBy]);

  // Load messages when session selected
  useEffect(() => {
    if (selectedSessionId) {
      loadMessages(selectedSessionId);
    }
  }, [selectedSessionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  async function loadSessions() {
    try {
      setIsLoadingSessions(true);
      setError(null);
      const data = await fetchSessions(CREATOR_ID, searchQuery, sortBy);
      setSessions(data.data || []);
    } catch (err) {
      setError('Failed to load chat sessions');
      console.error(err);
    } finally {
      setIsLoadingSessions(false);
    }
  }

  async function loadMessages(sessionId: string) {
    try {
      setIsLoadingMessages(true);
      setError(null);
      const data = await fetchMessages(sessionId);
      setMessages(data.messages || []);
    } catch (err) {
      setError('Failed to load messages');
      console.error(err);
    } finally {
      setIsLoadingMessages(false);
    }
  }

  async function handleSendMessage() {
    if (!newMessage.trim() || !selectedSessionId || isSending) return;

    const userMessage = newMessage;
    setNewMessage('');
    setIsSending(true);
    setStreamingContent('');

    // Optimistically add user message
    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: selectedSessionId,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      const response = await sendMessage(selectedSessionId, userMessage);

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');

        // Keep the last incomplete message in buffer
        buffer = lines.pop() || '';

        for (const message of lines) {
          const eventLines = message.split('\n');
          let eventType = 'message';
          let eventData = '';

          for (const line of eventLines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7);
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6);
            }
          }

          if (!eventData) continue;

          try {
            const data = JSON.parse(eventData);

            if (eventType === 'content' && data.content) {
              fullContent += data.content;
              setStreamingContent(fullContent);
            }

            if (eventType === 'done') {
              // Streaming complete - refresh messages from server
              await loadMessages(selectedSessionId);
              setStreamingContent('');
            }

            if (eventType === 'error') {
              throw new Error(data.error || 'Stream error');
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
      // Remove optimistic user message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setIsSending(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  }

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-7 font-bold text-gray-12">AI Chat Sessions</h1>
        <p className="text-3 text-gray-11 mt-1">
          View and manage student chat history and AI interactions
        </p>
        {error && (
          <div className="mt-2 px-3 py-2 bg-red-a3 border border-red-a6 rounded-md text-sm text-red-11">
            {error}
          </div>
        )}
      </div>

      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* Session List - Left Sidebar */}
        <aside
          className={cn(
            'w-full md:w-96 flex flex-col gap-4',
            mobileView === 'chat' && 'hidden md:flex'
          )}
        >
          {/* Search and filters */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-9 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-a2 border border-gray-a6 rounded-md text-sm text-gray-12 placeholder:text-gray-10 focus:outline-none focus:ring-2 focus:ring-blue-8 focus:border-blue-8 transition-colors"
                />
              </div>
              <Button variant="solid" size="2">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Select.Root
                value={sortBy}
                onValueChange={(value: string) => setSortBy(value as 'last_message_at' | 'message_count')}
              >
                <Select.Trigger className="flex-1" />
                <Select.Content>
                  <Select.Item value="last_message_at">Most Recent</Select.Item>
                  <Select.Item value="message_count">Most Active</Select.Item>
                </Select.Content>
              </Select.Root>
            </div>
          </Card>

          {/* Session list */}
          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-2">
              {isLoadingSessions ? (
                <LoadingSkeleton type="sessions" />
              ) : sessions.length === 0 ? (
                searchQuery ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-11">No sessions match your search</p>
                  </div>
                ) : (
                  <EmptyState type="sessions" />
                )
              ) : (
                sessions.map((session) => (
                  <SessionListItem
                    key={session.id}
                    session={session}
                    isActive={session.id === selectedSessionId}
                    onClick={() => {
                      setSelectedSessionId(session.id);
                      setMobileView('chat');
                    }}
                    onDelete={() => loadSessions()}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* Message Viewer - Main Content */}
        <main
          className={cn(
            'flex-1 flex flex-col',
            mobileView === 'list' && 'hidden md:flex'
          )}
        >
          <Card className="flex-1 flex flex-col">
            {selectedSession ? (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-gray-a4 flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="2"
                    className="md:hidden"
                    onClick={() => setMobileView('list')}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Avatar
                    size="2"
                    fallback="S"
                    className="bg-gray-a3"
                  />
                  <div className="flex-1">
                    <h3 className="text-4 font-semibold text-gray-12">
                      {selectedSession.title || 'New Chat'}
                    </h3>
                    <p className="text-2 text-gray-11">Chat Session</p>
                  </div>
                  <Badge variant="soft" color="gray">
                    {selectedSession.message_count} messages
                  </Badge>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {isLoadingMessages ? (
                    <LoadingSkeleton type="messages" />
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                      ))}

                      {/* Streaming message */}
                      {streamingContent && (
                        <div className="flex gap-3">
                          <Avatar
                            size="2"
                            fallback="AI"
                            className="bg-blue-a3"
                          />
                          <div className="flex flex-col gap-1.5 max-w-[70%]">
                            <div className="px-4 py-3 rounded-lg bg-blue-a3 text-gray-12 border border-blue-a6">
                              <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
                              <Loader2 className="w-3 h-3 animate-spin mt-2 text-blue-11" />
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Chat input */}
                <div className="p-4 border-t border-gray-a4">
                  <div className="flex items-end gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={isSending}
                      className="flex-1 px-3 py-2 bg-gray-a2 border border-gray-a6 rounded-md text-sm text-gray-12 placeholder:text-gray-10 focus:outline-none focus:ring-2 focus:ring-blue-8 focus:border-blue-8 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <Button
                      variant="solid"
                      size="2"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState type="messages" />
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}
