import { Providers } from "@/components/providers/providers";
import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, Jost, Amiri } from "next/font/google";
import { appConfig } from "@/lib/env";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(appConfig.url || "https://example.com"),
  title: {
    default: `${appConfig.name} | ${appConfig.tagline}`,
    template: `%s | ${appConfig.name}`,
  },
  description: appConfig.description,
  keywords: [
    "luxury perfume",
    "oud fragrance",
    "middle eastern perfume",
    "oriental fragrance",
    "amber perfume",
    "niche perfume",
    "Miraaq",
  ],
  authors: [{ name: appConfig.name }],
  creator: appConfig.name,

  openGraph: {
    type: "website",
    locale: "en_US",
    url: appConfig.url,
    siteName: appConfig.name,
    title: `${appConfig.name} | ${appConfig.tagline}`,
    description: appConfig.description,
  },

  twitter: {
    card: "summary_large_image",
    title: appConfig.name,
    description: appConfig.description,
  },

  robots: { index: true, follow: true },

  alternates: {
    canonical: appConfig.url,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${cormorant.variable} ${jost.variable} ${amiri.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col bg-obsidian-950">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}