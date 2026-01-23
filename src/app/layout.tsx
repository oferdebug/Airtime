import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Airtime",
  description: "Airtime is a podcast platform that allows you to create and share your own podcasts.",
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
                    <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                        <Header />
                        <main className="min-h-screen">
                            { children }
                        </main>
                    </body>
                </html>
            </ConvexClientProvider>
        </ClerkProvider>
    );
}
