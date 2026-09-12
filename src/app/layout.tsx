import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import { siteConfig } from "@/config/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: `${siteConfig.appName} — Private Music Space for ${siteConfig.girlfriendName}`,
  description: "A private music player, lyrics viewer, and karaoke studio.",
  icons: {
    icon: "/favicon.jpg",
    shortcut: "/favicon.jpg",
    apple: "/favicon.jpg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#09090e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth select-none">
      <body className={`${inter.variable} bg-[#09090e] text-zinc-100 antialiased font-sans overflow-x-hidden min-h-screen`}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
