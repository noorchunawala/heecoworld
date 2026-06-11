"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle2, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/SupabaseClient";

export default function EnquiryModal() {
  const [open, setOpen] = useState(false);

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

    const form = e.currentTarget;

    const data = {
      name: form.fullName.value,
      institution: form.institution.value,
      phone: form.phone.value,
      email: form.email.value,
      students: form.students.value,
      preferredMonth: form.preferredMonth.value,
      industry: form.industry.value,
      message: form.message.value,
    };

    const whatsappNumber = "971585377860";

    const whatsappMessage = `
New HeecoWorld Enquiry

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

    const { error } = await supabase
  .from("enquiries")
  .insert([
    {
      full_name: data.name,
      institution: data.institution,
      phone: data.phone,
      email: data.email,
      students: data.students
        ? Number(data.students)
        : null,
      preferred_month: data.preferredMonth,
      industry: data.industry,
      message: data.message,
    },
  ]);

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
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="grid lg:grid-cols-5">
          
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-cyan-500 text-white p-8 md:p-10">
            <p className="text-blue-100 text-sm font-medium">
              HeecoWorld Enquiry
            </p>

            <h2 className="text-3xl font-bold mt-4 leading-tight">
              Plan an educational industry visit
            </h2>

            <p className="mt-5 text-blue-50 leading-7">
              Share your requirement and we will help prepare a suitable visit proposal for your institution.
            </p>

            <div className="mt-8 space-y-5">
              {[
                "Custom visit planning",
                "Industry exposure focus",
                "School-friendly coordination",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 size={20} />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl bg-white/15 p-5">
              <div className="flex items-center gap-3">
                <MessageCircle size={22} />
                <p className="font-semibold">WhatsApp-first response</p>
              </div>

              <p className="mt-3 text-sm text-blue-50 leading-6">
                After submission, WhatsApp will open with your enquiry details ready to send.
              </p>
            </div>
          </div>

          <div className="lg:col-span-3 p-6 md:p-10 relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-5 right-5 h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center"
            >
              <X size={20} />
            </button>

            <div className="pr-12 mb-8">
              <h3 className="text-2xl font-bold">
                Tell us about your visit requirement
              </h3>

              <p className="mt-2 text-slate-500 text-sm">
                Basic details are enough to start the proposal discussion.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input name="fullName" required placeholder="Full Name" className="border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
                <input name="institution" required placeholder="School / College Name" className="border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <input name="phone"  onChange={onlyNumbers} required placeholder="Phone Number" className="border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
                <input
  name="email"
  type="email"
  required
  placeholder="Email Address"
  className="border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
/>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <input
  name="students"
  required
  inputMode="numeric"
  pattern="[0-9]+"
  onChange={onlyNumbers}
  placeholder="No. of Students"
  className="border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
/>
                <select
  name="preferredMonth"
  required
  className="border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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

                <select name="industry" required className="border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white">
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
                rows={4}
                className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold transition"
              >
                Continue on WhatsApp
              </button>

              <p className="text-xs text-center text-slate-400">
                Heeco — Hub of Experiential Education & Corporate Outreach
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}