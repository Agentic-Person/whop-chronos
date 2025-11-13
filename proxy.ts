/**
 * Next.js Proxy (Next.js 16+)
 *
 * Protects routes and validates authentication
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// ============================================================================
// Route Configuration
// ============================================================================

// Routes that require authentication
const PROTECTED_ROUTES = [
	"/dashboard",
	"/api/videos",
	"/api/courses",
	"/api/chat",
	"/api/analytics",
];

// Public routes (accessible without auth)
const PUBLIC_ROUTES = ["/", "/api/whop/auth", "/api/whop/webhook"];

// API routes that don't need auth
const PUBLIC_API_ROUTES = ["/api/health", "/api/status"];

// ============================================================================
// Middleware Function
// ============================================================================

export default function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// ============================================================================
	// DEV MODE BYPASS - Skip auth in development
	// ============================================================================
	const isDevelopment = process.env['NODE_ENV'] === "development";
	const devBypass = process.env['DEV_BYPASS_AUTH'] === "true";

	if (isDevelopment && devBypass) {
		// In dev mode with bypass enabled, allow all routes
		return NextResponse.next();
	}

	// Check if route is public
	const isPublicRoute = PUBLIC_ROUTES.some((route) =>
		pathname.startsWith(route),
	);
	const isPublicApi = PUBLIC_API_ROUTES.some((route) =>
		pathname.startsWith(route),
	);

	if (isPublicRoute || isPublicApi) {
		return NextResponse.next();
	}

	// Check if route requires authentication
	const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
		pathname.startsWith(route),
	);

	if (!isProtectedRoute) {
		return NextResponse.next();
	}

	// Check for session cookie
	const sessionCookie = request.cookies.get("whop_session");

	if (!sessionCookie) {
		// No session - redirect to login for pages, return 401 for API
		if (pathname.startsWith("/api/")) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}

		// Redirect to login with return URL
		const loginUrl = new URL("/api/whop/auth/login", request.url);
		loginUrl.searchParams.set("redirect", pathname);
		return NextResponse.redirect(loginUrl);
	}

	// Session exists - allow request to proceed
	// Full validation happens in the route handler
	return NextResponse.next();
}

// ============================================================================
// Middleware Configuration
// ============================================================================

export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization)
		 * - favicon.ico (favicon)
		 * - public folder
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
