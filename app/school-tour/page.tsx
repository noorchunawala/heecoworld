"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  School,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  getSchoolListings,
  type SchoolListing,
} from "@/lib/schoolListings";
import { supabase } from "@/lib/SupabaseClient";

type TourFormData = {
  parentName: string;
  mobile: string;
  email: string;
  childGrade: string;
  preferredDate: string;
  preferredTime: string;
  message: string;
};

const initialFormData: TourFormData = {
  parentName: "",
  mobile: "",
  email: "",
  childGrade: "",
  preferredDate: "",
  preferredTime: "Morning",
  message: "",
};

export default function SchoolTourPage() {
  const [schools, setSchools] = useState<SchoolListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [isPrefilledFromUrl, setIsPrefilledFromUrl] = useState(false);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [formData, setFormData] = useState<TourFormData>(initialFormData);
  const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const minVisitDate = tomorrow.toISOString().split("T")[0];
const [submitted, setSubmitted] = useState(false);
const [showSchoolPicker, setShowSchoolPicker] = useState(false);
const [schoolSearch, setSchoolSearch] = useState("");

  useEffect(() => {
    async function loadSchools() {
      const data = await getSchoolListings();
      setSchools(data);

      const params = new URLSearchParams(window.location.search);
      const schoolIdsParam = params.get("schoolIds") || params.get("schoolId");

      if (schoolIdsParam) {
        const ids = schoolIdsParam
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
          .slice(0, 3);

        const validIds = ids.filter((id) =>
          data.some((school) => school.id === id)
        );

        if (validIds.length > 0) {
          setSelectedSchoolIds(validIds);
          setIsPrefilledFromUrl(true);
        }
      }

      setLoading(false);
    }

    loadSchools();
  }, []);

  const selectedSchools = useMemo(() => {
    return selectedSchoolIds
      .map((id) => schools.find((school) => school.id === id))
      .filter((school): school is SchoolListing => Boolean(school));
  }, [schools, selectedSchoolIds]);

const filteredAvailableSchools = useMemo(() => {
  const query = schoolSearch.trim().toLowerCase();

  return schools
    .filter((school) => !selectedSchoolIds.includes(school.id))
    .filter((school) => {
      if (!query) return true;

      return [
        school.name,
        school.emirate,
        school.area,
        school.curricula?.join(" "),
        school.grades?.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .slice(0, 6);
}, [schools, selectedSchoolIds, schoolSearch]);


  const toggleSchool = (schoolId: string) => {
    setSelectedSchoolIds((current) => {
      if (current.includes(schoolId)) {
        return current.filter((id) => id !== schoolId);
      }

      if (current.length >= 3) {
        return current;
      }

      return [...current, schoolId];
    });
  };

  const updateFormField = (field: keyof TourFormData, value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage("");

   if (selectedSchools.length === 0) {
  alert("Please select at least one school.");
  return;
}

if (!formData.parentName.trim()) {
  alert("Please enter parent name.");
  return;
}

if (!formData.mobile.trim()) {
  alert("Please enter mobile number.");
  return;
}
const mobile = formData.mobile.replace(/\s/g, "").trim();

if (!/^(\+9715\d{8}|05\d{8})$/.test(mobile)) {
  alert("Please enter a valid UAE mobile number, e.g. +971501234567 or 0501234567.");
  return;
}

if (!formData.email.trim()) {
  alert("Please enter email address.");
  return;
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
  alert("Please enter a valid email address.");
  return;
}

if (!formData.childGrade.trim()) {
  alert("Please enter your child’s grade.");
  return;
}
if (!formData.preferredDate) {
  alert("Please select preferred visit date.");
  return;
}
if (formData.preferredDate < minVisitDate) {
  alert("Preferred visit date should be from tomorrow onwards.");
  return;
}

    setSubmitting(true);

    const payload = {
      school_ids: selectedSchools.map((school) => school.id),
      school_names: selectedSchools.map((school) => school.name),
      parent_name: formData.parentName.trim(),
      mobile: formData.mobile.trim(),
      email: formData.email.trim() || null,
      child_grade: formData.childGrade.trim() || null,
      preferred_date: formData.preferredDate || null,
      preferred_time: formData.preferredTime,
      message: formData.message.trim() || null,
      status: "new",
      otp_verified: false,
    };

   const response = await fetch("/api/book-tour", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const result = await response.json();

setSubmitting(false);

if (!result.success) {
  alert("Could not submit tour request.");
  return;
}

setSubmitted(true);
setSuccessMessage(
  "Your tour request has been successfully submitted."
);
setFormData(initialFormData);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F1E7]">
        <section className="relative overflow-hidden bg-[#071B33] px-4 py-16 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-7xl">
            <p className="text-sm font-medium text-slate-300">
              Loading tour request form...
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F1E7]">
      <section className="relative overflow-hidden bg-[#071B33] px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(214,180,106,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_34%)]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-sm font-medium text-[#F5E6C8] backdrop-blur">
              <CalendarDays className="h-4 w-4" />
              School Tour Request
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Book tours for your shortlisted schools.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Select up to 3 schools, share your preferred date and time, and
              request school tours from one simple form.
            </p>

            <p className="mt-4 text-xl leading-8 text-[#F5E6C8]" dir="rtl">
              احجز زيارات للمدارس المختارة لاختيار الأنسب لطفلك
            </p>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="-mt-20 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-2xl shadow-[#071B33]/10 backdrop-blur">
            <div className="rounded-[1.5rem] bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#B58A34]">
                  Parent details
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#071B33]">
                  Request tours for selected schools
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Select up to 3 schools. Final tour confirmation will depend on
                  each school’s availability.
                </p>
              </div>

              {successMessage && (
                <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  {successMessage}
                </div>
              )}
{submitted ? (
  <div className="rounded-[1.5rem] border border-green-200 bg-green-50 p-6 text-center">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
      <CheckCircle2 className="h-8 w-8 text-green-700" />
    </div>

    <h3 className="mt-4 text-2xl font-semibold text-[#071B33]">
      Tour request submitted
    </h3>

    <p className="mt-3 text-sm leading-6 text-slate-700">
      Your selected school(s) have been notified and will contact you directly
      using the details you provided.
    </p>

    <p className="mt-3 text-sm leading-6 text-slate-600">
      If you do not hear back within 3 working days, please contact us at{" "}
      <span className="font-semibold text-[#071B33]">
        info@scoolyx.com
      </span>.
    </p>

    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
  <Link
    href="/schools"
    className="rounded-full bg-[#071B33] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0B2A4D]"
  >
    Explore More Schools
  </Link>

  <Link
    href="/"
    className="rounded-full border border-[#071B33]/15 px-6 py-3 text-sm font-semibold text-[#071B33] hover:bg-white"
  >
    Back to Home
  </Link>
</div>
  </div>
) : (
  <form className="grid gap-5" onSubmit={handleSubmit}>
    <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label className="block text-sm font-semibold text-[#071B33]">
                      Selected schools
                    </label>

                    <span className="rounded-full bg-[#F8F1E7] px-3 py-1 text-xs font-semibold text-[#071B33]">
                      {selectedSchools.length}/3 selected
                    </span>
                  </div>

                 <div className="rounded-2xl border border-[#D6B46A]/40 bg-[#FFFBF3] p-4">
  <div className="flex flex-wrap gap-3">
    {selectedSchools.map((school) => (
      <div
        key={school.id}
        className="inline-flex items-center gap-2 rounded-full bg-[#071B33] px-4 py-2 text-sm font-semibold text-white"
      >
        <span>✓ {school.name}</span>

        <button
          type="button"
          onClick={() =>
            setSelectedSchoolIds((current) =>
              current.filter((id) => id !== school.id)
            )
          }
          className="rounded-full bg-white/10 p-1 transition hover:bg-white/20"
          aria-label={`Remove ${school.name}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    ))}
  </div>

  {selectedSchools.length < 3 && (
    <div className="mt-4">
      {!showSchoolPicker ? (
        <button
          type="button"
          onClick={() => setShowSchoolPicker(true)}
          className="rounded-full border border-[#071B33]/15 bg-white px-4 py-2 text-sm font-semibold text-[#071B33] hover:bg-[#F8F1E7]"
        >
          + Add another school
        </button>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <input
            value={schoolSearch}
            onChange={(event) => setSchoolSearch(event.target.value)}
            placeholder="Search school name, emirate, curriculum or grades..."
            className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#D6B46A] focus:bg-white"
          />

          <div className="mt-3 grid gap-2">
            {filteredAvailableSchools.map((school) => (
              <button
                key={school.id}
                type="button"
                onClick={() => {
                  setSelectedSchoolIds((current) => [...current, school.id]);
                  setSchoolSearch("");
                  setShowSchoolPicker(false);
                }}
                className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#071B33] hover:bg-[#F8F1E7]"
              >
                {school.name}
                <span className="ml-2 text-xs font-medium text-slate-500">
                  {[school.area, school.emirate].filter(Boolean).join(", ")}
                </span>
              </button>
            ))}

            {filteredAvailableSchools.length === 0 && (
              <p className="px-2 py-2 text-sm text-slate-500">
                No schools found.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setShowSchoolPicker(false);
              setSchoolSearch("");
            }}
            className="mt-3 text-sm font-semibold text-slate-500 hover:text-[#071B33]"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )}

  <p className="mt-4 text-sm leading-6 text-slate-600">
    You can request tours for up to 3 schools. Final confirmation depends on each school’s availability.
  </p>
</div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    label="Parent name"
                    icon={<User className="h-4 w-4" />}
                    placeholder="Enter your full name"
                    value={formData.parentName}
                    onChange={(value) => updateFormField("parentName", value)}
                    required
                  />

                  <FormField
                    label="Mobile number"
                    icon={<Phone className="h-4 w-4" />}
                    placeholder="+971 5x xxx xxxx"
                    value={formData.mobile}
                    onChange={(value) => updateFormField("mobile", value)}
                    required
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    label="Email address"
                    type="email"
                    icon={<Mail className="h-4 w-4" />}
                    placeholder="you@example.com"
                    value={formData.email}
                    required
                    onChange={(value) => updateFormField("email", value)}
                  />

                  <FormField
                    label="Child grade"
                    icon={<School className="h-4 w-4" />}
                    placeholder="Example: Year 3 / Grade 2"
                    value={formData.childGrade}
                    required
                    onChange={(value) => updateFormField("childGrade", value)}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    label="Preferred date"
                    type="date"
                    icon={<CalendarDays className="h-4 w-4" />}
                    value={formData.preferredDate}
                    min={minVisitDate}
                    onChange={(value) =>
                      updateFormField("preferredDate", value)
                    }
                  />

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#071B33]">
                      Preferred time
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B58A34]" />
                      <select
                        value={formData.preferredTime}
                        onChange={(event) =>
                          updateFormField("preferredTime", event.target.value)
                        }
                        className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#D6B46A] focus:bg-white"
                      >
                        <option>Morning</option>
                        <option>Afternoon</option>
                        <option>Any available time</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#071B33]">
                    Message
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-4 h-4 w-4 text-[#B58A34]" />
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(event) =>
                        updateFormField("message", event.target.value)
                      }
                      placeholder="Any preference or note for the selected schools..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#D6B46A] focus:bg-white"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 h-12 rounded-full bg-[#071B33] text-white hover:bg-[#0B2A4D] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Submitting..." : "Submit Tour Request"}
                </Button>
  </form>
)}
              
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-2xl shadow-[#071B33]/10 backdrop-blur lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[1.5rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#B58A34]">
                Selected shortlist
              </p>

              <h3 className="mt-3 text-2xl font-semibold text-[#071B33]">
                {selectedSchools.length} school
                {selectedSchools.length === 1 ? "" : "s"} selected
              </h3>

              <div className="mt-5 space-y-4">
                {selectedSchools.length === 0 ? (
                  <div className="rounded-2xl bg-[#F8F1E7] p-5 text-sm text-slate-600">
                    Select at least one school to request a tour.
                  </div>
                ) : (
                  selectedSchools.map((school) => {
                    const address =
                      school.address ||
                      [school.area, school.emirate].filter(Boolean).join(", ");

                    const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(
                      address || school.name
                    )}&output=embed`;

                    return (
                      <div
                        key={school.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-semibold text-[#071B33]">
                              {school.name}
                            </h4>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {school.emirate && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#F8F1E7] px-3 py-1.5 text-xs font-semibold text-[#071B33]">
                                  <MapPin className="h-3.5 w-3.5 text-[#B58A34]" />
                                  {school.emirate}
                                </span>
                              )}

                              {school.curricula.map((curriculum) => (
                                <span
                                  key={curriculum}
                                  className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                                >
                                  {curriculum}
                                </span>
                              ))}
                            </div>
                          </div>

                          <CheckCircle2 className="h-5 w-5 shrink-0 text-[#B58A34]" />
                        </div>

                        <div className="mt-4 rounded-xl bg-[#071B33] p-3 text-white">
                          <p className="text-xs text-slate-300">Fee range</p>
                          <p className="mt-1 text-sm font-semibold text-[#D6B46A]">
                            {school.feeRange.min && school.feeRange.max
                              ? `AED ${school.feeRange.min.toLocaleString()} - AED ${school.feeRange.max.toLocaleString()}`
                              : "Not added"}
                          </p>
                        </div>

                        {address && (
                          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                            <iframe
                              title={`${school.name} location`}
                              src={mapUrl}
                              className="h-44 w-full"
                              loading="lazy"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-600">
                Your request will be shared only with the schools you selected.
              </p>

              <div className="mt-5">
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-full border-[#D6B46A]/60 text-[#071B33] hover:bg-[#F8F1E7]"
                >
                  <Link href="/schools">Browse more schools</Link>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function FormField({
  label,
  icon,
  placeholder,
  type = "text",
  value,
  onChange,
  required = false,
  min
}: {
  label: string;
  icon: React.ReactNode;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  min?:string
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
           min={min}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#D6B46A] focus:bg-white"
        />
      </div>
    </div>
  );
}