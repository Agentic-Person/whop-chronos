import Link from 'next/link';
import Image from 'next/image';
import { Github, Twitter, Mail } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-gray-6 bg-gray-2">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8">
                <Image
                  src="/images/chronos_icon.png"
                  alt="Chronos AI"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold text-gray-12">Chronos</span>
            </div>
            <p className="text-sm text-gray-11 leading-relaxed">
              AI-powered video learning assistant for Whop creators in education and coaching
            </p>
          </div>

          {/* Product links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-12">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/features"
                  className="text-sm text-gray-11 hover:text-purple-11 transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-gray-11 hover:text-purple-11 transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/docs"
                  className="text-sm text-gray-11 hover:text-purple-11 transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/api/whop/oauth"
                  className="text-sm text-gray-11 hover:text-purple-11 transition-colors"
                >
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-12">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/help"
                  className="text-sm text-gray-11 hover:text-purple-11 transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-11 hover:text-purple-11 transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/status"
                  className="text-sm text-gray-11 hover:text-purple-11 transition-colors"
                >
                  Status
                </Link>
              </li>
              <li>
                <a
                  href="https://whop.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-11 hover:text-purple-11 transition-colors"
                >
                  Whop Platform
                </a>
              </li>
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-12">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-11 hover:text-purple-11 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-gray-11 hover:text-purple-11 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/security"
                  className="text-sm text-gray-11 hover:text-purple-11 transition-colors"
                >
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-6 pt-8 md:flex-row">
          <p className="text-sm text-gray-11">
            © {currentYear} Chronos AI. All rights reserved. Built for{' '}
            <a
              href="https://whop.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-11 hover:text-purple-10 transition-colors"
            >
              Whop
            </a>
            {' '}creators.
          </p>

          {/* Social links */}
          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-11 hover:text-purple-11 transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-11 hover:text-purple-11 transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="mailto:support@chronos-ai.app"
              className="text-gray-11 hover:text-purple-11 transition-colors"
              aria-label="Email"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
