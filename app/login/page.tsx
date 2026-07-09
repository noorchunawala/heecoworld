"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { ArrowRight, Mail, ShieldCheck, Sparkles } from "lucide-react";

export default function LoginPage() {
  const turnstileRef = useRef<TurnstileInstance>(null);

  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      alert("Please enter your email.");
      return;
    }

    if (!turnstileToken) {
      alert("Please complete the security verification.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/auth/send-magic-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: cleanEmail,
        turnstileToken,
      }),
    });

    const result = await response.json().catch(() => null);

    setLoading(false);

    if (!response.ok) {
      alert(result?.error || "Could not send sign-in link.");
      setTurnstileToken("");
      turnstileRef.current?.reset();
      return;
    }

    alert("Check your email to continue.");
    setTurnstileToken("");
    turnstileRef.current?.reset();
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F7F6FF] px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(91,61,245,0.16),transparent_30%),radial-gradient(circle_at_88%_32%,rgba(245,158,11,0.12),transparent_32%)]" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#111135] text-2xl font-black text-white shadow-xl shadow-slate-900/10">
            S
          </div>

          <h1 className="text-4xl font-black tracking-[-0.035em] text-[#111135]">
            Welcome to Scoolyx
          </h1>

          <p className="mt-3 text-sm font-semibold text-slate-600">
            Learn. Assess. Progress.
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-8 shadow-2xl shadow-violet-500/10 backdrop-blur">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#F1EEFF] px-4 py-2 text-sm font-bold text-[#5B3DF5]">
            <Sparkles className="h-4 w-4" />
            Secure email sign in
          </div>

          <h2 className="text-2xl font-black text-[#111135]">
            Continue with your email
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Enter your email and we&apos;ll send you a secure sign-in link. New
            users can set up their profile after signing in.
          </p>

          <div className="mt-7">
            <label className="mb-2 block text-sm font-bold text-[#111135]">
              Email address
            </label>

            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") signIn();
                }}
                className="h-13 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-[#111135] outline-none transition placeholder:text-slate-400 focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-center">
            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
              onSuccess={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken("")}
              onError={() => setTurnstileToken("")}
              options={{
                theme: "light",
                size: "normal",
              }}
            />
          </div>

          <button
            onClick={signIn}
            disabled={loading}
            className="mt-5 flex h-13 w-full items-center justify-center rounded-2xl bg-[#111135] px-5 text-sm font-bold text-white transition hover:bg-[#1D1B4F] disabled:opacity-60"
          >
            {loading ? "Sending sign-in link..." : "Continue"}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </button>

          <p className="mt-5 text-center text-xs leading-5 text-slate-500">
            By continuing, you agree to Scoolyx&apos;s{" "}
            <Link href="/terms" className="font-bold text-[#5B3DF5]">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-bold text-[#5B3DF5]">
              Privacy Policy
            </Link>
            .
          </p>

          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#F7F6FF] p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#5B3DF5]" />
            <p className="text-xs leading-5 text-slate-600">
              No passwords required. Your secure access link will be sent to
              your email.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}