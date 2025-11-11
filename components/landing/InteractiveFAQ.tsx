'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Loader2, PlayCircle } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamps?: string[];
}

const initialMessages: Message[] = [
  {
    role: 'assistant',
    content:
      "Hi! I'm ChronosAI. I've watched the full \"How To Make $100,000 Per Month With Whop\" video and can answer any questions about it. Try asking me something!",
  },
];

export function InteractiveFAQ() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/landing/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamps: data.timestamps || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');

      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Something went wrong'}. Please try again.`,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimestampClick = (timestamp: string) => {
    // Scroll to video section
    const videoSection = document.getElementById('demo');
    if (videoSection) {
      videoSection.scrollIntoView({ behavior: 'smooth' });

      // Parse timestamp and seek video
      setTimeout(() => {
        const iframe = document.querySelector('iframe');
        if (iframe?.src) {
          const seconds = parseTimestampToSeconds(timestamp);
          const baseUrl = iframe.src.split('?')[0];
          iframe.src = `${baseUrl}?start=${seconds}&autoplay=1`;
        }
      }, 500);
    }
  };

  const parseTimestampToSeconds = (timestamp: string): number => {
    const parts = timestamp.split(':').map((p) => parseInt(p, 10));
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return parts[0] || 0;
  };

  const renderMessageContent = (message: Message) => {
    if (!message.timestamps || message.timestamps.length === 0) {
      return <p className="text-sm leading-relaxed">{message.content}</p>;
    }

    // Replace timestamps in brackets with clickable links
    let content = message.content;
    const timestampRegex = /\[(\d+:\d+(?::\d+)?)\]/g;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = timestampRegex.exec(message.content)) !== null) {
      // Add text before timestamp
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>{content.slice(lastIndex, match.index)}</span>
        );
      }

      // Add clickable timestamp
      const timestamp = match[1];
      parts.push(
        <button
          key={`timestamp-${match.index}`}
          onClick={() => handleTimestampClick(timestamp)}
          type="button"
          className="inline-flex items-center gap-1 text-purple-11 hover:text-purple-10 font-medium underline decoration-dotted transition-colors"
        >
          <PlayCircle className="w-3 h-3" />
          {timestamp}
        </button>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(<span key={`text-${lastIndex}`}>{content.slice(lastIndex)}</span>);
    }

    return <div className="text-sm leading-relaxed">{parts}</div>;
  };

  return (
    <section className="py-24 md:py-32 bg-gray-1">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-12 mb-4">
            Ask ChronosAI Anything
          </h2>
          <p className="text-lg md:text-xl text-gray-11 max-w-3xl mx-auto">
            Try the live demo! Ask questions about the video above and get instant AI-powered
            answers with clickable timestamps.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gray-2 border border-gray-6 rounded-2xl shadow-2xl overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-purple-9 to-blue-9 px-6 py-4 flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image
                  src="/images/chronos_icon.png"
                  alt="Chronos AI"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">ChronosAI Assistant</h3>
                <p className="text-purple-2 text-sm">Live demo - fully functional!</p>
              </div>
            </div>

            {/* Messages */}
            <div className="p-6 space-y-6 min-h-[400px] max-h-[600px] overflow-y-auto bg-gray-1">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-9 to-blue-9 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}

                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-5 py-4 shadow-lg',
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-purple-9 to-blue-9 text-white'
                        : 'bg-gray-3 border border-gray-6 text-gray-12'
                    )}
                  >
                    {renderMessageContent(message)}
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-6 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-11" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-9 to-blue-9 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="max-w-[75%] rounded-2xl px-5 py-4 shadow-lg bg-gray-3 border border-gray-6">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-11" />
                      <span className="text-sm text-gray-11">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input (Functional) */}
            <div className="border-t border-gray-6 p-4 bg-gray-2">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about the video... (e.g., 'How do I start on Whop?')"
                  disabled={isLoading}
                  className="flex-1 bg-gray-3 border border-gray-6 rounded-xl px-4 py-3 text-gray-12 text-sm placeholder:text-gray-9 focus:outline-none focus:ring-2 focus:ring-purple-9 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-to-r from-purple-9 to-blue-9 text-white rounded-xl px-6 py-3 font-medium hover:from-purple-10 hover:to-blue-10 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-purple-9 disabled:hover:to-blue-9"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
              {error && (
                <p className="text-xs text-red-11 mt-2 text-center">Error: {error}</p>
              )}
              <p className="text-xs text-gray-10 mt-2 text-center">
                Live demo powered by Claude AI • Try asking specific questions!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
