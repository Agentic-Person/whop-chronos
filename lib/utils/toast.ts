/**
 * Toast notification utility
 *
 * Thin wrapper around sonner for consistent toast notifications across the app.
 *
 * @usage
 * ```typescript
 * import { toast } from '@/lib/utils/toast';
 *
 * toast.success('Video uploaded successfully');
 * toast.error('Failed to process video');
 * toast.warning('Storage limit approaching 90%');
 * toast.info('Processing started');
 * ```
 */

import { toast as sonnerToast } from 'sonner';

export const toast = {
  /**
   * Display a success toast notification
   * @param message - Success message to display
   */
  success: (message: string) => {
    sonnerToast.success(message);
  },

  /**
   * Display an error toast notification
   * @param message - Error message to display
   */
  error: (message: string) => {
    sonnerToast.error(message);
  },

  /**
   * Display a warning toast notification
   * @param message - Warning message to display
   */
  warning: (message: string) => {
    sonnerToast.warning(message);
  },

  /**
   * Display an info toast notification
   * @param message - Info message to display
   */
  info: (message: string) => {
    sonnerToast.info(message);
  },
};
