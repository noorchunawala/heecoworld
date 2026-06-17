"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle2, MessageCircle, Factory, Users, Mail, Phone } from "lucide-react";
import { supabase } from "@/lib/SupabaseClient";

export default function EnquiryModal() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    document.addEventListener("open-enquiry", handler);

    return () => document.removeEventListener("open-enquiry", handler);
  }, []);

  const onlyNumbers = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.replace(/\D/g, "");
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const data = {
      name: String(formData.get("fullName") ?? ""),
      institution: String(formData.get("institution") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      students: String(formData.get("students") ?? ""),
      preferredMonth: String(formData.get("preferredMonth") ?? ""),
      industry: String(formData.get("industry") ?? ""),
      message: String(formData.get("message") ?? ""),
    };

    const whatsappNumber = "971585377860";

    const whatsappMessage = `
New HeecoWorld Industrial Visit Enquiry

Name: ${data.name}
Institution: ${data.institution}
Phone: ${data.phone}
Email: ${data.email}
Students: ${data.students}
Preferred Month: ${data.preferredMonth}
Industry: ${data.industry}

Additional Details:
${data.message}
`;

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      whatsappMessage
    )}`;

    const { error } = await supabase.from("enquiries").insert([
      {
        full_name: data.name,
        institution: data.institution,
        phone: data.phone,
        email: data.email,
        students: data.students ? Number(data.students) : null,
        preferred_month: data.preferredMonth,
        industry: data.industry,
        message: data.message,
      },
    ]);

    setSubmitting(false);

    if (error) {
      console.error(error);
      alert("Failed to save enquiry");
      return;
    }

    window.open(url, "_blank");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl">
        <div className="grid max-h-[92vh] overflow-y-auto lg:max-h-none lg:overflow-visible lg:grid-cols-5">
          <div className="relative overflow-hidden bg-[#071B33] p-6 text-white md:p-8 lg:col-span-2">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(214,180,106,0.24),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_36%)]" />

            <div className="relative">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#D6B46A]">
                <Factory className="h-6 w-6" />
              </div>

              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D6B46A]">
                HeecoWorld Enquiry
              </p>

              <h2 className="mt-4 text-3xl font-semibold leading-tight">
                Plan an educational industrial visit.
              </h2>

              <p className="mt-5 text-sm leading-7 text-slate-300">
                Share your school requirement and we will help prepare a suitable
                real-world learning visit proposal for your institution.
              </p>

              <p className="mt-4 text-base leading-7 text-[#F5E6C8]" dir="rtl">
                رحلات تعليمية ميدانية تربط الطلاب بعالم الأعمال والصناعة
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Structured visit planning",
                  "Industry exposure focus",
                  "School-friendly coordination",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#D6B46A]" />
                    <span className="text-sm font-medium text-slate-100">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-10 rounded-2xl border border-white/10 bg-white/10 p-5">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-[#D6B46A]" />
                  <p className="font-semibold">WhatsApp-first response</p>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  After submission, WhatsApp will open with your enquiry details
                  ready to send.
                </p>
              </div>
            </div>
          </div>

          <div className="relative bg-[#F8F1E7] p-4 md:p-6 lg:col-span-3">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#071B33] shadow-sm transition hover:bg-[#FAF7F0]"
              aria-label="Close enquiry modal"
            >
              <X size={20} />
            </button>

           <div className="rounded-[1.5rem] bg-white p-4 shadow-sm md:p-6">
              <div className="mb-8 pr-12">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#B58A34]">
                  Visit requirement
                </p>

                <h3 className="mt-2 text-2xl font-semibold text-[#071B33]">
                  Tell us about your visit requirement
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Basic details are enough to start the proposal discussion.
                </p>
              </div>

             <form onSubmit={submit} className="space-y-3">
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    name="fullName"
                    required
                    placeholder="Full Name"
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#D6B46A] focus:bg-white"
                  />

                  <input
                    name="institution"
                    required
                    placeholder="School / College Name"
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#D6B46A] focus:bg-white"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B58A34]" />
                    <input
                      name="phone"
                      onChange={onlyNumbers}
                      required
                      placeholder="Phone Number"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#D6B46A] focus:bg-white"
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B58A34]" />
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="Email Address"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#D6B46A] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B58A34]" />
                    <input
                      name="students"
                      required
                      inputMode="numeric"
                      pattern="[0-9]+"
                      onChange={onlyNumbers}
                      placeholder="No. of Students"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#D6B46A] focus:bg-white"
                    />
                  </div>

                  <select
                    name="preferredMonth"
                    required
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#D6B46A] focus:bg-white"
                  >
                    <option value="">Preferred Month</option>
                    <option>January</option>
                    <option>February</option>
                    <option>March</option>
                    <option>April</option>
                    <option>May</option>
                    <option>June</option>
                    <option>July</option>
                    <option>August</option>
                    <option>September</option>
                    <option>October</option>
                    <option>November</option>
                    <option>December</option>
                  </select>

                  <select
                    name="industry"
                    required
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#D6B46A] focus:bg-white"
                  >
                    <option value="">Interested Industry</option>
                    <option>Aviation</option>
                    <option>Technology</option>
                    <option>Manufacturing</option>
                    <option>Healthcare</option>
                    <option>Logistics</option>
                    <option>Energy</option>
                    <option>Other</option>
                  </select>
                </div>

                <textarea
                  name="message"
                  placeholder="Additional details"
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#D6B46A] focus:bg-white"
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-[#071B33] py-4 font-semibold text-white transition hover:bg-[#0B2A4D] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Submitting..." : "Continue on WhatsApp"}
                </button>

                <p className="text-center text-xs text-slate-400">
                  HeecoWorld — UAE Education Marketplace
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}