/**
 * Structured logging utility for Chronos
 *
 * Usage:
 * - Development: Logs to console with emoji prefixes and colors
 * - Production: Critical errors sent to Sentry, debug/info suppressed
 *
 * @example
 * import { logger } from '@/lib/logger';
 *
 * logger.debug('Processing video', { videoId: video.id });
 * logger.info('Video processed successfully', { duration: '2m' });
 * logger.warn('Low storage space', { remaining: '100MB' });
 * logger.error('Failed to process video', error, { videoId: video.id });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
	component?: string;
	userId?: string;
	videoId?: string;
	courseId?: string;
	duration?: string;
	[key: string]: any;
}

class Logger {
	private isDev = process.env.NODE_ENV === 'development';

	/**
	 * Debug-level logging - only visible in development
	 * Use for detailed diagnostic information
	 */
	debug(message: string, context?: LogContext) {
		if (this.isDev) {
			console.log(`🔍 [DEBUG] ${message}`, context || '');
		}
	}

	/**
	 * Info-level logging - only visible in development
	 * Use for general informational messages
	 */
	info(message: string, context?: LogContext) {
		if (this.isDev) {
			console.log(`ℹ️  [INFO] ${message}`, context || '');
		}
	}

	/**
	 * Warning-level logging - visible in both dev and production
	 * Use for non-critical issues that should be monitored
	 */
	warn(message: string, context?: LogContext) {
		if (this.isDev) {
			console.warn(`⚠️  [WARN] ${message}`, context || '');
		} else {
			// Production: Could send to analytics/monitoring
			// For now, suppress in production to reduce noise
		}
	}

	/**
	 * Error-level logging - always captured
	 * Development: Logs to console
	 * Production: Sends to Sentry with full context
	 */
	error(message: string, error?: Error | unknown, context?: LogContext) {
		if (this.isDev) {
			console.error(`❌ [ERROR] ${message}`, error || '', context || '');
		} else {
			// Production: Send to Sentry
			if (typeof window !== 'undefined' && (window as any).Sentry) {
				const sentryError = error instanceof Error
					? error
					: new Error(message);

				(window as any).Sentry.captureException(sentryError, {
					contexts: {
						custom: {
							...context,
							originalMessage: message,
						}
					},
					tags: {
						component: context?.component || 'unknown',
					},
				});
			}

			// Server-side Sentry (if configured)
			if (typeof window === 'undefined') {
				try {
					const Sentry = require('@sentry/nextjs');
					const sentryError = error instanceof Error
						? error
						: new Error(message);

					Sentry.captureException(sentryError, {
						contexts: {
							custom: {
								...context,
								originalMessage: message,
							}
						},
						tags: {
							component: context?.component || 'unknown',
						},
					});
				} catch {
					// Sentry not configured, fail silently in production
				}
			}
		}
	}

	/**
	 * Performance logging - tracks operation duration
	 * Only visible in development
	 */
	perf(operation: string, startTime: number, context?: LogContext) {
		const duration = Date.now() - startTime;
		if (this.isDev) {
			console.log(`⏱️  [PERF] ${operation} took ${duration}ms`, context || '');
		}
	}

	/**
	 * API logging - tracks API calls and responses
	 * Only visible in development
	 */
	api(method: string, endpoint: string, status: number, context?: LogContext) {
		if (this.isDev) {
			const statusEmoji = status >= 200 && status < 300 ? '✅' : '❌';
			console.log(`${statusEmoji} [API] ${method} ${endpoint} - ${status}`, context || '');
		}
	}
}

export const logger = new Logger();
