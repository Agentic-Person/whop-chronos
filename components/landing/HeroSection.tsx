'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Image from 'next/image';
import { Send } from 'lucide-react';
import extractedChapters from '@/data/landing-page/chapters.json';

interface Chapter {
  title: string;
  start: string;
  end: string;
  startSeconds: number;
  summary: string;
}

interface DemoMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function HeroSection() {
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [demoMessages, setDemoMessages] = useState<DemoMessage[]>([]);
  const chapters = extractedChapters as Chapter[];

  const handleChapterClick = (startSeconds: number, index: number) => {
    setSelectedChapter(index);
    const iframe = document.querySelector('.hero-video-iframe') as HTMLIFrameElement;
    if (iframe?.src) {
      const baseUrl = iframe.src.split('?')[0];
      iframe.src = `${baseUrl}?start=${startSeconds}&autoplay=1&rel=0`;
    }
  };

  const handleTimestampClick = (timestamp: string) => {
    const parts = timestamp.split(':').map(Number);
    const seconds = parts.length === 2 ? parts[0]! * 60 + parts[1]! : parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;

    const iframe = document.querySelector('.hero-video-iframe') as HTMLIFrameElement;
    if (iframe?.src) {
      const baseUrl = iframe.src.split('?')[0];
      iframe.src = `${baseUrl}?start=${seconds}&autoplay=1&rel=0`;
    }
  };

