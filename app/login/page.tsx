"use client";

import { useState } from "react";
import { supabase } from "@/lib/SupabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    if (!email.trim()) {
      alert("Please enter your email.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Check your email to continue.");
  };

  return (
    <main className="min-h-screen bg-[#F8F1E7] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-[#071B33]">
          Welcome to HeecoWorld
        </h1>

        <p className="mt-3 text-slate-600">
          Continue with your email.
        </p>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-6 w-full rounded-2xl border border-slate-300 px-4 py-3"
        />

        <button
          onClick={signIn}
          disabled={loading}
          className="mt-5 w-full rounded-full bg-[#071B33] py-3 font-semibold text-white"
        >
          {loading ? "Sending..." : "Continue"}
        </button>
      </div>
    </main>
  );
}