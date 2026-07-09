"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function ProfileCompletionGuard() {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "profile_incomplete") return;

    if (
      pathname === "/complete-profile" ||
      pathname === "/login" ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/school-access") ||
      pathname.startsWith("/school-dashboard")
      
    ) {
      return;
    }

    router.push("/complete-profile");
  }, [status, pathname, router]);

  return null;
}