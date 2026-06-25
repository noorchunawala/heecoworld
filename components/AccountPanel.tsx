"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  X,
  Heart,
  CalendarDays,
  User,
  LogOut,
  MessageCircle,
  ChevronDown,
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

type Section = "saved" | "tours" | "profile" | "contact" | null;

export default function AccountPanel({ open, onClose }: Props) {
  const router = useRouter();
  const { profile, refresh } = useAuth();

  const [activeSection, setActiveSection] = useState<Section>("saved");
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
      setSavedSchools(allSchools.filter((school) => favoriteIds.includes(school.id)));

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
  <div className="fixed  inset-0 z-[99999]">
    <button
      type="button"
      onClick={onClose}
      aria-label="Close account panel"
      className="absolute inset-0 bg-[#071B33]/70 backdrop-blur-sm"
    />

    <div className="absolute right-0 top-0 bottom-0 z-[100000] flex w-full flex-col bg-white shadow-2xl sm:max-w-md">
      
      <button
        type="button"
        onClick={onClose}
        aria-label="Close account panel"
        className="absolute inset-0 bg-[#071B33]/70 backdrop-blur-sm"
      />

      <div className="absolute right-0 top-0 z-[10000] flex h-full w-full flex-col bg-white shadow-2xl sm:max-w-md">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-2xl font-semibold text-[#071B33]">
              Hi {profile?.full_name?.split(" ")[0] || "there"} 👋
            </h2>
            <p className="mt-1 text-sm text-slate-500">{profile?.email}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-[#071B33] hover:bg-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <AccountSection
            icon={<Heart className="h-5 w-5 text-[#B58A34]" />}
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
                  <div key={school.id} className="rounded-2xl border border-slate-100 p-4">
                    <p className="font-semibold text-[#071B33]">{school.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {[school.area, school.emirate].filter(Boolean).join(", ")}
                    </p>
                    <Link
                      href={`/schools/${school.slug}`}
                      onClick={onClose}
                      className="mt-3 inline-flex rounded-full bg-[#071B33] px-4 py-2 text-xs font-semibold text-white"
                    >
                      View School
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </AccountSection>

          <AccountSection
            icon={<CalendarDays className="h-5 w-5 text-[#B58A34]" />}
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
                  <div key={request.id} className="rounded-2xl border border-slate-100 p-4">
                    <p className="font-semibold text-[#071B33]">
                      {Array.isArray(request.school_names)
                        ? request.school_names.join(", ")
                        : "School tour request"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Preferred date: {request.preferred_date || "Not added"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </AccountSection>

          <AccountSection
            icon={<User className="h-5 w-5 text-[#B58A34]" />}
            title="My Profile"
            open={activeSection === "profile"}
            onClick={() => toggleSection("profile")}
          >
            <div className="space-y-2 text-sm text-slate-600">
              <p><span className="font-semibold text-[#071B33]">Name:</span> {profile?.full_name}</p>
              <p><span className="font-semibold text-[#071B33]">Email:</span> {profile?.email}</p>
              <p><span className="font-semibold text-[#071B33]">Mobile:</span> {profile?.mobile || "Not added"}</p>
              <p><span className="font-semibold text-[#071B33]">Type:</span> {profile?.user_type}</p>
            </div>
          </AccountSection>

          <AccountSection
            icon={<MessageCircle className="h-5 w-5 text-[#B58A34]" />}
            title="Contact HeecoWorld"
            open={activeSection === "contact"}
            onClick={() => toggleSection("contact")}
          >
            <p className="text-sm leading-6 text-slate-600">
              Need help with a school tour or found incorrect information?
            </p>

            <a
              href="mailto:info@heecoworld.com"
              className="mt-4 inline-flex rounded-full bg-[#071B33] px-5 py-3 text-sm font-semibold text-white"
            >
              Contact HeecoWorld
            </a>
          </AccountSection>
        </div>

        <div className="border-t border-slate-100 p-5">
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#071B33] px-5 py-3 font-semibold text-white hover:bg-[#0B2A4D]"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      
    </div>
    </div>
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
    <div className="mb-3 rounded-2xl border border-slate-100 bg-white">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold text-[#071B33]">{title}</span>
          {typeof count === "number" && (
            <span className="rounded-full bg-[#F8F1E7] px-2 py-0.5 text-xs font-semibold text-[#071B33]">
              {count}
            </span>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && <div className="border-t border-slate-100 p-4">{children}</div>}
    </div>
  );
}