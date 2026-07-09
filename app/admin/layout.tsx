"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/SupabaseClient";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/admin/login";

  const [checking, setChecking] = useState(!isLoginPage);
  const [allowed, setAllowed] = useState(isLoginPage);

  useEffect(() => {
    async function checkAdminAccess() {
      if (isLoginPage) {
        setAllowed(true);
        setChecking(false);
        return;
      }

      setChecking(true);
      setAllowed(false);

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        router.replace("/admin/login");
        return;
      }

      const response = await fetch("/api/admin/auth", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

     if (!response.ok) {
  router.replace("/admin/login");
  return;
}

      setAllowed(true);
      setChecking(false);
    }

    checkAdminAccess();
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        Checking admin access...
      </main>
    );
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}