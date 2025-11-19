'use client';

import { useEffect, type ReactNode } from 'react';
import FocusTrap from 'focus-trap-react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  footer?: ReactNode;
  className?: string;
  /**
   * Whether to allow closing by clicking outside the modal
   * @default true
   */
  closeOnOutsideClick?: boolean;
  /**
   * Whether to show the close button in header
   * @default true
   */
  showCloseButton?: boolean;
}

/**
 * Accessible Modal Component
 *
 * WCAG 2.1 AA Compliant features:
 * - Traps focus inside modal (WCAG 2.4.3 - Focus Order)
 * - Escape key to close (WCAG 2.1.1 - Keyboard accessible)
 * - Screen reader announcements (role="dialog", aria-modal, aria-labelledby)
 * - No body scroll when open (prevents confusion)
 * - Visible focus indicators
 * - High contrast mode support
 *
 * @example
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Edit Profile"
 *   size="md"
 * >
 *   <p>Modal content here</p>
 * </Modal>
 * ```
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  className,
  closeOnOutsideClick = true,
  showCloseButton = true,
}: ModalProps) {
  // Prevent body scroll when modal open (WCAG 2.1.1)
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;

      return () => {
        document.body.style.overflow = 'unset';
        document.body.style.paddingRight = '0px';
      };
    }
  }, [isOpen]);

  // Close on Escape key (WCAG 2.1.1)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  const handleBackdropClick = () => {
    if (closeOnOutsideClick) {
      onClose();
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    // Prevent click from bubbling to backdrop
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={handleBackdropClick}
    >
      <FocusTrap
        focusTrapOptions={{
          initialFocus: false,
          escapeDeactivates: false, // We handle escape manually
          clickOutsideDeactivates: closeOnOutsideClick,
          allowOutsideClick: true,
        }}
      >
        <div
          className={cn(
            'bg-gray-2 border border-gray-6 rounded-lg shadow-xl w-full max-h-[90vh] flex flex-col',
            sizeClasses[size],
            className
          )}
          onClick={handleModalClick}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-6">
            <h2
              id="modal-title"
              className="text-xl font-semibold text-gray-12"
            >
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  'p-2 rounded-md',
                  'text-gray-11 hover:text-gray-12 hover:bg-gray-4',
                  'transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
                aria-label="Close modal"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>

          {/* Footer (optional) */}
          {footer && (
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-6 bg-gray-1">
              {footer}
            </div>
          )}
        </div>
      </FocusTrap>
    </div>
  );
}
