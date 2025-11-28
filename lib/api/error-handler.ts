import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Standard API Error Response
 */
export interface ApiErrorResponse {
	success: false;
	error: {
		message: string;
		code?: string;
		timestamp: string;
		details?: unknown;
	};
}

/**
 * Standard API Success Response
 */
export interface ApiSuccessResponse<T = unknown> {
	success: true;
	data: T;
	timestamp?: string;
}

/**
 * API Response Type (Success or Error)
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Error Types and HTTP Status Codes
 */
export const ErrorTypes = {
	// Client Errors (4xx)
	BAD_REQUEST: { code: 'BAD_REQUEST', status: 400, message: 'Invalid request parameters' },
	UNAUTHORIZED: { code: 'UNAUTHORIZED', status: 401, message: 'Authentication required' },
	FORBIDDEN: { code: 'FORBIDDEN', status: 403, message: 'Access denied' },
	NOT_FOUND: { code: 'NOT_FOUND', status: 404, message: 'Resource not found' },
	VALIDATION_ERROR: { code: 'VALIDATION_ERROR', status: 422, message: 'Validation failed' },
	RATE_LIMIT: { code: 'RATE_LIMIT', status: 429, message: 'Too many requests' },

	// Server Errors (5xx)
	INTERNAL_ERROR: { code: 'INTERNAL_ERROR', status: 500, message: 'Internal server error' },
	DATABASE_ERROR: { code: 'DATABASE_ERROR', status: 500, message: 'Database operation failed' },
	AI_SERVICE_ERROR: { code: 'AI_SERVICE_ERROR', status: 503, message: 'AI service unavailable' },
	EXTERNAL_API_ERROR: { code: 'EXTERNAL_API_ERROR', status: 502, message: 'External service error' },
} as const;

/**
 * Standardized API Error Handler
 *
 * Logs errors with context and returns consistent error responses.
 * Automatically sends critical errors to Sentry in production.
 *
 * @param error - The error object (Error, string, or unknown)
 * @param context - Additional context for logging (component, userId, etc.)
 * @param errorType - Predefined error type from ErrorTypes
 * @returns NextResponse with standardized error format
 *
 * @example
 * ```typescript
 * import { handleApiError, ErrorTypes } from '@/lib/api/error-handler';
 *
 * export async function GET(request: Request) {
 *   try {
 *     const data = await fetchData();
 *     return NextResponse.json({ success: true, data });
 *   } catch (error) {
 *     return handleApiError(error, {
 *       component: 'VideoAPI',
 *       userId: user.id,
 *     }, ErrorTypes.DATABASE_ERROR);
 *   }
 * }
 * ```
 */
export function handleApiError(
	error: unknown,
	context?: { component?: string; [key: string]: unknown },
	errorType = ErrorTypes.INTERNAL_ERROR
): NextResponse<ApiErrorResponse> {
	// Extract error message
	const errorMessage = error instanceof Error
		? error.message
		: typeof error === 'string'
			? error
			: 'An unexpected error occurred';

	// Log error with full context
	logger.error('API error', error, {
		...context,
		errorCode: errorType.code,
		statusCode: errorType.status,
	});

	// Build error response
	const response: ApiErrorResponse = {
		success: false,
		error: {
			message: errorType.message,
			code: errorType.code,
			timestamp: new Date().toISOString(),
			// Include details in development only
			...(process.env.NODE_ENV === 'development' && {
				details: errorMessage,
			}),
		},
	};

	return NextResponse.json(response, {
		status: errorType.status,
		headers: {
			'Content-Type': 'application/json',
		},
	});
}

/**
 * Validation Error Handler
 *
 * Special handler for validation errors with field-level details.
 *
 * @param errors - Validation errors (field-level errors)
 * @param context - Additional context for logging
 * @returns NextResponse with validation error details
 *
 * @example
 * ```typescript
 * if (!email || !password) {
 *   return handleValidationError({
 *     email: !email ? 'Email is required' : undefined,
 *     password: !password ? 'Password is required' : undefined,
 *   }, { component: 'AuthAPI' });
 * }
 * ```
 */
export function handleValidationError(
	errors: Record<string, string | undefined>,
	context?: { component?: string; [key: string]: unknown }
): NextResponse<ApiErrorResponse> {
	// Filter out undefined errors
	const validationErrors = Object.fromEntries(
		Object.entries(errors).filter(([_, value]) => value !== undefined)
	);

	logger.warn('Validation error', {
		...context,
		errors: validationErrors,
	});

	const response: ApiErrorResponse = {
		success: false,
		error: {
			message: 'Validation failed',
			code: ErrorTypes.VALIDATION_ERROR.code,
			timestamp: new Date().toISOString(),
			details: validationErrors,
		},
	};

	return NextResponse.json(response, {
		status: ErrorTypes.VALIDATION_ERROR.status,
	});
}

/**
 * Success Response Helper
 *
 * Creates a standardized success response.
 *
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with success format
 *
 * @example
 * ```typescript
 * return apiSuccess({ video: processedVideo }, 201);
 * ```
 */
export function apiSuccess<T>(
	data: T,
	status = 200
): NextResponse<ApiSuccessResponse<T>> {
	const response: ApiSuccessResponse<T> = {
		success: true,
		data,
		timestamp: new Date().toISOString(),
	};

	return NextResponse.json(response, { status });
}

/**
 * Rate Limit Error Handler
 *
 * Special handler for rate limit errors.
 *
 * @param retryAfter - Seconds until retry is allowed
 * @param context - Additional context for logging
 * @returns NextResponse with rate limit error
 */
export function handleRateLimitError(
	retryAfter: number,
	context?: { component?: string; [key: string]: unknown }
): NextResponse<ApiErrorResponse> {
	logger.warn('Rate limit exceeded', {
		...context,
		retryAfter,
	});

	const response: ApiErrorResponse = {
		success: false,
		error: {
			message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
			code: ErrorTypes.RATE_LIMIT.code,
			timestamp: new Date().toISOString(),
			details: { retryAfter },
		},
	};

	return NextResponse.json(response, {
		status: ErrorTypes.RATE_LIMIT.status,
		headers: {
			'Retry-After': retryAfter.toString(),
		},
	});
}
