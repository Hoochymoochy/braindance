import "./globals.css";
import { ReactNode } from "react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white font-sans">
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
