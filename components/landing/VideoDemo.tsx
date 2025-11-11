'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Chapter {
  title: string;
  start: string;
  end: string;
  startSeconds: number;
}

const chapters: Chapter[] = [
  { title: 'Introduction & Whop Milestone', start: '0:00', end: '2:30', startSeconds: 0 },
  { title: 'Marketplace Opportunity', start: '2:30', end: '5:00', startSeconds: 150 },
  { title: 'Platform Structure', start: '5:00', end: '8:00', startSeconds: 300 },
  { title: 'Essential Apps', start: '8:00', end: '12:00', startSeconds: 480 },
  { title: 'Course App & Coaching', start: '12:00', end: '16:00', startSeconds: 720 },
  { title: 'Bounties & Rewards', start: '16:00', end: '19:00', startSeconds: 960 },
  { title: 'Marketplace Setup', start: '19:00', end: '22:00', startSeconds: 1140 },
  { title: 'Conversion Strategies', start: '22:00', end: '24:00', startSeconds: 1320 },
];

export function VideoDemo() {
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

  const handleChapterClick = (chapter: Chapter, index: number) => {
    setSelectedChapter(index);
    // In a real implementation, this would seek the YouTube player to the timestamp
    // For now, we'll just update the selected state
    const iframe = document.querySelector('iframe');
    if (iframe?.src) {
      const baseUrl = iframe.src.split('?')[0];
      iframe.src = `${baseUrl}?start=${chapter.startSeconds}&autoplay=1`;
    }
  };

  return (
    <section id="demo" className="py-24 md:py-32 bg-gray-1">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-12 mb-4">
            See How It Works
          </h2>
          <p className="text-lg md:text-xl text-gray-11 max-w-3xl mx-auto">
            Watch this complete guide on building a successful Whop business—exactly the type of content Chronos helps you transform into an interactive learning experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Video Player */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-gray-3 border border-gray-6">
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="How To Make $100,000 Per Month With Whop"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>

            {/* Video Metadata */}
            <div className="mt-6 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-12 mb-2">
                  How To Make $100,000 Per Month With Whop
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-11">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>24:00</span>
                  </div>
                  <span>•</span>
                  <span>8 Chapters</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Chapter List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1"
          >
            <div className="bg-gray-2 border border-gray-6 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-12 mb-4 flex items-center gap-2">
                <Play className="w-5 h-5 text-purple-11" />
                Chapters
              </h3>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {chapters.map((chapter, index) => (
                  <button
                    key={index}
                    onClick={() => handleChapterClick(chapter, index)}
                    type="button"
                    className={cn(
                      'w-full text-left p-3 rounded-lg transition-all duration-200',
                      selectedChapter === index
                        ? 'bg-purple-a3 border border-purple-a7'
                        : 'bg-gray-3 border border-gray-6 hover:bg-gray-4 hover:border-gray-7'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          selectedChapter === index ? 'text-purple-11' : 'text-gray-12'
                        )}
                      >
                        {chapter.title}
                      </p>
                      <span
                        className={cn(
                          'text-xs font-mono whitespace-nowrap',
                          selectedChapter === index ? 'text-purple-10' : 'text-gray-11'
                        )}
                      >
                        {chapter.start} • {chapter.end}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
