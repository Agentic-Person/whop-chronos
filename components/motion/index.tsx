'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// Lazy load framer-motion (100KB saved on initial bundle)
// Only loaded when landing page is visited
const FramerMotion = dynamic(() => import('framer-motion'), {
  loading: () => null,
  ssr: false // Animations don't need SSR
});

// Re-export motion components with dynamic loading
export const motion = {
  div: dynamic(() => import('framer-motion').then(mod => ({ default: mod.motion.div })), {
    loading: () => <div />,
    ssr: false
  }),
  section: dynamic(() => import('framer-motion').then(mod => ({ default: mod.motion.section })), {
    loading: () => <section />,
    ssr: false
  }),
  h1: dynamic(() => import('framer-motion').then(mod => ({ default: mod.motion.h1 })), {
    loading: () => <h1 />,
    ssr: false
  }),
  h2: dynamic(() => import('framer-motion').then(mod => ({ default: mod.motion.h2 })), {
    loading: () => <h2 />,
    ssr: false
  }),
  p: dynamic(() => import('framer-motion').then(mod => ({ default: mod.motion.p })), {
    loading: () => <p />,
    ssr: false
  }),
  button: dynamic(() => import('framer-motion').then(mod => ({ default: mod.motion.button })), {
    loading: () => <button />,
    ssr: false
  }),
  a: dynamic(() => import('framer-motion').then(mod => ({ default: mod.motion.a })), {
    loading: () => <a />,
    ssr: false
  }),
  ul: dynamic(() => import('framer-motion').then(mod => ({ default: mod.motion.ul })), {
    loading: () => <ul />,
    ssr: false
  }),
  li: dynamic(() => import('framer-motion').then(mod => ({ default: mod.motion.li })), {
    loading: () => <li />,
    ssr: false
  }),
  nav: dynamic(() => import('framer-motion').then(mod => ({ default: mod.motion.nav })), {
    loading: () => <nav />,
    ssr: false
  }),
  header: dynamic(() => import('framer-motion').then(mod => ({ default: mod.motion.header })), {
    loading: () => <header />,
    ssr: false
  }),
};

// Re-export hooks and utilities
export { AnimatePresence } from 'framer-motion';
export type { Variants, Transition, MotionProps } from 'framer-motion';
