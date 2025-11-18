import { WhopApp } from "@whop/react/components";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3007'),
	title: "Chronos AI - Your AI Teaching Assistant | Transform Video Courses",
	description: "Save 10+ hours/week in student support. AI-powered chat, automated transcription, and comprehensive analytics for Whop creators in education and coaching.",
	keywords: [
		"AI teaching assistant",
		"video learning",
		"Whop creators",
		"course automation",
		"student support",
		"AI chat",
		"video transcription",
		"course analytics",
		"Whop app",
		"education technology",
	],
	authors: [{ name: "Chronos AI" }],
	creator: "Chronos AI",
	publisher: "Chronos AI",
	manifest: "/site.webmanifest",
	icons: {
		icon: [
			{ url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
			{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
			{ url: "/icon-192.png", sizes: "192x192", type: "image/png" },
			{ url: "/icon-512.png", sizes: "512x512", type: "image/png" },
			{ url: "/icon.svg", type: "image/svg+xml" },
		],
		apple: [
			{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
		],
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://chronos-ai.app/",
		title: "Chronos AI - Your AI Teaching Assistant",
		description: "Save 10+ hours/week in student support. AI-powered chat, automated transcription, and comprehensive analytics for Whop creators.",
		siteName: "Chronos AI",
		images: [
			{
				url: "/images/chronos_icon.png",
				width: 512,
				height: 512,
				alt: "Chronos AI Logo",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Chronos AI - Your AI Teaching Assistant",
		description: "Save 10+ hours/week in student support with AI-powered video learning assistance for Whop creators.",
		images: ["/images/chronos_icon.png"],
		creator: "@chronosai",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	verification: {
		google: "your-google-verification-code",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<WhopApp>
					<AuthProvider>
						{children}
					</AuthProvider>
				</WhopApp>
				<Toaster position="top-right" theme="dark" richColors />
			</body>
		</html>
	);
}
