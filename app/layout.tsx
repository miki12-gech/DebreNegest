import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ደብረ ነገስት | ትምህርት ሰንበት Digital Platform",
  description:
    "A modern digital platform for Ethiopian Orthodox Sunday School community learning, communication, and spiritual education.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="am" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-orthodox-darker text-orthodox-parchment dark:bg-orthodox-darker dark:text-orthodox-parchment`}
      >
        <ThemeProvider>
          <SessionProvider>
            <QueryProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: "var(--toast-bg, #1A1410)",
                    border: "1px solid rgba(212, 168, 67, 0.2)",
                    color: "var(--toast-color, #F0E6D3)",
                  },
                }}
              />
            </QueryProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
