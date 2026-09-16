import type { Metadata } from "next";

const FALLBACK_SITE_URL = "https://braindance.live";

export function getSiteUrl(): URL {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    FALLBACK_SITE_URL;

  const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol.replace(/\/+$/, ""));
  } catch {
    return new URL(FALLBACK_SITE_URL);
  }
}

export const SITE_NAME = "Braindance";
export const SITE_TAGLINE = "Stream DJ sets. Discover new mixes.";
export const SITE_DESCRIPTION =
  "Fresh DJ sets and classics in one place — browse the catalog, pick a mix, and stream.";

export const defaultMetadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "DJ sets",
    "live mixes",
    "electronic music",
    "Braindance",
    "stream DJ",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: "/brain.svg",
  },
  other: {
    "color-scheme": "light dark",
  },
};
