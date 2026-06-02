import type { Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { rootMetadata } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-sans" });

export const metadata = rootMetadata;

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
