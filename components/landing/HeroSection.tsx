'use client';

import { motion } from 'framer-motion';
import { Button } from '@whop/react/components';

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-gray-1 pt-24 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title and CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mb-4">
            <span className="bg-gradient-to-r from-orange-10 to-orange-11 bg-clip-text text-transparent">
              ChronosAI
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-gray-11 mb-8">
            Master Time. Master Your Business.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              variant="solid"
              size="3"
              className="bg-gradient-to-r from-orange-9 to-orange-10 hover:from-orange-10 hover:to-orange-11 px-8 py-3 text-lg font-semibold"
              onClick={() => {
                window.location.href = '/api/whop/oauth';
              }}
            >
              Sign In with Whop →
            </Button>
            <Button
              variant="outline"
              size="3"
              className="px-8 py-3 text-lg font-semibold border-gray-7 hover:border-gray-8 hover:bg-gray-3"
            >
              Learn More
            </Button>
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
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="How To Make $100,000 Per Month With Whop"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>

            {/* Video Summary Sidebar */}
            <div className="bg-gray-2 border border-gray-6 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-12 mb-4 flex items-center gap-2">
                <span className="text-orange-11">📺</span>
                ChronosAI Video Summary
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {[
                  { title: 'Introduction & Whop Milestone', time: '0:00 • 2:30' },
                  { title: 'Marketplace Opportunity & Easy...', time: '2:30 • 2:30' },
                  { title: 'Platform Structure', time: '5:00 • 3:00' },
                  { title: 'Essential Apps', time: '8:00 • 4:00' },
                  { title: 'Course App & Coaching', time: '12:00 • 4:00' },
                  { title: 'Bounties & Rewards', time: '16:00 • 3:00' },
                  { title: 'Marketplace Setup', time: '19:00 • 3:00' },
                  { title: 'Conversion Strategies', time: '22:00 • 2:00' },
                ].map((chapter, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left p-3 rounded-lg transition-all duration-200 bg-gray-3 border border-gray-6 hover:bg-gray-4 hover:border-orange-7 hover:border-l-4 hover:pl-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-12">{chapter.title}</p>
                      <span className="text-xs font-mono whitespace-nowrap text-gray-11">{chapter.time}</span>
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
              <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-gray-1">
                {/* Demo Q&A */}
                <div className="flex gap-3 justify-end">
                  <div className="max-w-[80%] rounded-2xl px-5 py-4 shadow-lg bg-gradient-to-br from-orange-9 to-orange-10 text-white">
                    <p className="text-sm leading-relaxed">What is the next step?</p>
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-6 flex items-center justify-center text-xl">
                    👤
                  </div>
                </div>

                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-9 to-orange-10 flex items-center justify-center text-xl">
                    ⏰
                  </div>
                  <div className="max-w-[80%] rounded-2xl px-5 py-4 shadow-lg bg-gray-3 border border-gray-6 text-gray-12">
                    <p className="text-sm leading-relaxed mb-2">
                      Based on the video content, this is a comprehensive guide about making money on Whop. The video covers setting up your account, using essential apps, optimizing your marketplace presence, and conversion strategies. For more specific information, please watch the full video or sign up to access the complete course content.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-orange-11 font-mono">
                      <span>📍</span>
                      <button type="button" className="hover:underline">4:32</button>
                      <span>•</span>
                      <button type="button" className="hover:underline">16:00</button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <div className="max-w-[80%] rounded-2xl px-5 py-4 shadow-lg bg-gradient-to-br from-orange-9 to-orange-10 text-white">
                    <p className="text-sm leading-relaxed">How To Make $100,000 Per Month With Whop (Step-By-Step Training)</p>
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-6 flex items-center justify-center text-xl">
                    👤
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="border-t border-gray-6 p-4 bg-gray-2">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Ask anything about your course videos..."
                    disabled
                    className="flex-1 bg-gray-3 border border-gray-6 rounded-xl px-4 py-3 text-gray-11 text-sm placeholder:text-gray-9 cursor-not-allowed"
                  />
                  <button disabled type="button" className="bg-gray-6 text-gray-9 rounded-xl px-6 py-3 font-medium cursor-not-allowed">
                    <span className="text-xl">📤</span>
                  </button>
                </div>
                <p className="text-xs text-gray-10 mt-2 text-center">
                  Interactive demo • 2 questions remaining
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
