import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@/components/Analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Airtime - AI-Powered Podcast Transcription & Search",
    template: "%s | Airtime",
  },
  description:
    "Transform your podcasts into searchable, AI-powered content. Get transcripts, summaries, social posts, and key moments in minutes. The ultimate podcast transcription and search platform.",
  keywords: [
    "podcast transcription",
    "AI transcription",
    "podcast search",
    "audio transcription",
    "podcast analytics",
    "content creation",
    "podcast tools",
    "AI podcast",
  ],
  authors: [{ name: "Airtime" }],
  creator: "Airtime",
  publisher: "Airtime",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://airtime.com",
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Airtime",
    title: "Airtime - AI-Powered Podcast Transcription & Search",
    description:
      "Transform your podcasts into searchable, AI-powered content. Get transcripts, summaries, and social posts in minutes.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Airtime - AI-Powered Podcast Transcription",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Airtime - AI-Powered Podcast Transcription & Search",
    description:
      "Transform your podcasts into searchable, AI-powered content. Get transcripts, summaries, and social posts in minutes.",
    images: ["/og-image.png"],
    creator: "@airtime",
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
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <ConvexClientProvider>
        <html lang="en">
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            <main className="min-h-screen">{children}</main>
            <Toaster position="top-right" richColors />
            <Analytics />
          </body>
        </html>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}


