import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { AuthProvider } from "@/components/auth-provider";
import { FeedbackWidget } from "@/components/feedback-widget";
import "./globals.css";

import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0f1c",
};

export const metadata: Metadata = {
  title: "World Cup HQ | Office Fantasy World Cup 2026",
  description:
    "Draft countries, pick players, make predictions, and compete with your office in the ultimate World Cup experience.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "World Cup HQ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <Nav />
          <main className="flex-1 pt-4 pb-20 md:pt-20 md:pb-8 stadium-bg">
            <div className="max-w-5xl mx-auto px-4">{children}</div>
          </main>
          <FeedbackWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
