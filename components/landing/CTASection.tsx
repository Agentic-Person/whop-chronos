'use client';

import { motion } from '@/components/motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export function CTASection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-9 via-blue-9 to-purple-9 opacity-10" />

      {/* Animated Gradient Overlay */}
      <motion.div
        animate={{
          background: [
            'radial-gradient(circle at 30% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 70% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 30% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
          ],
        }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'linear',
        }}
        className="absolute inset-0 pointer-events-none"
      />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-9 to-blue-9 rounded-2xl mb-8 shadow-xl"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-12 mb-6 leading-tight"
          >
            Ready to Transform Your Content?
          </motion.h2>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg sm:text-xl md:text-2xl text-gray-11 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Join hundreds of creators who've already reclaimed their time. Start building your AI-powered learning experience in minutes.
          </motion.p>

          {/* Primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <a
              href="https://whop.com/agentic-personnel-llc/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-9 to-blue-9 hover:from-purple-10 hover:to-blue-10 px-12 py-4 text-xl font-bold shadow-2xl hover:shadow-purple-9/50 transition-all hover:scale-105 rounded-lg text-white"
            >
              Start Free Trial on Whop
              <ArrowRight className="w-6 h-6" />
            </a>
          </motion.div>

          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-10"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-9 rounded-full" />
              <span>Free to start</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-7" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-9 rounded-full" />
              <span>No credit card required</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-7" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-9 rounded-full" />
              <span>Setup in 5 minutes</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
