"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  GraduationCap,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  School,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

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
    if (!form.phone.trim()) return alert("Please enter phone number.");

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
    <main className="min-h-screen bg-[#F7F6FF] text-[#111135]">
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(91,61,245,0.16),transparent_30%),radial-gradient(circle_at_88%_32%,rgba(245,158,11,0.12),transparent_32%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
           

            <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-[-0.045em] sm:text-6xl">
              Modern assessment platform for schools.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Manage assessments, track learner progress, support teachers and
              understand parent engagement from one secure school portal.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/school-access"
                className="inline-flex h-13 items-center justify-center rounded-full bg-[#111135] px-7 text-sm font-black text-white transition hover:bg-[#1D1B4F]"
              >
                School Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <a
                href="#partner-request"
                className="inline-flex h-13 items-center justify-center rounded-full border border-slate-200 bg-white px-7 text-sm font-black text-[#111135] transition hover:bg-[#F7F6FF]"
              >
                Request a Demo
              </a>
            </div>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                ["Assessments", GraduationCap],
                ["Analytics", BarChart3],
                ["Parent Reach", Sparkles],
              ].map(([label, Icon]: any) => (
                <div
                  key={label}
                  className="rounded-3xl bg-white/85 p-5 shadow-lg shadow-violet-500/5 backdrop-blur"
                >
                  <Icon className="h-6 w-6 text-[#5B3DF5]" />
                  <p className="mt-4 text-sm font-black text-[#111135]">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-2xl shadow-violet-500/10 backdrop-blur">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111135] text-white">
              <LockKeyhole className="h-5 w-5" />
            </div>

            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#5B3DF5]">
              Already using Scoolyx?
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em]">
              Open your school portal.
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              School admins and teachers can sign in with their invited school
              email address.
            </p>

            <div className="mt-6 grid gap-4">
              {[
                "Secure school email login",
                "Teacher assessment dashboard",
                "School analytics and overview",
                "Teacher and admin access management",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#5B3DF5]" />
                  <p className="text-sm font-semibold leading-6 text-slate-700">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/school-access"
              className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[#111135] px-6 py-3 text-sm font-black text-white transition hover:bg-[#1D1B4F]"
            >
              Login to School Portal
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>

            <div className="mt-6 rounded-3xl bg-[#F7F6FF] p-5">
              <div className="flex gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-[#5B3DF5]" />
                <p className="text-sm leading-6 text-slate-600">
                  School access is verified before portal activation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-24 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div className="space-y-5">
          {[
            "Dedicated school profile",
            "Qualified parent enquiries",
            "School tour interest",
            "Visibility in Scoolyx Match",
            "Teacher assessment tools",
            "School analytics dashboard",
          ].map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-slate-100 bg-white p-5 shadow-lg shadow-violet-500/5"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#5B3DF5]" />
                <p className="font-black text-[#111135]">{item}</p>
              </div>
            </div>
          ))}
        </div>

        <div
          id="partner-request"
          className="rounded-[2rem] border border-white/80 bg-white/90 p-4 shadow-2xl shadow-violet-500/10 backdrop-blur"
        >
          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm sm:p-8">
            {submitted ? (
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100">
                  <CheckCircle2 className="h-8 w-8 text-emerald-700" />
                </div>

                <h2 className="mt-5 text-3xl font-black tracking-[-0.03em] text-[#111135]">
                  Partnership request received
                </h2>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
                  Thank you. Our team will review your request and contact you
                  shortly.
                </p>

                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-7 rounded-full bg-[#111135] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1D1B4F]"
                >
                  Submit another request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-5">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-[#5B3DF5]">
                    Partner Request
                  </p>

                  <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#111135]">
                    Request school access
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Share your details and we&apos;ll contact you about Scoolyx
                    school portal access.
                  </p>
                </div>

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
                  <label className="mb-2 block text-sm font-bold text-[#111135]">
                    Message
                  </label>

                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => updateField("message", e.target.value)}
                    placeholder="Tell us about your school and what you would like to achieve with Scoolyx."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#111135] outline-none transition placeholder:text-slate-400 focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-[#111135] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1D1B4F] disabled:opacity-60"
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
      <label className="mb-2 block text-sm font-bold text-[#111135]">
        {label}
      </label>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5B3DF5]">
          {icon}
        </div>

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-[#111135] outline-none transition placeholder:text-slate-400 focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100"
        />
      </div>
    </div>
  );
}