"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/SupabaseClient";
import { useRouter } from "next/navigation";

export default function SchoolAccessPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [activating, setActivating] = useState(true);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function activateCurrentUser() {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setActivating(false);
        return;
      }

      const response = await fetch("/api/school-access/activate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(
          result?.error ||
            "This account does not have access to a school portal."
        );
        setActivating(false);
        return;
      }

      router.replace("/school-dashboard");
return;
      setActivating(false);
    }

    activateCurrentUser();
  }, []);

  async function sendMagicLink() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setMessage("Enter your school email address.");
      return;
    }

    setSending(true);
    setMessage("");

    const invitationCheck = await fetch(
      `/api/school-access/activate?email=${encodeURIComponent(cleanEmail)}`,
      { cache: "no-store" }
    );

    const invitationResult = await invitationCheck.json().catch(() => null);

    if (!invitationCheck.ok) {
      setMessage(
        invitationResult?.error ||
          "This email does not have school access."
      );
      setSending(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/school-access`,
        shouldCreateUser: true,
      },
    });

    if (error) {
      setMessage(error.message);
      setSending(false);
      return;
    }

    setMessage("Login link sent. Check your school email inbox.");
    setSending(false);
  }

  if (activating) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <p className="text-slate-600">Checking school access...</p>
      </main>
    );
  }

  return (
  <main className="min-h-screen bg-[#F7F6FF] px-4 py-16">
    <div className="mx-auto max-w-md">

      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#111135] text-2xl font-black text-white shadow-lg">
          S
        </div>

        <h1 className="text-4xl font-black tracking-tight text-[#111135]">
          Scoolyx
        </h1>

        <p className="mt-3 text-slate-600">
          School Portal Access
        </p>
      </div>

      <div className="rounded-[32px] border border-white/80 bg-white/90 p-8 shadow-2xl shadow-violet-500/10 backdrop-blur">

        <h2 className="text-2xl font-black text-[#111135]">
          Sign in with your school email
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Enter the email address that has been invited by your school administrator.
          We'll send you a secure link to continue.
        </p>

        <div className="mt-8 space-y-5">

          <div>
            <label className="mb-2 block text-sm font-bold text-[#111135]">
              School Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@school.ae"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <button
            onClick={sendMagicLink}
            disabled={sending}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#111135] font-bold text-white transition hover:bg-[#1D1B4F] disabled:opacity-60"
          >
            {sending ? "Sending access link..." : "Continue"}
          </button>

          {message && (
            <div className="rounded-2xl bg-[#F7F6FF] px-4 py-4 text-sm text-slate-700">
              {message}
            </div>
          )}

        </div>
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        Secure passwordless sign in powered by Scoolyx.
      </p>

    </div>
  </main>
);
}