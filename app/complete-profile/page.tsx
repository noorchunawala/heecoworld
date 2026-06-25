"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/SupabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

type UserType = "parent" | "student" | "alumni" | "teacher";

export default function CompleteProfilePage() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();

  const redirectTo = params.get("redirectTo") || "/";

  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [userType, setUserType] = useState<UserType>("parent");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.replace(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
        return;
      }

      setLoading(false);
    }

    loadUser();
  }, [redirectTo, router]);

  const saveProfile = async () => {
    if (!fullName.trim()) {
      alert("Please enter your full name.");
      return;
    }

    if (!mobile.trim()) {
      alert("Please enter your mobile number.");
      return;
    }

    setSaving(true);

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setSaving(false);
      router.replace(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }

    const { error } = await supabase.from("user_profiles").upsert(
      {
        id: data.user.id,
        full_name: fullName.trim(),
        email: data.user.email || null,
        user_type: userType,
        mobile: mobile.trim(),
        country_code: "+971",
        is_profile_complete: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      setSaving(false);
      alert(error.message);
      return;
    }

    await refresh();

    setSaving(false);
    router.replace(redirectTo);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F1E7] px-4 py-16">
        <div className="mx-auto max-w-md rounded-[2rem] bg-white p-8 shadow-xl">
          Loading profile...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F1E7] px-4 py-16">
      <div className="mx-auto max-w-md rounded-[2rem] bg-white p-8 shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#B58A34]">
          Complete Profile
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-[#071B33]">
          Tell us about yourself
        </h1>

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#071B33]">
              Full name
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#D6B46A]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#071B33]">
              Mobile number
            </label>
            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="0501234567"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#D6B46A]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#071B33]">
              I am a
            </label>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value as UserType)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#D6B46A]"
            >
              <option value="parent">Parent</option>
              <option value="student">Student</option>
              <option value="alumni">Alumni</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full rounded-full bg-[#071B33] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}