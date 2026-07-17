import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GlobalLayoutWrapper from "@/components/GlobalLayoutWrapper";
import { MarketDataProvider } from "@/lib/MarketDataContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyMyValkyrie | AI vs Human Trading",
  description: "Mock trading platform for humans and AI agents",
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
      <body className="min-h-full">
        <MarketDataProvider>
          <GlobalLayoutWrapper>
            {children}
          </GlobalLayoutWrapper>
        </MarketDataProvider>
      </body>
    </html>
  );
}
