'use client';

import { motion } from '@/components/motion';
import { Clock, Zap, MessageSquare, Video, BarChart3, TrendingUp, Shield, Users } from 'lucide-react';
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
    title: 'Save 10+ Hours Per Week',
    description: 'Stop answering the same questions over and over. ChronosAI handles student support automatically with AI-powered responses backed by your actual content.',
    gradient: 'from-purple-9 to-blue-9',
  },
  {
    icon: Zap,
    title: 'Automatic Transcription & Indexing',
    description: 'Upload your videos and ChronosAI automatically transcribes, indexes, and makes every word searchable. Students can find exactly what they need in seconds.',
    gradient: 'from-blue-9 to-cyan-9',
  },
  {
    icon: MessageSquare,
    title: 'AI Chat with Timestamps',
    description: 'Students ask questions and get instant answers with clickable timestamps that jump directly to the relevant part of your videos.',
    gradient: 'from-cyan-9 to-teal-9',
  },
  {
    icon: Video,
    title: 'Multi-Source Video Import',
    description: 'Import videos from YouTube, Loom, or direct upload. ChronosAI works with your existing content library - no need to re-upload everything.',
    gradient: 'from-teal-9 to-green-9',
  },
  {
    icon: BarChart3,
    title: 'Student Analytics Dashboard',
    description: 'See which videos get watched, where students drop off, and what questions they ask most. Data-driven insights to improve your courses.',
    gradient: 'from-green-9 to-yellow-9',
  },
  {
    icon: TrendingUp,
    title: 'Increase Completion Rates',
    description: 'Interactive learning keeps students engaged. Creators using ChronosAI see course completion rates jump from 15% to 60%+.',
    gradient: 'from-yellow-9 to-orange-9',
  },
  {
    icon: Shield,
    title: 'Enterprise-Grade Security',
    description: 'Your content is protected with end-to-end encryption. Student data is handled with care and full GDPR compliance.',
    gradient: 'from-orange-9 to-red-9',
  },
  {
    icon: Users,
    title: 'Scale Without Burnout',
    description: 'Handle 10x the student load with 1/10th the stress. Your expertise multiplies without burning you out.',
    gradient: 'from-red-9 to-purple-9',
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="py-20 md:py-28 bg-gray-2">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-12 mb-4">
            Powerful Features for Modern Creators
          </h2>
          <p className="text-lg md:text-xl text-gray-11 max-w-3xl mx-auto">
            Transform your video courses into intelligent, self-teaching experiences that work while you sleep.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="group"
            >
              <div className="bg-gray-3 border border-gray-6 rounded-2xl p-6 h-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-gray-7">
                {/* Icon */}
                <div className={cn(
                  'inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 shadow-lg',
                  `bg-gradient-to-br ${feature.gradient}`
                )}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-12 mb-2 group-hover:text-purple-11 transition-colors">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-gray-11 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <a
            href="https://whop.com/agentic-personnel-llc/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-9 to-blue-9 hover:from-purple-10 hover:to-blue-10 px-8 py-3 font-semibold rounded-xl text-white transition-all shadow-lg hover:shadow-xl"
          >
            Start Your Free Trial
          </a>
          <p className="text-sm text-gray-10 mt-3">3-day free trial • No credit card required</p>
        </motion.div>
      </div>
    </section>
  );
}
