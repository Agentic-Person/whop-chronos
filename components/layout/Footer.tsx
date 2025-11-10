import Link from "next/link";
import { Github, Twitter, Mail } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
                <span className="text-lg font-bold text-white">C</span>
              </div>
              <span className="text-xl font-bold">Chronos</span>
            </div>
            <p className="text-sm text-gray-600">
              AI-powered video learning assistant for Whop creators
            </p>
          </div>

          {/* Product links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/features"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/docs"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/help"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/status"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Status
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 md:flex-row">
          <p className="text-sm text-gray-600">
            © {currentYear} Chronos. All rights reserved.
          </p>

          {/* Social links */}
          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="mailto:support@chronos.com"
              className="text-gray-600 hover:text-gray-900"
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
