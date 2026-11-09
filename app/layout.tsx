// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Manrope  } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import HydrationFix from "./hydration-fix";
import { TimerProvider } from "@/contexts/TimerContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import BackendWarmup from "@/components/BackendWarmup";

// ⭐ Manrope is a geometric, premium font that looks amazing on this design style
const manrope = Manrope ({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

// ⭐ Perfect SEO & PWA Metadata
export const metadata: Metadata = {
  title: {
    default: "Orvix | Enterprise Task Management",
    template: "%s | Orvix",
  },
  description: "The ultimate enterprise suite for task management, CRM, and workflow automation.",
  keywords: ["Task Management", "CRM", "Enterprise Software", "Project Management", "Orvix"],
  authors: [{ name: "Orvix Team" }],
  creator: "Orvix",
  publisher: "Orvix",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/orvix-logo.png",
    shortcut: "/orvix-logo.png",
    apple: "/orvix-logo.png",
  },
  openGraph: {
    title: "Orvix | Enterprise Task Management",
    description: "The ultimate enterprise suite for task management, CRM, and workflow automation.",
    url: "https://orvix.com", // Replace with your actual domain
    siteName: "Orvix",
    images: [
      {
        url: "/orvix-logo.png",
        width: 800,
        height: 600,
        alt: "Orvix Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Orvix | Enterprise Task Management",
    description: "The ultimate enterprise suite for task management, CRM, and workflow automation.",
    images: ["/orvix-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

// ⭐ Viewport configuration (Next.js 14+ standard for mobile scaling)
export const viewport: Viewport = {
  themeColor: "#ebf2e4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${manrope.className} antialiased bg-[#ebf2e4] text-slate-800 selection:bg-green-500/20`}
        suppressHydrationWarning
      >
        <HydrationFix />
        <BackendWarmup />
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <TimerProvider>{children}</TimerProvider>
            </NotificationProvider>
          </SocketProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#ffffff',
                color: '#1e293b',
                border: '1px solid #e2e8f0',
                fontSize: '13px',
                fontWeight: '500',
                borderRadius: '10px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}