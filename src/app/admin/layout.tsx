import type { ReactNode } from "react";
import { Suspense } from "react";
import { AdminGate } from "@/app/components/admin/AdminGate";
import { AdminHeader } from "@/app/components/admin/AdminHeader";
import { AdminNav } from "@/app/components/admin/AdminNav";
import { ShopProvider } from "@/app/components/shop/ShopProvider";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ShopProvider mode="admin">
      <AdminGate>
        <div className="container mx-auto px-4 pb-16 pt-4 md:pt-8">
          <Suspense
            fallback={
              <div className="mb-2">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                  Merch admin
                </h1>
              </div>
            }
          >
            <AdminHeader />
          </Suspense>
          <AdminNav />
          <div className="pt-8">{children}</div>
        </div>
      </AdminGate>
    </ShopProvider>
  );
}
