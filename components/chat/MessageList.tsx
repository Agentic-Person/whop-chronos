"use client";

import { type Message } from "./ChatInterface";
import { VideoReferenceCard } from "./VideoReferenceCard";
import { StreamingMessage } from "./StreamingMessage";
import { Button, Card } from "frosted-ui";
import { Copy, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface MessageListProps {
  messages: Message[];
  currentVideoId?: string;
  onTimestampClick?: (seconds: number, videoId: string) => void;
  onRegenerate?: (messageId: string) => void;
}

export function MessageList({
  messages,
  currentVideoId,
  onTimestampClick,
  onRegenerate
}: MessageListProps) {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatMarkdown = (text: string) => {
    // Simple markdown rendering - you can replace with a proper markdown library if needed
    let formatted = text;

    // Code blocks
    formatted = formatted.replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      '<pre class="bg-gray-900 text-gray-100 rounded-lg p-4 my-2 overflow-x-auto"><code class="text-sm">$2</code></pre>'
    );

    // Inline code
    formatted = formatted.replace(
      /`([^`]+)`/g,
      '<code class="bg-gray-a3 text-purple-600 px-1.5 py-0.5 rounded text-sm">$1</code>'
    );

    // Bold
    formatted = formatted.replace(
      /\*\*([^*]+)\*\*/g,
      '<strong class="font-semibold">$1</strong>'
    );

    // Italic
    formatted = formatted.replace(
      /\*([^*]+)\*/g,
      '<em class="italic">$1</em>'
    );

    // Links
    formatted = formatted.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-purple-600 hover:text-purple-700 underline" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Line breaks
    formatted = formatted.replace(/\n/g, "<br />");

    return formatted;
  };

  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex gap-3",
            message.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          <div
            className={cn(
              "flex max-w-[85%] flex-col gap-2",
              message.role === "user" ? "items-end" : "items-start"
            )}
          >
            {/* Message bubble */}
            <div
              className={cn(
                "group relative rounded-2xl px-4 py-3 shadow-sm",
                message.role === "user"
                  ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white"
                  : "bg-gray-a2 border border-gray-a4 text-gray-900"
              )}
            >
              {/* Message content */}
              {message.isStreaming ? (
                <StreamingMessage content={message.content} />
              ) : (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: formatMarkdown(message.content),
                  }}
                />
              )}

              {/* Action buttons (visible on hover) */}
              {message.role === "assistant" && !message.isStreaming && (
                <div className="absolute -right-2 -top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 w-8 rounded-full p-0 shadow-md"
                    onClick={() => copyToClipboard(message.content)}
                    title="Copy message"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  {onRegenerate && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 rounded-full p-0 shadow-md"
                      onClick={() => onRegenerate(message.id)}
                      title="Regenerate response"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Timestamp */}
            <span
              className={cn(
                "text-xs text-gray-500",
                message.role === "user" ? "text-right" : "text-left"
              )}
            >
              {formatDistanceToNow(message.timestamp, { addSuffix: true })}
            </span>

            {/* Video references */}
            {message.videoReferences && message.videoReferences.length > 0 && (
              <div className="mt-2 space-y-2">
                <p className="text-xs font-medium text-gray-700">
                  Referenced in videos:
                </p>
                <div className="flex flex-col gap-2">
                  {message.videoReferences.map((ref, index) => (
                    <VideoReferenceCard
                      key={index}
                      reference={ref}
                      onTimestampClick={onTimestampClick}
                      isCurrentVideo={currentVideoId === ref.videoId}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
