import "./globals.css";
import { ReactNode } from "react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import LocationGate from "@/app/components/LocationGate";
import { Analytics } from "@vercel/analytics/next";
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white font-sans">
        <LocationGate />
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
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
    "color-scheme": "dark",
  },
};
