"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/SupabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  School,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";

type UserType = "parent" | "student";

type SchoolOption = {
  id: string;
  name: string;
  emirate: string | null;
  area: string | null;
};

type CurriculumLevelOption = {
  id: string;
  code: string;
  displayName: string;
  sortOrder: number;
};

type CurriculumOption = {
  id: string;
  code: string;
  displayName: string;
  levels: CurriculumLevelOption[];
};

type SchoolCurriculumOptionsResponse = {
  curricula?: CurriculumOption[];
  message?: string | null;
  error?: string;
};

export default function CompleteProfilePage() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();

  const redirectTo = params.get("redirectTo") || "/my-learning";

  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [userType, setUserType] = useState<UserType>("parent");

  const [learnerFullName, setLearnerFullName] = useState("");
  const [schoolListingId, setSchoolListingId] = useState("");

  const [curriculumId, setCurriculumId] = useState("");
  const [curriculumLevelId, setCurriculumLevelId] = useState("");
  const [curricula, setCurricula] = useState<CurriculumOption[]>([]);
  const [loadingCurricula, setLoadingCurricula] = useState(false);
  const [curriculumMessage, setCurriculumMessage] = useState("");

  const [section, setSection] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [schoolRegisteredEmail, setSchoolRegisteredEmail] = useState("");

  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [showSchoolOptions, setShowSchoolOptions] = useState(false);

  const [termsAccepted, setTermsAccepted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPage() {
      try {
        const [{ data: userData }, schoolResult] = await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from("listings")
            .select("id, name, emirate, area")
            .eq("type", "school")
            .eq("status", "active")
            .order("name", { ascending: true }),
        ]);

        if (!userData.user) {
          router.replace(
            `/login?redirectTo=${encodeURIComponent(redirectTo)}`
          );
          return;
        }

        if (schoolResult.error) {
          alert("Could not load schools. Please refresh and try again.");
          return;
        }

        setSchools((schoolResult.data || []) as SchoolOption[]);
      } catch {
        alert("Could not load profile options. Please refresh and try again.");
      } finally {
        setLoadingSchools(false);
        setLoading(false);
      }
    }

    loadPage();
  }, [redirectTo, router]);

  function handleUserTypeChange(nextUserType: UserType) {
    setUserType(nextUserType);

    if (nextUserType === "student" && !learnerFullName.trim()) {
      setLearnerFullName(fullName);
    }
  }

  function clearCurriculumSelection() {
    setCurriculumId("");
    setCurriculumLevelId("");
    setCurricula([]);
    setCurriculumMessage("");
    setLoadingCurricula(false);
  }

  async function loadSchoolCurriculumOptions(nextSchoolId: string) {
    try {
      setLoadingCurricula(true);
      setCurriculumId("");
      setCurriculumLevelId("");
      setCurricula([]);
      setCurriculumMessage("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.replace(
          `/login?redirectTo=${encodeURIComponent(redirectTo)}`
        );
        return;
      }

      const response = await fetch(
        `/api/learner-profiles/school-curriculum-options?schoolId=${encodeURIComponent(
          nextSchoolId
        )}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const payload = (await response
        .json()
        .catch(() => ({}))) as SchoolCurriculumOptionsResponse;

      if (!response.ok) {
        throw new Error(
          payload.error ||
            "Could not load assessment curriculum options for this school."
        );
      }

      const nextCurricula = payload.curricula || [];

      setCurricula(nextCurricula);
      setCurriculumMessage(payload.message || "");
    } catch (error) {
      setCurriculumMessage(
        error instanceof Error
          ? error.message
          : "Could not load assessment curriculum options for this school."
      );
    } finally {
      setLoadingCurricula(false);
    }
  }

  async function saveProfile() {
    if (!fullName.trim()) {
      alert("Please enter your full name.");
      return;
    }

    if (!mobile.trim()) {
      alert("Please enter your mobile number.");
      return;
    }

    if (!learnerFullName.trim()) {
      alert(
        userType === "parent"
          ? "Please enter your child's full name."
          : "Please enter your full name."
      );
      return;
    }

    if (!schoolListingId) {
      alert("Please select a school.");
      return;
    }

    if (loadingCurricula) {
      alert("Please wait while we load this school's curriculum options.");
      return;
    }

    if (!curriculumId) {
      alert("Please select the learner's curriculum.");
      return;
    }

    if (!curriculumLevelId) {
      alert("Please select the learner's academic level.");
      return;
    }

    if (!termsAccepted) {
      alert("Please accept the Terms and Privacy Policy to continue.");
      return;
    }

    setSaving(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        router.replace(
          `/login?redirectTo=${encodeURIComponent(redirectTo)}`
        );
        return;
      }

      const response = await fetch("/api/learner-profiles/onboarding", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          mobile: mobile.trim(),
          userType,
          learnerFullName: learnerFullName.trim(),
          schoolListingId,
          curriculumId,
          curriculumLevelId,
          section: section.trim(),
          academicYear: academicYear.trim(),
          schoolRegisteredEmail: schoolRegisteredEmail.trim(),
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error || "Could not complete your profile. Please try again."
        );
      }

      await refresh();
      router.replace(redirectTo);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not complete your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredSchools = schools.filter((school) => {
    const search = schoolSearch.trim().toLowerCase();

    if (!search) return true;

    return [school.name, school.emirate || "", school.area || ""]
      .join(" ")
      .toLowerCase()
      .includes(search);
  });

  const selectedCurriculum = curricula.find(
    (curriculum) => curriculum.id === curriculumId
  );

  const availableLevels = selectedCurriculum?.levels || [];

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F6FF] px-4 py-16">
        <div className="rounded-3xl border border-slate-100 bg-white px-8 py-10 text-center shadow-xl shadow-violet-500/5">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#5B3DF5]" />
          <p className="mt-4 text-sm font-bold text-slate-600">
            Loading your setup...
          </p>
        </div>
      </main>
    );
  }

  const learnerLabel =
    userType === "parent" ? "Your child's details" : "Your learning details";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F7F6FF] px-4 py-10 text-[#111135] md:py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(91,61,245,0.16),transparent_30%),radial-gradient(circle_at_88%_32%,rgba(245,158,11,0.12),transparent_32%)]" />

      <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <aside className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-2xl shadow-violet-500/10 backdrop-blur lg:sticky lg:top-24">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#111135] text-xl font-black text-white">
            S
          </div>

          <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-[#5B3DF5]">
            Welcome to Scoolyx
          </p>

          <h1 className="mt-3 text-4xl font-black leading-tight tracking-[-0.04em]">
            Let&apos;s get your account ready.
          </h1>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            We&apos;ll use these details to personalize assessments, progress
            tracking and learner content.
          </p>

          <div className="mt-8 space-y-4">
            {[
              "Create your learning profile",
              "Add your first learner",
              "Connect school and curriculum",
              "Start practicing",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#5B3DF5]" />
                <p className="text-sm font-semibold text-slate-700">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-3xl bg-[#F7F6FF] p-5">
            <div className="flex gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-[#5B3DF5]" />
              <p className="text-sm leading-6 text-slate-600">
                Your information helps Scoolyx show the right curriculum and
                assessment options.
              </p>
            </div>
          </div>
        </aside>

        <section className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-2xl shadow-violet-500/10 backdrop-blur md:p-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#5B3DF5]">
              Account Setup
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#111135]">
              Personal details
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Start with your details, then add the learner&apos;s school and
              curriculum information.
            </p>
          </div>

          <div className="mt-7 space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="Full name"
                icon={<User className="h-4 w-4" />}
                value={fullName}
                onChange={(value) => {
                  setFullName(value);

                  if (userType === "student" && !learnerFullName.trim()) {
                    setLearnerFullName(value);
                  }
                }}
                placeholder="Enter your name"
              />

              <Input
                label="Mobile number"
                icon={<Phone className="h-4 w-4" />}
                value={mobile}
                onChange={setMobile}
                placeholder="0501234567"
                inputMode="tel"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#111135]">
                I am registering as
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    value: "parent",
                    title: "Parent / Guardian",
                    text: "I want to manage learning for my child.",
                  },
                  {
                    value: "student",
                    title: "Student",
                    text: "I want to track my own learning.",
                  },
                ].map((item) => {
                  const selected = userType === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => handleUserTypeChange(item.value as UserType)}
                      className={`rounded-3xl border p-4 text-left transition ${
                        selected
                          ? "border-[#5B3DF5] bg-[#F7F6FF] shadow-sm"
                          : "border-slate-200 bg-white hover:bg-[#F7F6FF]"
                      }`}
                    >
                      <p className="font-black text-[#111135]">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {item.text}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F1EEFF] text-[#5B3DF5]">
                  <GraduationCap className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-[#111135]">
                    {learnerLabel}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {userType === "parent"
                      ? "You can add another child later from your learner dashboard."
                      : "Your school, curriculum and academic level will be used to show relevant assessments."}
                  </p>
                </div>
              </div>
            </div>

            <Input
              label={userType === "parent" ? "Child's full name" : "Student full name"}
              icon={<User className="h-4 w-4" />}
              value={learnerFullName}
              onChange={setLearnerFullName}
              placeholder={
                userType === "parent"
                  ? "Enter your child's name"
                  : "Enter your name"
              }
            />

            <div>
              <label className="mb-2 block text-sm font-bold text-[#111135]">
                School
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={schoolSearch}
                  onFocus={() => setShowSchoolOptions(true)}
                  onChange={(event) => {
                    setSchoolSearch(event.target.value);
                    setSchoolListingId("");
                    clearCurriculumSelection();
                    setShowSchoolOptions(true);
                  }}
                  onBlur={() => {
                    window.setTimeout(() => {
                      setShowSchoolOptions(false);
                    }, 150);
                  }}
                  placeholder="Start typing your school name..."
                  disabled={loadingSchools}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-[#111135] outline-none transition placeholder:text-slate-400 focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
                />

                {showSchoolOptions && !loadingSchools && (
                  <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    {filteredSchools.slice(0, 12).map((school) => {
                      const location = [school.area, school.emirate]
                        .filter(Boolean)
                        .join(", ");

                      return (
                        <button
                          key={school.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setSchoolListingId(school.id);
                            setSchoolSearch(
                              location
                                ? `${school.name} — ${location}`
                                : school.name
                            );
                            setShowSchoolOptions(false);

                            void loadSchoolCurriculumOptions(school.id);
                          }}
                          className="w-full rounded-xl px-3 py-3 text-left transition hover:bg-[#F7F6FF]"
                        >
                          <p className="text-sm font-black text-[#111135]">
                            {school.name}
                          </p>

                          {location && (
                            <p className="mt-1 text-xs text-slate-500">
                              {location}
                            </p>
                          )}
                        </button>
                      );
                    })}

                    {filteredSchools.length === 0 && (
                      <p className="px-3 py-4 text-sm text-slate-500">
                        No matching school found.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {schoolListingId && (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSchoolListingId("");
                      setSchoolSearch("");
                      clearCurriculumSelection();
                      setShowSchoolOptions(true);
                    }}
                    className="text-xs font-black text-[#5B3DF5] transition hover:text-[#111135]"
                  >
                    Change school
                  </button>
                </div>
              )}

              <p className="mt-2 text-xs text-slate-500">
                Start typing to find and select the learner&apos;s school.
              </p>

              {schoolListingId && loadingCurricula && (
                <p className="mt-2 text-xs font-bold text-[#5B3DF5]">
                  Loading this school&apos;s curriculum options...
                </p>
              )}

              {schoolListingId && !loadingCurricula && curriculumMessage && (
                <p className="mt-2 text-xs font-bold text-red-600">
                  {curriculumMessage}
                </p>
              )}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Select
                label="Curriculum"
                value={curriculumId}
                onChange={(value) => {
                  setCurriculumId(value);
                  setCurriculumLevelId("");
                }}
                disabled={
                  !schoolListingId ||
                  loadingCurricula ||
                  curricula.length === 0
                }
              >
                <option value="">
                  {!schoolListingId
                    ? "Select school first"
                    : loadingCurricula
                      ? "Loading curricula..."
                      : curricula.length === 0
                        ? "No curriculum available"
                        : "Select curriculum"}
                </option>

                {curricula.map((curriculum) => (
                  <option key={curriculum.id} value={curriculum.id}>
                    {curriculum.displayName}
                  </option>
                ))}
              </Select>

              <Select
                label="Academic level"
                value={curriculumLevelId}
                onChange={setCurriculumLevelId}
                disabled={!curriculumId || loadingCurricula}
              >
                <option value="">
                  {!curriculumId
                    ? "Select curriculum first"
                    : "Select academic level"}
                </option>

                {availableLevels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.displayName}
                  </option>
                ))}
              </Select>

              <Input
                label="Section"
                optional
                value={section}
                onChange={setSection}
                placeholder="For example, 10A"
              />

              <Input
                label="Academic year"
                optional
                value={academicYear}
                onChange={setAcademicYear}
                placeholder="For example, 2026–2027"
              />
            </div>

            <Input
              label="Email registered with the school"
              optional
              icon={<Mail className="h-4 w-4" />}
              type="email"
              value={schoolRegisteredEmail}
              onChange={setSchoolRegisteredEmail}
              placeholder="Use the parent or student email known to the school"
              helper="This is used only for future school verification. It does not verify school membership yet."
            />

            <label className="flex cursor-pointer items-start gap-3 rounded-3xl border border-slate-100 bg-[#F7F6FF] p-4">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 accent-[#5B3DF5]"
              />

              <span className="text-sm leading-6 text-slate-600">
                I agree to Scoolyx&apos;s{" "}
                <Link href="/terms" className="font-black text-[#5B3DF5]">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-black text-[#5B3DF5]">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <button
              onClick={saveProfile}
              disabled={
                saving ||
                loadingSchools ||
                loadingCurricula ||
                !termsAccepted ||
                (Boolean(schoolListingId) && curricula.length === 0)
              }
              className="flex w-full items-center justify-center rounded-full bg-[#111135] px-5 py-3 text-sm font-black text-white transition hover:bg-[#1D1B4F] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Continue to Scoolyx"}
              {!saving && <ArrowRight className="ml-2 h-4 w-4" />}
            </button>
          </div>
        </section>
      </div>
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
  inputMode,
  optional,
  helper,
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  optional?: boolean;
  helper?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#111135]">
        {label}{" "}
        {optional && <span className="font-medium text-slate-400">(optional)</span>}
      </label>

      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5B3DF5]">
            {icon}
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          className={`w-full rounded-2xl border border-slate-200 bg-white py-3 pr-4 text-sm font-semibold text-[#111135] outline-none transition placeholder:text-slate-400 focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100 ${
            icon ? "pl-11" : "pl-4"
          }`}
        />
      </div>

      {helper && (
        <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  disabled,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#111135]">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#111135] outline-none transition focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100 disabled:text-slate-400"
      >
        {children}
      </select>
    </div>
  );
}