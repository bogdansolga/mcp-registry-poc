import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "MCP Registry",
  description: "Centralized catalog for Model Context Protocol servers",
};

function Navigation() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">
            MCP
          </div>
          <span className="font-semibold text-lg">Registry</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/registry" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Browse
          </Link>
          <Link href="/categories" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Categories
          </Link>
          <Link
            href="/register"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Register Server
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background antialiased`}>
        <Navigation />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
