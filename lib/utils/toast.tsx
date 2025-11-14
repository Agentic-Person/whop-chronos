/**
 * Simple Toast Notification System
 *
 * Provides a lightweight toast notification system without external dependencies
 * Used for showing feedback when users click timestamps from different videos
 */

import { createRoot } from 'react-dom/client';
import { X, Info, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

interface ToastOptions {
  type?: ToastType;
  duration?: number; // milliseconds
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
}

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => {
  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle,
  };

  const colors = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    success: 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    error: 'bg-red-50 border-red-200 text-red-900',
  };

  const iconColors = {
    info: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  };

  const Icon = icons[type];

  return (
    <div
      className={`
        flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg
        animate-in slide-in-from-top-5 fade-in duration-300
        ${colors[type]}
      `}
      role="alert"
    >
      <Icon className={`h-5 w-5 flex-shrink-0 ${iconColors[type]}`} />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

class ToastManager {
  private container: HTMLElement | null = null;
  private toasts: Map<string, { root: any; timeoutId: NodeJS.Timeout }> = new Map();

  private getContainer(): HTMLElement {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md';
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  private removeToast(id: string) {
    const toast = this.toasts.get(id);
    if (toast) {
      clearTimeout(toast.timeoutId);
      toast.root.unmount();
      this.toasts.delete(id);
    }

    // Clean up container if no toasts
    if (this.toasts.size === 0 && this.container) {
      this.container.remove();
      this.container = null;
    }
  }

  show(message: string, options: ToastOptions = {}) {
    const {
      type = 'info',
      duration = 5000,
    } = options;

    const id = `toast-${Date.now()}-${Math.random()}`;
    const container = this.getContainer();

    const toastElement = document.createElement('div');
    container.appendChild(toastElement);

    const root = createRoot(toastElement);
    root.render(
      <Toast
        message={message}
        type={type}
        onClose={() => this.removeToast(id)}
      />
    );

    const timeoutId = setTimeout(() => {
      this.removeToast(id);
    }, duration);

    this.toasts.set(id, { root, timeoutId });
  }
}

// Export singleton instance
const toastManager = new ToastManager();

export const toast = {
  show: (message: string, options?: ToastOptions) => toastManager.show(message, options),
  info: (message: string, duration?: number) => toastManager.show(message, { type: 'info', duration }),
  success: (message: string, duration?: number) => toastManager.show(message, { type: 'success', duration }),
  warning: (message: string, duration?: number) => toastManager.show(message, { type: 'warning', duration }),
  error: (message: string, duration?: number) => toastManager.show(message, { type: 'error', duration }),
};
