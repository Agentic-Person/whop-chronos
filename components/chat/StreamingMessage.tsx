"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface StreamingMessageProps {
  content: string;
  speed?: number; // characters per update
  interval?: number; // ms between updates
  className?: string;
}

export function StreamingMessage({
  content,
  speed = 3,
  interval = 30,
  className,
}: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex >= content.length) {
      return;
    }

    const timer = setTimeout(() => {
      const nextIndex = Math.min(currentIndex + speed, content.length);
      setDisplayedContent(content.slice(0, nextIndex));
      setCurrentIndex(nextIndex);
    }, interval);

    return () => clearTimeout(timer);
  }, [content, currentIndex, speed, interval]);

  // Reset when content changes
  useEffect(() => {
    setDisplayedContent("");
    setCurrentIndex(0);
  }, [content]);

  const isComplete = currentIndex >= content.length;

  return (
    <div className={cn("relative", className)}>
      <div className="whitespace-pre-wrap">{displayedContent}</div>
      {/* Typing cursor */}
      {!isComplete && (
        <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-purple-600" />
      )}
    </div>
  );
}
