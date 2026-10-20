import type { ReactNode } from "react";
import { AdminGate } from "@/app/components/admin/AdminGate";
import { AdminNav } from "@/app/components/admin/AdminNav";
import { ShopProvider } from "@/app/components/shop/ShopProvider";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ShopProvider mode="admin">
      <AdminGate>
        <div className="container mx-auto px-4 pb-16 pt-4 md:pt-8">
          <div className="mb-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
              Braindance
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              Merch admin
            </h1>
          </div>
          <AdminNav />
          <div className="pt-8">{children}</div>
        </div>
      </AdminGate>
    </ShopProvider>
  );
}
