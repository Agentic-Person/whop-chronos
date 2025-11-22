"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Button, Kbd } from "frosted-ui";
import { Send, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  showAttachments?: boolean;
  className?: string;
}

export function MessageInput({
  onSend,
  disabled = false,
  placeholder = "Type your message...",
  maxLength = 2000,
  showAttachments = false,
  className,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttachment = () => {
    // Placeholder for file attachment functionality
    console.log("Attachment clicked");
  };

  const remainingChars = maxLength - message.length;
  const isNearLimit = remainingChars < 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative flex items-end gap-2">
        {/* Textarea */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            rows={1}
            className={cn(
              "w-full resize-none rounded-lg border border-gray-a4 bg-gray-1 px-4 py-3 pr-12 text-sm text-gray-12 placeholder:text-gray-11",
              "focus:border-purple-9 focus:outline-none focus:ring-2 focus:ring-purple-9/20",
              "disabled:cursor-not-allowed disabled:bg-gray-a2 disabled:text-gray-11",
              "transition-colors"
            )}
            style={{ minHeight: "44px", maxHeight: "200px" }}
          />

          {/* Attachment button */}
          {showAttachments && (
            <button
              type="button"
              onClick={handleAttachment}
              disabled={disabled}
              className={cn(
                "absolute bottom-3 right-3 rounded-lg p-1.5 text-gray-500 transition-colors",
                "hover:bg-gray-a3 hover:text-gray-700",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          variant="primary"
          size="md"
          className="h-11 px-4"
        >
          <span className="flex items-center gap-2">
            Send
            <Send className="h-4 w-4" />
          </span>
        </Button>
      </div>

      {/* Character count and shortcuts */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex gap-4">
          <span>
            <Kbd>Enter</Kbd>{" "}
            to send
          </span>
          <span>
            <Kbd>Shift</Kbd>
            +
            <Kbd>Enter</Kbd>{" "}
            for new line
          </span>
        </div>

        {/* Character counter (only show when near limit) */}
        {isNearLimit && (
          <span
            className={cn(
              "font-medium",
              remainingChars < 0
                ? "text-red-600"
                : remainingChars < 50
                  ? "text-orange-600"
                  : "text-gray-600"
            )}
          >
            {remainingChars} characters remaining
          </span>
        )}
      </div>
    </div>
  );
}
