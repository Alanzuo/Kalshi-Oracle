import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlphaLine Trading",
  description: "Strategy ensemble command center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100">
        <nav className="border-b border-zinc-800 bg-zinc-950/80 sticky top-0 z-10 backdrop-blur">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
            <Link href="/" className="font-semibold tracking-tight">
              ALPHALINE <span className="text-zinc-500">/ Trading</span>
            </Link>
            <div className="flex gap-4 text-sm text-zinc-400">
              <Link href="/" className="hover:text-zinc-100">
                Strategies
              </Link>
              <Link href="/tape" className="hover:text-zinc-100">
                Live Tape
              </Link>
              <Link href="/equity" className="hover:text-zinc-100">
                Equity
              </Link>
              <Link href="/backtests" className="hover:text-zinc-100">
                Backtests
              </Link>
              <Link href="/model" className="hover:text-zinc-100">
                Model
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
