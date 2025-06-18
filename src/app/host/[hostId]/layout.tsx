"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/app/lib/utils/supabaseClient";

interface Props {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  const router = useRouter();
  const params = useParams();
  const hostId = params?.hostId;

  const [isAuthorized, setIsAuthorized] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const verifySession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || session.user.id !== hostId) {
        router.push("/host/login");
      } else {
        setIsAuthorized(true);
      }

      setLoading(false);
    };

    if (hostId) verifySession();
  }, [hostId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading your dashboard...
      </div>
    );
  }
  return isAuthorized ? <>{children}</> : null;
}
