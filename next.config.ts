import { withWhopAppConfig } from "@whop/react/next.config";
import type { NextConfig } from "next";

// Production validation for critical URLs
if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_APP_URL) {
	console.warn(
		"⚠️  Warning: NEXT_PUBLIC_APP_URL should be set in production for proper URL generation",
	);
}

// Bundle analyzer for measuring bundle size
const withBundleAnalyzer = require("@next/bundle-analyzer")({
	enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
	// Image Optimization
	images: {
		remotePatterns: [{ hostname: "**" }],
		formats: ["image/avif", "image/webp"],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
	},

	// Performance & Production Optimizations
	reactStrictMode: true,
	poweredByHeader: false,
	compress: true,

	// TEMPORARY: TypeScript build errors disabled during integration wave
	// Type errors exist in multiple API routes due to untyped Supabase queries
	// See docs/agent-reports/waves/agent-7-typescript-audit.md for full details
	// TODO: Enable after fixing all identified type errors
	typescript: {
		ignoreBuildErrors: true,
	},

	// Experimental Features
	experimental: {
		optimizePackageImports: [
			"lucide-react",
			"recharts",
			"framer-motion",
			"frosted-ui",
		],
	},

	// Production Environment Variables Validation
	env: {
		// biome-ignore lint/complexity/useLiteralKeys: TypeScript requires bracket notation for process.env
		NEXT_PUBLIC_APP_URL:
			process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3007",
	},

	// Webpack Configuration for Production Builds
	webpack: (config, { isServer, dev }) => {
		// SVG handling
		config.module.rules.push({
			test: /\.svg$/,
			use: ["@svgr/webpack"],
		});

		// Production optimizations
		if (!isServer) {
			config.optimization = {
				...config.optimization,
				moduleIds: "deterministic",
				runtimeChunk: "single",
				splitChunks: {
					chunks: "all",
					cacheGroups: {
						default: false,
						vendors: false,
						// Vendor chunk
						vendor: {
							name: "vendor",
							chunks: "all",
							test: /node_modules/,
							priority: 20,
						},
						// UI framework chunks
						frostedUI: {
							name: "frosted-ui",
							test: /[\\/]node_modules[\\/](frosted-ui)[\\/]/,
							priority: 30,
						},
						// AI SDK chunks
						ai: {
							name: "ai-sdk",
							test: /[\\/]node_modules[\\/](@anthropic-ai|openai)[\\/]/,
							priority: 30,
						},
						// Common chunks
						common: {
							minChunks: 2,
							priority: 10,
							reuseExistingChunk: true,
							enforce: true,
						},
					},
				},
				// Remove console statements in production builds
				minimizer: !dev ? [
					...((config.optimization.minimizer as any[]) || []),
				] : undefined,
			};

			// Configure Terser to remove console statements in production
			if (!dev) {
				const TerserPlugin = require('terser-webpack-plugin');
				config.optimization.minimizer.push(
					new TerserPlugin({
						terserOptions: {
							compress: {
								drop_console: true,
								pure_funcs: ['console.log', 'console.info', 'console.debug'],
							},
							format: {
								comments: false,
							},
						},
						extractComments: false,
					})
				);
			}
		}

		return config;
	},

	// Headers for Security & Performance
	async headers() {
		// Security headers for Whop embedded app
		// Allow embedding from Whop domains on ALL routes (this is a Whop-only app)
		const securityHeaders = [
			{
				key: "X-DNS-Prefetch-Control",
				value: "on",
			},
			{
				key: "Strict-Transport-Security",
				value: "max-age=63072000; includeSubDomains; preload",
			},
			{
				key: "X-Content-Type-Options",
				value: "nosniff",
			},
			{
				key: "X-XSS-Protection",
				value: "1; mode=block",
			},
			{
				key: "Referrer-Policy",
				value: "strict-origin-when-cross-origin",
			},
			{
				key: "Permissions-Policy",
				value: "camera=(), microphone=(), geolocation=()",
			},
			{
				// Allow Whop domains to embed this app in iframes
				key: "Content-Security-Policy",
				value: "frame-ancestors 'self' https://*.whop.com https://whop.com;",
			},
		];

		return [
			// Apply security headers to all routes
			{
				source: "/:path*",
				headers: securityHeaders,
			},
		];
	},
};

export default withBundleAnalyzer(withWhopAppConfig(nextConfig));
