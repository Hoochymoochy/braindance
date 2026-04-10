import "./globals.css";
import { ReactNode } from "react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


// import LocationGate from "@/app/components/LocationGate";
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
        <body className="min-h-screen text-white font-sans">
        {/* Re-enable to prompt for browser location on load (see LocationGate.tsx) */}
        {/* <LocationGate /> */}
        <Header />
        <main className="min-h-screen pt-[calc(var(--nav-header-h)+env(safe-area-inset-top,0px))] pb-[calc(var(--nav-footer-h)+env(safe-area-inset-bottom,0px))]">
          {children}
        </main>
        <Footer />
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
    "color-scheme": "dark",
  },
};
