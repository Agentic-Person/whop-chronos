'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from '@whop/react/components';
import { motion, AnimatePresence } from '@/components/motion';
import { cn } from '@/lib/utils';

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    if (!isHomePage) {
      // Navigate to home page with hash
      window.location.href = `/#${sectionId}`;
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
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
          {/* Logo - Always links home */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img
              src="/images/chronos_icon_128.png"
              alt="Chronos AI"
              className="h-8 w-8 object-contain flex-shrink-0"
            />
            <span className="font-bold text-lg text-gray-12 hidden sm:inline">
              CHRONOS AI
            </span>
          </Link>

          {/* Desktop Navigation - Features & Pricing tabs (show after scroll) */}
          <div className="hidden md:flex items-center gap-6">
            <AnimatePresence>
              {isScrolled && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1"
                >
                  <button
                    onClick={() => scrollToSection('features')}
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-11 hover:text-gray-12 hover:bg-gray-3 rounded-lg transition-all"
                  >
                    Features
                  </button>
                  <button
                    onClick={() => scrollToSection('pricing')}
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-11 hover:text-gray-12 hover:bg-gray-3 rounded-lg transition-all"
                  >
                    Pricing
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA Button */}
            <a
              href="https://whop.com/agentic-personnel-llc/"
              target="_blank"
              rel="noopener noreferrer"
              className="relative overflow-hidden px-5 bg-gray-2 rounded-lg text-sm font-semibold text-gray-12 transition-all hover:bg-gray-3 border-2 flex items-center justify-center"
              style={{ borderColor: '#F03C09', height: '38px' }}
            >
              <div className="absolute inset-0 opacity-50" style={{
                background: 'linear-gradient(90deg, transparent, rgba(240, 60, 9, 0.3), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s linear infinite'
              }}></div>
              <span className="relative flex items-center gap-2">
                <span>Start Free Trial on</span>
                <Image
                  src="/images/whop-logo-transp.png"
                  alt="Whop"
                  width={45}
                  height={14}
                  className="object-contain brightness-110"
                />
              </span>
            </a>
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
            <div className="container mx-auto px-4 py-4 space-y-2">
              <button
                onClick={() => scrollToSection('features')}
                type="button"
                className="block w-full text-left py-3 px-4 rounded-lg text-gray-12 hover:bg-gray-3 font-medium transition-all"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                type="button"
                className="block w-full text-left py-3 px-4 rounded-lg text-gray-12 hover:bg-gray-3 font-medium transition-all"
              >
                Pricing
              </button>
              <a
                href="https://whop.com/agentic-personnel-llc/"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-3 px-4 rounded-lg bg-gradient-to-r from-purple-9 to-blue-9 hover:from-purple-10 hover:to-blue-10 text-white font-semibold transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                Start Free Trial on Whop
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
