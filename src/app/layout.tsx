import type { Metadata, Viewport } from "next";
import { Fraunces, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const body = Public_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

// Update to the production domain before launch — this backs canonical
// links, the sitemap and the default Open Graph/Twitter image URLs.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://southbound-travel.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Southbound — Private drivers & day trips across New Zealand",
    template: "%s · Southbound",
  },
  description:
    "Book a private driver, day tour or point-to-point transfer anywhere in New Zealand. One vehicle, one local driver, one fixed price.",
  keywords: [
    "New Zealand private driver",
    "New Zealand day tours",
    "New Zealand airport transfer",
    "private tour New Zealand",
    "hourly driver hire New Zealand",
  ],
  applicationName: "Southbound",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Southbound",
    title: "Southbound — Private drivers & day trips across New Zealand",
    description:
      "Book a private driver, day tour or point-to-point transfer anywhere in New Zealand. One vehicle, one local driver, one fixed price.",
    url: "/",
    locale: "en_NZ",
  },
  twitter: {
    card: "summary_large_image",
    title: "Southbound — Private drivers & day trips across New Zealand",
    description: "Private drivers, day trips and transfers the length of New Zealand.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#1F3A31",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="flex min-h-screen flex-col font-body">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-pine focus:px-4 focus:py-2 focus:text-paper"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
