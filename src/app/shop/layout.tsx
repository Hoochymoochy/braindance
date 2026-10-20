import type { ReactNode } from "react";
import { ShopProvider } from "@/app/components/shop/ShopProvider";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return <ShopProvider>{children}</ShopProvider>;
}
