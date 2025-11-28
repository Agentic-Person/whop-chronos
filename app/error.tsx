'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from 'frosted-ui';
import Link from 'next/link';
import { logger } from '@/lib/logger';

/**
 * Page-level Error Boundary
 *
 * Catches errors in page components and displays a recovery UI.
 * Automatically logs errors to console in development and Sentry in production.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log error with context
		logger.error('Page error occurred', error, {
			component: 'ErrorBoundary',
			digest: error.digest,
			message: error.message,
		});
	}, [error]);

	return (
		<div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
			<div className="max-w-md w-full">
				{/* Error Card */}
				<div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 shadow-2xl">
					{/* Icon */}
					<div className="flex justify-center mb-6">
						<div className="p-4 bg-red-500/10 rounded-full">
							<AlertTriangle className="h-12 w-12 text-red-500" />
						</div>
					</div>

					{/* Heading */}
					<h1 className="text-2xl font-bold text-white text-center mb-3">
						Something went wrong
					</h1>

					{/* Description */}
					<p className="text-gray-400 text-center mb-6">
						We encountered an unexpected error. This has been logged and we'll look into it.
					</p>

					{/* Error Details (Development Only) */}
					{process.env.NODE_ENV === 'development' && (
						<details className="mb-6">
							<summary className="cursor-pointer text-sm font-medium text-gray-300 mb-2 hover:text-white transition-colors">
								Error Details (Dev Only)
							</summary>
							<div className="mt-2 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
								<p className="text-xs text-red-400 font-mono break-all mb-2">
									{error.message}
								</p>
								{error.digest && (
									<p className="text-xs text-gray-500 font-mono">
										Digest: {error.digest}
									</p>
								)}
							</div>
						</details>
					)}

					{/* Action Buttons */}
					<div className="flex flex-col sm:flex-row gap-3">
						<Button
							onClick={reset}
							variant="primary"
							size="md"
							className="flex-1"
						>
							<RefreshCw className="h-4 w-4 mr-2" />
							Try Again
						</Button>

						<Link href="/dashboard/creator/overview" className="flex-1">
							<Button
								variant="outline"
								size="md"
								className="w-full"
							>
								<Home className="h-4 w-4 mr-2" />
								Go Home
							</Button>
						</Link>
					</div>
				</div>

				{/* Help Text */}
				<p className="text-center text-gray-500 text-sm mt-6">
					If this problem persists, please contact support
				</p>
			</div>
		</div>
	);
}
