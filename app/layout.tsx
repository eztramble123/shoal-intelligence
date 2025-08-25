import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth/session-provider";
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
  title: "Shoal Intelligence - Crypto Analytics Dashboard",
  description: "Professional crypto analytics dashboard for tracking token listings, venture intelligence, and market coverage",
  icons: {
    icon: [
      { url: '/white_shoal.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/white_shoal.svg',
    apple: [
      { url: '/white_shoal.svg', type: 'image/svg+xml' },
    ],
  },
  manifest: '/manifest.json',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1b1e' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Shoal Intelligence',
  },
  openGraph: {
    title: 'Shoal Intelligence - Crypto Analytics Dashboard',
    description: 'Professional crypto analytics dashboard for tracking token listings, venture intelligence, and market coverage',
    type: 'website',
    siteName: 'Shoal Intelligence',
    images: [
      {
        url: '/white_shoal.svg',
        width: 1200,
        height: 630,
        alt: 'Shoal Intelligence Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shoal Intelligence - Crypto Analytics Dashboard',
    description: 'Professional crypto analytics dashboard for tracking token listings, venture intelligence, and market coverage',
    images: ['/white_shoal.svg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
