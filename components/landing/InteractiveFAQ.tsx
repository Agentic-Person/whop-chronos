'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const demoMessages: Message[] = [
  {
    role: 'user',
    content: 'How long does it take to set up a Whop account?',
  },
  {
    role: 'assistant',
    content: 'Setting up your Whop account takes less than 5 minutes from start to finish. The platform has streamlined onboarding that enables you to get your first product live in just 4 minutes. The process is quick and intuitive, designed specifically for creators who want to start monetizing their content right away.',
  },
  {
    role: 'user',
    content: 'What makes Whop different from other platforms?',
  },
  {
    role: 'assistant',
    content: 'Whop consolidates courses, communities, products, and payments in one unified system. The platform has over 2 million weekly marketplace visitors and offers flexible, modular usage options. Unlike traditional course platforms, Whop is built specifically for modern creators with features like built-in community tools, flexible payment options, and seamless integration with tools like ChronosAI.',
  },
];

export function InteractiveFAQ() {
  const [messages] = useState<Message[]>(demoMessages);

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
            Experience how Chronos answers student questions instantly with AI-powered responses backed by your video content.
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
                <p className="text-purple-2 text-sm">Always ready to help your students</p>
              </div>
            </div>

            {/* Messages */}
            <div className="p-6 space-y-6 min-h-[400px] max-h-[600px] overflow-y-auto bg-gray-1">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.2 }}
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
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-6 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-11" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Input (Demo Mode - Disabled) */}
            <div className="border-t border-gray-6 p-4 bg-gray-2">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="This is a demo. Sign in to try the real assistant..."
                  disabled
                  className="flex-1 bg-gray-3 border border-gray-6 rounded-xl px-4 py-3 text-gray-11 text-sm placeholder:text-gray-9 cursor-not-allowed"
                />
                <button
                  disabled
                  type="button"
                  className="bg-gray-6 text-gray-9 rounded-xl px-6 py-3 font-medium cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-10 mt-2 text-center">
                Sign in with Whop to experience the full AI assistant
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
