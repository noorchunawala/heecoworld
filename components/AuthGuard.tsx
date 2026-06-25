"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";

type AuthGuardProps = {
  children: ReactNode;
  message?: string;
};

export default function AuthGuard({
  children,
  message = "Please continue with email to use this feature.",
}: AuthGuardProps) {
  const { status } = useAuth();

  if (status === "loading") {
    return null;
  }

  if (status !== "authenticated") {
    return (
      <div className="rounded-3xl border border-[#D6B46A]/50 bg-[#FFF8EA] p-6 text-center">
        <h3 className="text-xl font-semibold text-[#071B33]">
          Login required
        </h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>

        <Link
          href="/login"
          className="mt-5 inline-flex rounded-full bg-[#071B33] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0B2A4D]"
        >
          Continue with Email
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}