/**
 * Auth Error Page
 *
 * Displays authentication errors when native auth fails.
 * Users are redirected here with reason codes.
 */

import Link from "next/link";

interface AuthErrorPageProps {
  searchParams: Promise<{
    reason?: string;
    error?: string;
    company?: string;
    experience?: string;
  }>;
}

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  unauthenticated: {
    title: "Authentication Required",
    description:
      "You need to access this app through Whop. Please go to your Whop dashboard and open the app from there.",
  },
  not_admin: {
    title: "Creator Access Required",
    description:
      "You don't have creator (admin) access to this company. Only team members can access the creator dashboard.",
  },
  no_access: {
    title: "Access Denied",
    description:
      "You don't have access to this content. You may need to purchase a membership to access this experience.",
  },
  access_check_failed: {
    title: "Access Check Failed",
    description:
      "We couldn't verify your access permissions. Please try again or contact support if the issue persists.",
  },
  token_expired: {
    title: "Session Expired",
    description:
      "Your session has expired. Please refresh the page or navigate back to Whop to re-authenticate.",
  },
  default: {
    title: "Authentication Error",
    description:
      "Something went wrong with authentication. Please try again or contact support.",
  },
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = await searchParams;
  const reason = params.reason || "default";
  const errorDetail = params.error;
  const companyId = params.company;
  const experienceId = params.experience;

  const errorInfo = ERROR_MESSAGES[reason] || ERROR_MESSAGES.default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Error Icon */}
        <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Error Title */}
        <h1 className="text-2xl font-bold text-white">{errorInfo.title}</h1>

        {/* Error Description */}
        <p className="text-gray-400">{errorInfo.description}</p>

        {/* Technical Details (if available) */}
        {errorDetail && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-left">
            <p className="text-sm text-gray-500 mb-1">Error details:</p>
            <code className="text-xs text-gray-400 break-all">{errorDetail}</code>
          </div>
        )}

        {/* Context Info */}
        {(companyId || experienceId) && (
          <div className="text-sm text-gray-500">
            {companyId && <p>Company: {companyId}</p>}
            {experienceId && <p>Experience: {experienceId}</p>}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="https://whop.com/dashboard"
            className="inline-flex items-center justify-center px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Go to Whop Dashboard
          </a>

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center px-4 py-2 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Try Again
          </button>
        </div>

        {/* Help Link */}
        <p className="text-sm text-gray-500">
          Need help?{" "}
          <a
            href="https://discord.gg/whop"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Join Whop Discord
          </a>
        </p>
      </div>
    </div>
  );
}
