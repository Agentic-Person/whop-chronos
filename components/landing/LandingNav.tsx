'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { Button } from '@whop/react/components';
import { motion, AnimatePresence } from '@/components/motion';
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
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            type="button"
          >
            <img
              src="/images/chronos_icon_128.png"
              alt="Chronos AI"
              className="h-8 w-8 object-contain flex-shrink-0"
            />
            <span className="font-bold text-lg text-gray-12 hidden sm:inline">
              CHRONOS AI
            </span>
          </button>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => {
                window.location.href = '/api/whop/auth/login';
              }}
              type="button"
              className="relative overflow-hidden px-6 bg-gray-2 rounded-lg text-sm font-semibold text-gray-12 transition-all hover:bg-gray-3 border-2 flex items-center justify-center"
              style={{ borderColor: '#F03C09', height: '40px' }}
            >
              <div className="absolute inset-0 opacity-50" style={{
                background: 'linear-gradient(90deg, transparent, rgba(240, 60, 9, 0.3), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s linear infinite'
              }}></div>
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
                  window.location.href = '/api/whop/auth/login';
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
