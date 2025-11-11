import { WhopApp } from "@whop/react/components";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
				<WhopApp colorScheme="dark">{children}</WhopApp>
			</body>
		</html>
	);
}
