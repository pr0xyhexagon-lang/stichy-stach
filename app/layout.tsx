import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Stichy Stash – Hand Embroidery Academy",
  description: "Student registration, attendance and payments for Stichy Stash embroidery classes.",
};

// viewportFit "cover" lets env(safe-area-inset-*) work on notched phones (sticky/bottom bars).
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#a8325c" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
