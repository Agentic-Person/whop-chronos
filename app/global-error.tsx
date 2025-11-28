'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '@/lib/logger';

/**
 * Global Error Boundary
 *
 * Catches errors in the root layout and other global components.
 * Must include <html> and <body> tags as it replaces the entire page.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error#global-errorjs
 */
export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log critical global error
		logger.error('Global error occurred', error, {
			component: 'GlobalErrorBoundary',
			digest: error.digest,
			message: error.message,
			critical: true,
		});
	}, [error]);

	return (
		<html lang="en" className="dark">
			<body className="antialiased">
				<div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
					<div className="max-w-md w-full">
						{/* Error Card */}
						<div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 shadow-2xl">
							{/* Icon */}
							<div className="flex justify-center mb-6">
								<div className="p-4 bg-red-500/10 rounded-full">
									<AlertTriangle className="h-16 w-16 text-red-500" />
								</div>
							</div>

							{/* Heading */}
							<h1 className="text-3xl font-bold text-white text-center mb-3">
								Critical Error
							</h1>

							{/* Description */}
							<p className="text-gray-400 text-center mb-6">
								We encountered a critical error. Please refresh the page to continue.
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
										{error.stack && (
											<pre className="mt-2 text-xs text-gray-500 font-mono overflow-auto max-h-32">
												{error.stack}
											</pre>
										)}
									</div>
								</details>
							)}

							{/* Action Button */}
							<button
								onClick={reset}
								className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
							>
								<RefreshCw className="h-5 w-5" />
								Refresh Page
							</button>
						</div>

						{/* Help Text */}
						<p className="text-center text-gray-500 text-sm mt-6">
							If this problem persists, please contact support or clear your browser cache
						</p>
					</div>
				</div>
			</body>
		</html>
	);
}