  const getDemoResponse = (question: string): string => {
    const q = question.toLowerCase();

    // Step-related questions
    if (q.includes('second') || q.includes('2nd') || (q.includes('next') && q.includes('step')) || q.includes('after account') || q.includes('after creating')) {
      return 'After creating your account, the next step is setting up your WAP store. This involves naming your product, understanding the platform structure, and configuring your store page with key elements like headline, description, and creator details. This process is covered starting at [3:20].';
    }

    // Store/setup questions
    if (q.includes('store') || q.includes('setup') || q.includes('configure') || q.includes('set up')) {
      return 'Setting up your WAP store involves naming your product, configuring your store page with a compelling headline and description, and adding your creator details. The complete store setup walkthrough starts at [3:20] and runs through [9:01].';
    }

    // App/feature questions
    if (q.includes('app') || q.includes('feature') || q.includes('tool') || q.includes('what can') || q.includes('capabilities')) {
      return 'WAP offers several powerful apps to enhance your product: Announcements, Chat, Courses, One-on-One Coaching, Bounties, and Content Rewards. These help you engage your community and deliver value to your members. Learn more about these apps at [9:01].';
    }

    // Marketplace/visibility questions
    if (q.includes('marketplace') || q.includes('sell') || q.includes('visibility') || q.includes('traffic') || q.includes('customer')) {
      return 'To maximize visibility on WAP\'s marketplace, activate affiliate marketing, create a content funnel, and optimize your product listing. The marketplace strategies are explained in detail starting at [16:15].';
    }

    // Money/revenue questions
    if (q.includes('money') || q.includes('revenue') || q.includes('earn') || q.includes('income') || q.includes('$100') || q.includes('profit')) {
      return 'The video covers the complete path to making $100,000 per month on Whop, including account setup, store optimization, app features, marketplace strategies, and conversion techniques. The full training spans from [0:00] to [25:30].';
    }

    // Optimization questions
    if (q.includes('optim') || q.includes('improve') || q.includes('better') || q.includes('convert') || q.includes('retention')) {
      return 'Optimization focuses on three key areas: conversion rate, retention, and customer value. This includes automated messaging systems, discount strategies, and tracking link creation. Advanced optimization techniques are covered starting at [19:43].';
    }

    // Fallback with helpful context
    return 'Great question! This video covers: creating your Whop account [2:22], setting up your store [3:20], using WAP apps [9:01], marketplace strategies [16:15], and optimization techniques [19:43]. For more detailed answers, sign in to unlock unlimited AI-powered chat!';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && questionsAsked < 2) {
      const userQuestion = inputValue.trim();

      // Add user message
      setDemoMessages(prev => [...prev, { role: 'user', content: userQuestion }]);

      // Add intelligent demo AI response after a short delay
      setTimeout(() => {
        setDemoMessages(prev => [...prev, {
          role: 'assistant',
          content: getDemoResponse(userQuestion)
        }]);
      }, 500);

      setQuestionsAsked(prev => prev + 1);
      setInputValue('');
    }
  };
  return (
    <section className="relative min-h-screen bg-gray-1 pt-16 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title and CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          {/* Headline */}
          <h1
            className="font-black mb-6 leading-none"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: '#F03C09' }}
          >
            ChronosAI
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-gray-11 mb-4 font-semibold">
            Master Time. Master Your Business.
          </p>

          {/* Description */}
          <p className="text-base md:text-lg text-gray-10 mb-8 max-w-2xl mx-auto">
            Join hundreds of creators who've already reclaimed their time. Start building your AI-powered learning experience in minutes.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => {
                window.location.href = '/api/whop/auth/login';
              }}
              type="button"
              className="relative overflow-hidden px-6 rounded-xl font-semibold text-sm text-gray-12 transition-all hover:bg-gray-3 flex items-center justify-center"
              style={{
                height: '40px',
                background: 'linear-gradient(#1a1a1a, #1a1a1a) padding-box, linear-gradient(90deg, #F03C09, #000, #F03C09) border-box',
                border: '2px solid transparent',
                backgroundSize: 'auto, 200% 100%',
                animation: 'shimmer 3s linear infinite'
              }}
            >
              <span className="relative flex items-center gap-2">
                <span>Sign in with</span>
                <Image
                  src="/images/whop-logo-transp.png"
                  alt="Whop"
                  width={50}
                  height={16}
                  className="object-contain brightness-110"
                />
              </span>
            </button>
            <button
              type="button"
              className="px-6 text-sm font-semibold border-2 rounded-xl bg-transparent text-gray-12 hover:bg-gray-3 transition-all flex items-center justify-center"
              style={{ borderColor: '#F03C09', height: '40px' }}
            >
              Learn More
            </button>
          </div>
        </motion.div>

        {/* Video + Chat Side by Side */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto"
        >
          {/* Left: Video with Chapters */}
          <div className="flex flex-col space-y-4">
            {/* Video Player */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-3 border border-gray-6 shadow-2xl">
              <iframe
                src="https://www.youtube.com/embed/vMZHiBhr0SM?rel=0"
                title="How To Make $100,000 Per Month With Whop"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full hero-video-iframe"
              />
            </div>

            {/* Video Summary Sidebar */}
            <div className="bg-gray-2 border border-gray-6 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-12 mb-4 flex items-center gap-2">
                <span className="text-orange-11">📺</span>
                ChronosAI Video Summary
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {chapters.map((chapter, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleChapterClick(chapter.startSeconds, index)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      selectedChapter === index
                        ? 'bg-orange-a3 border border-orange-a7'
                        : 'bg-gray-3 border border-gray-6 hover:bg-gray-4 hover:border-orange-7'
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <p className={`text-sm font-medium ${selectedChapter === index ? 'text-orange-11' : 'text-gray-12'}`}>
                        {chapter.title}
                      </p>
                      <p className="text-xs text-gray-10 line-clamp-2">{chapter.summary}</p>
                      <span className={`text-xs font-mono ${selectedChapter === index ? 'text-orange-10' : 'text-orange-11'}`}>
                        {chapter.start} • {chapter.end}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Ask ChronosAI Chat */}
          <div className="flex flex-col">
            <div className="bg-gray-2 border border-gray-6 rounded-2xl shadow-2xl overflow-hidden h-full flex flex-col">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-orange-9 to-orange-10 px-6 py-4">
                <h3 className="text-white font-semibold text-lg">Ask ChronosAI</h3>
                <p className="text-orange-2 text-sm">Get instant answers with timestamps</p>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-gray-1 max-h-[400px]">
                {/* Initial Demo Q&A */}
                <div className="flex gap-3 justify-end">
                  <div className="max-w-[80%] rounded-2xl px-5 py-4 shadow-lg bg-gradient-to-br from-orange-9 to-orange-10 text-white">
                    <p className="text-sm leading-relaxed">What is the first step to get started?</p>
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-6 flex items-center justify-center text-xl">
                    👤
                  </div>
                </div>

                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-3 flex items-center justify-center p-1">
                    <Image
                      src="/images/chronos_icon.png"
                      alt="Chronos AI"
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                  <div className="max-w-[80%] rounded-2xl px-5 py-4 shadow-lg bg-gray-3 border border-gray-6 text-gray-12">
                    <p className="text-sm leading-relaxed mb-2">
                      The first step is to create your account on Whop. The account setup process is incredibly simple and quick, taking just a few minutes. Once your account is created, you can immediately start setting up your store page and begin building your presence on the platform.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-orange-11 font-mono">
                      <span>📍</span>
                      <button type="button" className="hover:underline" onClick={() => handleTimestampClick('2:22')}>2:22</button>
                    </div>
                  </div>
                </div>

                {/* User's demo messages */}
                {demoMessages.map((message, index) => {
                  const renderContent = (content: string) => {
                    if (message.role === 'user') {
                      return <p className="text-sm leading-relaxed">{content}</p>;
                    }

                    // Parse timestamps for assistant messages
                    const parts: React.ReactNode[] = [];
                    const timestampRegex = /\[(\d+:\d+(?::\d+)?)\]/g;
                    let lastIndex = 0;
                    let match: RegExpExecArray | null;

                    while ((match = timestampRegex.exec(content)) !== null) {
                      if (match.index > lastIndex) {
                        parts.push(
                          <span key={`text-${lastIndex}`}>{content.slice(lastIndex, match.index)}</span>
                        );
                      }

                      const timestamp = match[1]!;
                      parts.push(
                        <button
                          key={`timestamp-${match.index}`}
                          onClick={() => handleTimestampClick(timestamp)}
                          type="button"
                          className="inline-flex items-center text-orange-11 hover:text-orange-10 font-medium hover:underline transition-colors"
                        >
                          {timestamp}
                        </button>
                      );

                      lastIndex = match.index + match[0].length;
                    }

                    if (lastIndex < content.length) {
                      parts.push(<span key={`text-${lastIndex}`}>{content.slice(lastIndex)}</span>);
                    }

                    return <div className="text-sm leading-relaxed">{parts}</div>;
                  };

                  return (
                    <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-3 flex items-center justify-center p-1">
                          <Image
                            src="/images/chronos_icon.png"
                            alt="Chronos AI"
                            width={32}
                            height={32}
                            className="object-contain"
                          />
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-2xl px-5 py-4 shadow-lg ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-orange-9 to-orange-10 text-white'
                          : 'bg-gray-3 border border-gray-6 text-gray-12'
                      }`}>
                        {renderContent(message.content)}
                      </div>
                      {message.role === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-6 flex items-center justify-center text-xl">
                          👤
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Show CTA after 2 questions */}
                {questionsAsked >= 2 && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={() => {
                        window.location.href = '/api/whop/auth/login';
                      }}
                      type="button"
                      className="relative overflow-hidden px-6 rounded-xl font-semibold text-sm text-gray-12 transition-all hover:bg-gray-3 flex items-center justify-center"
                      style={{
                        height: '40px',
                        background: 'linear-gradient(#1a1a1a, #1a1a1a) padding-box, linear-gradient(90deg, #F03C09, #000, #F03C09) border-box',
                        border: '2px solid transparent',
                        backgroundSize: 'auto, 200% 100%',
                        animation: 'shimmer 3s linear infinite'
                      }}
                    >
                      <span className="relative flex items-center gap-2">
                        <span>Sign in with</span>
                        <Image
                          src="/images/whop-logo-transp.png"
                          alt="Whop"
                          width={50}
                          height={16}
                          className="object-contain brightness-110"
                        />
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="border-t border-gray-6 p-4 bg-gray-2">
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask anything about this video..."
                    disabled={questionsAsked >= 2}
                    className="flex-1 bg-gray-3 border border-gray-6 rounded-xl px-4 py-3 text-gray-12 text-sm placeholder:text-gray-9 focus:outline-none focus:ring-2 focus:ring-orange-9 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={questionsAsked >= 2 || !inputValue.trim()}
                    className="bg-gradient-to-r from-orange-9 to-orange-10 text-white rounded-xl px-6 py-3 font-medium hover:from-orange-10 hover:to-orange-11 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
                <p className="text-xs text-gray-10 mt-2 text-center">
                  {questionsAsked >= 2
                    ? "Demo limit reached • Sign in to unlock unlimited questions"
                    : `Demo mode • ${2 - questionsAsked} question${2 - questionsAsked === 1 ? '' : 's'} remaining`
                  }
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
