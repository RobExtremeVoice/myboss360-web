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
  title: "MyBoss360 | Executive Operating System",
  description:
    "MyBoss360 is the executive operating system for revenue, projects, team execution, finance context, and AI guidance in one premium workspace.",
  applicationName: "MyBoss360",
  keywords: [
    "MyBoss360",
    "business operating system",
    "executive workspace",
    "AI assistant",
    "CRM",
    "operations",
  ],
  openGraph: {
    title: "MyBoss360 | Executive Operating System",
    description:
      "Run the business from one calm, intelligent command center built for founders, executives, and modern teams.",
    siteName: "MyBoss360",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyBoss360 | Executive Operating System",
    description:
      "A premium operating system for leaders who want revenue, execution, finance, and AI context in one place.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
