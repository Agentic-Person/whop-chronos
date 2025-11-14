'use client';

import { motion } from 'framer-motion';
import { Clock, Zap, TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
}

const features: Feature[] = [
  {
    icon: Clock,
    title: 'No more endless days of student support',
    description: 'Your course runs on intelligence, not your exhaustion. Stop answering the same questions over and over—let Chronos handle it with AI-powered responses backed by your actual content.',
    gradient: 'from-purple-9 to-blue-9',
  },
  {
    icon: Zap,
    title: 'Transcribe, Index, Teach, Assess—All Automatically',
    description: 'One upload, infinite efficiency. Your entire course transforms from a time sink into a time machine that propels students forward with automated transcription, smart indexing, and personalized learning paths.',
    gradient: 'from-blue-9 to-cyan-9',
  },
  {
    icon: TrendingUp,
    title: 'Your Students Get AI-Powered Mentorship. You Get Your Life Back.',
    description: 'Personalized learning calendars, instant Q&A with timestamps, and adaptive quizzes keep students engaged 24/7. Your expertise multiplies without burning you out.',
    gradient: 'from-cyan-9 to-teal-9',
  },
  {
    icon: Sparkles,
    title: 'Creators using ChronosAI handle 10x the student load',
    description: 'With 1/10th the stress. Turn passive hours into profit by serving more students with better results—all while reclaiming your time for what matters: creating amazing content.',
    gradient: 'from-teal-9 to-purple-9',
  },
];

export function FeatureGrid() {
  return (
    <section id="why-chronos" className="py-24 md:py-32 bg-gray-2">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-12 mb-4">
            Why Creators Choose Chronos
          </h2>
          <p className="text-lg md:text-xl text-gray-11 max-w-3xl mx-auto">
            Transform your video courses into intelligent, self-teaching experiences that work while you sleep.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="group"
            >
              <div className="bg-gray-3 border border-gray-6 rounded-2xl p-8 h-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-gray-7">
                {/* Icon */}
                <div className={cn(
                  'inline-flex items-center justify-center w-14 h-14 rounded-xl mb-6 shadow-lg',
                  `bg-gradient-to-br ${feature.gradient}`
                )}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-12 mb-4 group-hover:text-purple-11 transition-colors">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-gray-11 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
