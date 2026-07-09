"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/SupabaseClient";

export default function NewSchoolPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [emirate, setEmirate] = useState("");
  const [area, setArea] = useState("");
  const [schoolAdminEmail, setSchoolAdminEmail] = useState("");
  const [saving, setSaving] = useState(false);

  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function createSchool() {
    if (!name.trim()) {
      alert("School name is required.");
      return;
    }

    if (!slug.trim()) {
      alert("Slug is required.");
      return;
    }

    if (!schoolAdminEmail.trim()) {
      alert("School admin email is required.");
      return;
    }

    setSaving(true);

    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session?.access_token) {
      alert("Your admin session has expired. Please log in again.");
      router.replace("/admin/login");
      setSaving(false);
      return;
    }

    const response = await fetch("/api/admin/schools", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
      body: JSON.stringify({
        name,
        slug,
        emirate,
        area,
        schoolAdminEmail,
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      alert(result?.error || "Could not create school.");
      setSaving(false);
      return;
    }

    router.push(`/admin/schools/${result.id}`);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Add New School</h1>

        <p className="mt-2 text-slate-500">
          Create the school listing and assign its first school admin.
        </p>

        <div className="mt-8 grid gap-4">
          <Input
            label="School Name"
            value={name}
            onChange={(value) => {
              setName(value);
              setSlug(generateSlug(value));
            }}
          />

          <Input label="Slug" value={slug} onChange={setSlug} />

          <Input label="Emirate" value={emirate} onChange={setEmirate} />

          <Input label="Area" value={area} onChange={setArea} />

          <Input
            label="School Admin Email"
            type="email"
            value={schoolAdminEmail}
            onChange={setSchoolAdminEmail}
          />

          <p className="-mt-2 text-sm text-slate-500">
            This email will become the school admin after they sign up using
            the same email address.
          </p>

          <button
            onClick={createSchool}
            disabled={saving}
            className="mt-4 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create School"}
          </button>
        </div>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">{label}</label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}