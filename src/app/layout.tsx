import localFont from "next/font/local";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

// Self-hosted (IBM Plex Sans, latin, SIL OFL): the build never fetches from Google Fonts, which failed
// inside the Docker build. Files from @fontsource/ibm-plex-sans 5.3.0.
const ibmPlexSans = localFont({
  variable: "--font-ibm-plex-sans",
  src: [
    { path: "./fonts/ibm-plex-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-sans-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Care Compass",
  description: "Care management platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
