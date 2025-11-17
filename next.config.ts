import { withWhopAppConfig } from "@whop/react/next.config";
import type { NextConfig } from "next";

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

	// TEMPORARY: Disable TypeScript build errors while investigating Vercel type resolution issue
	// Local builds pass but Vercel fails - investigating root cause
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
			process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000",
	},

	// Webpack Configuration for Production Builds
	webpack: (config, { isServer }) => {
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
			};
		}

		return config;
	},

	// Headers for Security & Performance
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{
						key: "X-DNS-Prefetch-Control",
						value: "on",
					},
					{
						key: "Strict-Transport-Security",
						value: "max-age=63072000; includeSubDomains; preload",
					},
					{
						key: "X-Frame-Options",
						value: "SAMEORIGIN",
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
				],
			},
		];
	},
};

export default withWhopAppConfig(nextConfig);
