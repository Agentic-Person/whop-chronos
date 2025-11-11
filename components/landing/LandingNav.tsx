'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { Button } from '@whop/react/components';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-gray-1/80 backdrop-blur-xl border-b border-gray-a4 shadow-lg'
          : 'bg-transparent'
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            type="button"
          >
            <div className="relative w-8 h-8">
              <Image
                src="/images/chronos_icon.png"
                alt="Chronos AI"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <span className="font-bold text-lg text-gray-12 hidden sm:inline">
              CHRONOS AI
            </span>
          </button>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="solid"
              size="3"
              className="bg-gradient-to-r from-purple-9 to-blue-9 hover:from-purple-10 hover:to-blue-10"
              onClick={() => {
                window.location.href = '/api/whop/oauth';
              }}
            >
              Sign in with Whop
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-gray-2/95 backdrop-blur-xl border-t border-gray-a4"
          >
            <div className="container mx-auto px-4 py-6">
              <Button
                variant="solid"
                size="3"
                className="w-full bg-gradient-to-r from-purple-9 to-blue-9 hover:from-purple-10 hover:to-blue-10"
                onClick={() => {
                  window.location.href = '/api/whop/oauth';
                  setMobileMenuOpen(false);
                }}
              >
                Sign in with Whop
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
