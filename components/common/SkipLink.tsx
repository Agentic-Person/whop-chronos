'use client';

import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

/**
 * Skip Link Component
 *
 * Allows keyboard users to skip navigation and jump to main content.
 * Hidden by default, visible on focus.
 *
 * WCAG 2.4.1 Level A requirement - Bypass Blocks
 *
 * @example
 * ```tsx
 * <SkipLink href="#main-content">Skip to main content</SkipLink>
 * ```
 */
export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        // Hidden by default - positioned off-screen
        'absolute left-[-9999px] top-0',
        // Visible on focus with smooth transition
        'focus:left-4 focus:top-4 focus:z-[9999]',
        // Styling when focused
        'focus:bg-blue-600 focus:text-white',
        'focus:px-4 focus:py-2 focus:rounded-md',
        'focus:outline-none focus:ring-2 focus:ring-blue-400',
        'focus:shadow-lg',
        // Smooth animation
        'transition-all duration-200',
        // Typography
        'font-medium text-sm'
      )}
    >
      {children}
    </a>
  );
}
