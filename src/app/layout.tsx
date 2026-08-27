import "./globals.css";
import { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import AppShell from "@/app/components/AppShell";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


// import LocationGate from "@/app/components/LocationGate";
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn("overflow-x-clip overscroll-none font-sans", geist.variable)}>
        <body className="min-h-svh overflow-x-clip bg-[var(--page-bg)] text-zinc-900 font-sans overscroll-none">
        {/* Re-enable to prompt for browser location on load (see LocationGate.tsx) */}
        {/* <LocationGate /> */}
        <AppShell>{children}</AppShell>
        <Analytics />
      </body>
    </html>
  );
}

export const metadata = {
  title: "Braindance",
  icons: {
    icon: "/brain.svg",
  },
  other: {
    "color-scheme": "light",
  },
};
