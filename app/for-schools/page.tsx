"use client";

import { useState } from "react";
import { CheckCircle2, Mail, School, User, Phone, MapPin } from "lucide-react";

const initialForm = {
  schoolName: "",
  contactPerson: "",
  email: "",
  phone: "",
  role: "",
  emirate: "",
  message: "",
};

export default function ForSchoolsPage() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.schoolName.trim()) return alert("Please enter school name.");
    if (!form.contactPerson.trim()) return alert("Please enter contact person.");
    if (!form.email.trim()) return alert("Please enter email address.");

    setSubmitting(true);

    const response = await fetch("/api/school-partner-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const result = await response.json();
    setSubmitting(false);

    if (!result.success) {
      alert("Could not submit request.");
      return;
    }

    setSubmitted(true);
    setForm(initialForm);
  }

  return (
    <main className="min-h-screen bg-[#F8F1E7]">
      <section className="relative overflow-hidden bg-[#071B33] px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(214,180,106,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_34%)]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-sm font-medium text-[#F5E6C8]">
              Partner with HeecoWorld
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Grow your school visibility with HeecoWorld.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Showcase your school, receive qualified parent enquiries and
              connect with families actively searching for education options in
              the UAE.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="space-y-5">
          {[
            "Dedicated school profile",
            "Qualified parent enquiries",
            "School tour requests",
            "Visibility in Heeco Match™",
            "Founding partner opportunities",
          ].map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#B58A34]" />
                <p className="font-semibold text-[#071B33]">{item}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-xl">
          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm sm:p-8">
            {submitted ? (
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-8 w-8 text-green-700" />
                </div>

                <h2 className="mt-4 text-2xl font-semibold text-[#071B33]">
                  Partnership request received
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Thank you. Our team will review your request and contact you
                  shortly.
                </p>

                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 rounded-full bg-[#071B33] px-6 py-3 text-sm font-semibold text-white"
                >
                  Submit another request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-5">
                <h2 className="text-2xl font-semibold text-[#071B33]">
                  Request partnership
                </h2>

                <Input
                  label="School name"
                  icon={<School className="h-4 w-4" />}
                  value={form.schoolName}
                  onChange={(v) => updateField("schoolName", v)}
                />

                <Input
                  label="Contact person"
                  icon={<User className="h-4 w-4" />}
                  value={form.contactPerson}
                  onChange={(v) => updateField("contactPerson", v)}
                />

                <Input
                  label="Email address"
                  type="email"
                  icon={<Mail className="h-4 w-4" />}
                  value={form.email}
                  onChange={(v) => updateField("email", v)}
                />

                <Input
                  label="Phone"
                  icon={<Phone className="h-4 w-4" />}
                  value={form.phone}
                  onChange={(v) => updateField("phone", v)}
                />

                <Input
                  label="Your role"
                  placeholder="Admissions Manager / Principal / Marketing"
                  icon={<User className="h-4 w-4" />}
                  value={form.role}
                  onChange={(v) => updateField("role", v)}
                />

                <Input
                  label="Emirate"
                  icon={<MapPin className="h-4 w-4" />}
                  value={form.emirate}
                  onChange={(v) => updateField("emirate", v)}
                />

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#071B33]">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => updateField("message", e.target.value)}
                    placeholder="Tell us about your school and what you would like to achieve with HeecoWorld."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#D6B46A] focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-[#071B33] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Partnership Request"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Input({
  label,
  icon,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#071B33]">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B58A34]">
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#D6B46A] focus:bg-white"
        />
      </div>
    </div>
  );
}