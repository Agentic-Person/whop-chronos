import Link from 'next/link';
import { Home, Search, FileQuestion } from 'lucide-react';
import { Button } from 'frosted-ui';

/**
 * Custom 404 Not Found Page
 *
 * Displayed when a user navigates to a non-existent route.
 * Provides helpful navigation options to get back on track.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */
export default function NotFound() {
	return (
		<div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
			<div className="max-w-md w-full">
				{/* 404 Card */}
				<div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 shadow-2xl">
					{/* Icon */}
					<div className="flex justify-center mb-6">
						<div className="p-4 bg-blue-500/10 rounded-full">
							<FileQuestion className="h-12 w-12 text-blue-500" />
						</div>
					</div>

					{/* 404 Number */}
					<h1 className="text-6xl font-bold text-white text-center mb-2">
						404
					</h1>

					{/* Heading */}
					<h2 className="text-2xl font-semibold text-white text-center mb-3">
						Page Not Found
					</h2>

					{/* Description */}
					<p className="text-gray-400 text-center mb-8">
						The page you're looking for doesn't exist or has been moved.
					</p>

					{/* Action Buttons */}
					<div className="flex flex-col gap-3">
						<Link href="/dashboard/creator/overview">
							<Button
								variant="primary"
								size="md"
								className="w-full"
							>
								<Home className="h-4 w-4 mr-2" />
								Go to Dashboard
							</Button>
						</Link>

						<Link href="/dashboard/creator/videos">
							<Button
								variant="outline"
								size="md"
								className="w-full"
							>
								<Search className="h-4 w-4 mr-2" />
								Browse Videos
							</Button>
						</Link>
					</div>
				</div>

				{/* Help Text */}
				<p className="text-center text-gray-500 text-sm mt-6">
					Looking for something specific?{' '}
					<Link
						href="/dashboard/creator/overview"
						className="text-blue-400 hover:text-blue-300 transition-colors underline"
					>
						Start from the dashboard
					</Link>
				</p>
			</div>
		</div>
	);
}
