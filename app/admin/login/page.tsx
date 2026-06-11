"use client";

import { useState } from "react";
import { supabase } from "@/lib/SupabaseClient";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/admin");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={login}
        className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md space-y-5"
      >
        <div>
          <h1 className="text-3xl font-bold">Admin Login</h1>
          <p className="text-slate-500 mt-2">
            Sign in to manage HeecoWorld enquiries.
          </p>
        </div>

        <input
          type="email"
          required
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-xl px-4 py-3"
        />

        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-xl px-4 py-3"
        />

        <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold">
          Login
        </button>
      </form>
    </main>
  );
}