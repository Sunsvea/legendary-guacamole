import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/auth-context";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { InstallPrompt, OfflineIndicator } from "@/components/pwa/install-prompt";
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
  title: "Alpine Route Optimizer",
  description: "AI-powered pathfinding for optimal mountain hiking routes with elevation analysis and interactive maps",
  keywords: ["hiking", "route planning", "alpine", "pathfinding", "elevation", "trails", "outdoor navigation"],
  authors: [{ name: "Alpine Route Optimizer" }],
  creator: "Alpine Route Optimizer",
  publisher: "Alpine Route Optimizer",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Route Optimizer",
  },
  openGraph: {
    type: "website",
    siteName: "Alpine Route Optimizer",
    title: "Alpine Route Optimizer",
    description: "AI-powered pathfinding for optimal mountain hiking routes",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alpine Route Optimizer",
    description: "AI-powered pathfinding for optimal mountain hiking routes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1e40af" },
    { media: "(prefers-color-scheme: dark)", color: "#1e40af" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Route Optimizer" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#1e40af" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <ServiceWorkerRegistration />
          <InstallPrompt />
          <OfflineIndicator />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
