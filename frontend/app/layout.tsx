import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Weather Based Life Assistant",
  description: "Phase 2 dashboard for weather-driven daily planning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} font-[family-name:var(--font-space-grotesk)]`}>
        {children}
      </body>
    </html>
  );
}
