"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  Heart,
  CalendarDays,
  User,
  LogOut,
  MessageCircle,
  ChevronDown,
  BookOpen,
  Users,
  ClipboardList,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/SupabaseClient";
import { getFavoriteSchoolIds } from "@/lib/favorites";
import { getSchoolListings, type SchoolListing } from "@/lib/schoolListings";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Section =
  | "learning"
  | "learners"
  | "assessments"
  | "saved"
  | "tours"
  | "profile"
  | "contact"
  | null;

export default function AccountPanel({ open, onClose }: Props) {
  const router = useRouter();
  const { profile, refresh } = useAuth();

  const [activeSection, setActiveSection] = useState<Section>("learning");
  const [savedSchools, setSavedSchools] = useState<SchoolListing[]>([]);
  const [tourRequests, setTourRequests] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !profile) return;

    async function loadAccountData() {
      const allSchools = await getSchoolListings();

      const favoriteIds = await getFavoriteSchoolIds(profile!.id);
      setSavedSchools(
        allSchools.filter((school) => favoriteIds.includes(school.id))
      );

      const { data } = await supabase
        .from("tour_requests")
        .select("*")
        .eq("email", profile!.email)
        .order("created_at", { ascending: false });

      setTourRequests(data || []);
    }

    loadAccountData();
  }, [open, profile]);

  if (!open || !mounted) return null;

  const logout = async () => {
    await supabase.auth.signOut();
    await refresh();
    onClose();
    router.push("/");
  };

  const toggleSection = (section: Section) => {
    setActiveSection((current) => (current === section ? null : section));
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999]">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close account panel"
        className="absolute inset-0 bg-[#111135]/70 backdrop-blur-sm"
      />

      <aside className="absolute bottom-0 right-0 top-0 z-[100000] flex w-full flex-col bg-[#F7F6FF] shadow-2xl sm:max-w-md">
        <div className="border-b border-slate-100 bg-white px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#111135] text-sm font-black text-white">
                S
              </div>

              <h2 className="text-2xl font-black tracking-[-0.03em] text-[#111135]">
                Hi {profile?.full_name?.split(" ")[0] || "there"} 👋
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                {profile?.email}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-[#F7F6FF] p-2 text-[#111135] transition hover:bg-[#F1EEFF]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <AccountSection
            icon={<BookOpen className="h-5 w-5 text-[#5B3DF5]" />}
            title="My Learning"
            open={activeSection === "learning"}
            onClick={() => toggleSection("learning")}
          >
            <p className="text-sm leading-6 text-slate-600">
              Continue learning, view assigned assessments and track progress
              for your learner profiles.
            </p>

            <Link
              href="/my-learning"
              onClick={onClose}
              className="mt-4 inline-flex rounded-full bg-[#111135] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1D1B4F]"
            >
              Open My Learning
            </Link>
          </AccountSection>

          <AccountSection
            icon={<Users className="h-5 w-5 text-[#5B3DF5]" />}
            title="Learner Profiles"
            open={activeSection === "learners"}
            onClick={() => toggleSection("learners")}
          >
            <p className="text-sm leading-6 text-slate-600">
              Manage child profiles used for assessments and learning progress.
            </p>

            <Link
              href="/my-learning"
              onClick={onClose}
              className="mt-4 inline-flex rounded-full bg-[#111135] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1D1B4F]"
            >
              Manage Learners
            </Link>
          </AccountSection>

          <AccountSection
            icon={<ClipboardList className="h-5 w-5 text-[#5B3DF5]" />}
            title="Assessments"
            open={activeSection === "assessments"}
            onClick={() => toggleSection("assessments")}
          >
            <p className="text-sm leading-6 text-slate-600">
              Start assessments using a school code and view submitted attempts.
            </p>

            <Link
              href="/my-learning"
              onClick={onClose}
              className="mt-4 inline-flex rounded-full bg-[#111135] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1D1B4F]"
            >
              Open Assessments
            </Link>
          </AccountSection>

          <AccountSection
            icon={<Heart className="h-5 w-5 text-[#5B3DF5]" />}
            title="Saved Schools"
            count={savedSchools.length}
            open={activeSection === "saved"}
            onClick={() => toggleSection("saved")}
          >
            {savedSchools.length === 0 ? (
              <p className="text-sm text-slate-500">No saved schools yet.</p>
            ) : (
              <div className="space-y-3">
                {savedSchools.map((school) => (
                  <div
                    key={school.id}
                    className="rounded-2xl border border-slate-100 bg-white p-4"
                  >
                    <p className="font-black text-[#111135]">{school.name}</p>

                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {[school.area, school.emirate].filter(Boolean).join(", ")}
                    </p>

                    <Link
                      href={`/schools/${school.slug}`}
                      onClick={onClose}
                      className="mt-3 inline-flex rounded-full bg-[#111135] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1D1B4F]"
                    >
                      View School
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </AccountSection>

          <AccountSection
            icon={<CalendarDays className="h-5 w-5 text-[#5B3DF5]" />}
            title="Tour Requests"
            count={tourRequests.length}
            open={activeSection === "tours"}
            onClick={() => toggleSection("tours")}
          >
            {tourRequests.length === 0 ? (
              <p className="text-sm text-slate-500">No tour requests yet.</p>
            ) : (
              <div className="space-y-3">
                {tourRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-slate-100 bg-white p-4"
                  >
                    <p className="font-black text-[#111135]">
                      {Array.isArray(request.school_names)
                        ? request.school_names.join(", ")
                        : "School tour request"}
                    </p>

                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Preferred date: {request.preferred_date || "Not added"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </AccountSection>

          <AccountSection
            icon={<User className="h-5 w-5 text-[#5B3DF5]" />}
            title="My Profile"
            open={activeSection === "profile"}
            onClick={() => toggleSection("profile")}
          >
            <div className="space-y-2 text-sm text-slate-600">
              <p>
                <span className="font-black text-[#111135]">Name:</span>{" "}
                {profile?.full_name}
              </p>
              <p>
                <span className="font-black text-[#111135]">Email:</span>{" "}
                {profile?.email}
              </p>
              <p>
                <span className="font-black text-[#111135]">Mobile:</span>{" "}
                {profile?.mobile || "Not added"}
              </p>
              <p>
                <span className="font-black text-[#111135]">Type:</span>{" "}
                {profile?.user_type}
              </p>
            </div>
          </AccountSection>

          <AccountSection
            icon={<MessageCircle className="h-5 w-5 text-[#5B3DF5]" />}
            title="Contact Scoolyx"
            open={activeSection === "contact"}
            onClick={() => toggleSection("contact")}
          >
            <p className="text-sm leading-6 text-slate-600">
              Need help with your account, school tour or learning dashboard?
            </p>

            <a
              href="mailto:info@heecoworld.com"
              className="mt-4 inline-flex rounded-full bg-[#111135] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1D1B4F]"
            >
              Contact Scoolyx
            </a>
          </AccountSection>
        </div>

        <div className="border-t border-slate-100 bg-white p-5">
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#111135] px-5 py-3 font-bold text-white transition hover:bg-[#1D1B4F]"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </div>,
    document.body
  );
}

function AccountSection({
  icon,
  title,
  count,
  open,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  open: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-[#F7F6FF]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F1EEFF]">
            {icon}
          </div>

          <span className="font-black text-[#111135]">{title}</span>

          {typeof count === "number" && (
            <span className="rounded-full bg-[#F1EEFF] px-2.5 py-1 text-xs font-black text-[#5B3DF5]">
              {count}
            </span>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && <div className="border-t border-slate-100 p-4">{children}</div>}
    </div>
  );
}