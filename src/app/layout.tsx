import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import AppShell from "@/app/components/AppShell";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import { defaultMetadata } from "@/app/lib/site";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const themeInitScript = `(function(){try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}})();`;

const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const umamiScriptUrl =
  process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ??
  "https://analytics.hoochymoochy.xyz/script.js";

export const metadata: Metadata = defaultMetadata;

// import LocationGate from "@/app/components/LocationGate";
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("overflow-x-clip overscroll-none font-sans", geist.variable)}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-svh overflow-x-clip bg-[var(--page-bg)] text-zinc-900 font-sans overscroll-none"
      >
        {/* Re-enable to prompt for browser location on load (see LocationGate.tsx) */}
        {/* <LocationGate /> */}
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
        <Analytics />
        {umamiWebsiteId ? (
          <Script
            defer
            src={umamiScriptUrl}
            data-website-id={umamiWebsiteId}
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
