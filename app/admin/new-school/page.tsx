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

    setSaving(true);

    const { data, error } = await supabase
      .from("listings")
      .insert({
        name: name.trim(),
        slug: slug.trim(),
        emirate: emirate.trim() || null,
        area: area.trim() || null,
        status: "draft",
        type: "school",
      })
      .select("id")
      .single();

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    const schoolId = data.id;

    await supabase.from("school_profiles").insert({
      listing_id: schoolId,
      curricula: [],
      grades: [],
      priorities: [],
      facilities: [],
    });

    await supabase.from("school_profile_details").insert({
      listing_id: schoolId,
      updated_at: new Date().toISOString(),
    });

   router.push(`/admin/schools/${schoolId}`);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Add New School</h1>
        <p className="mt-2 text-slate-500">
          Create a draft school listing, then complete the full profile.
        </p>

        <div className="mt-8 grid gap-4">
          <Input
            label="School Name"
            value={name}
            onChange={(v) => {
              setName(v);
              setSlug(generateSlug(v));
            }}
          />

          <Input label="Slug" value={slug} onChange={setSlug} />

          <Input label="Emirate" value={emirate} onChange={setEmirate} />

          <Input label="Area" value={area} onChange={setArea} />

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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}