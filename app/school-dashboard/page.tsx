"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/SupabaseClient";
import SchoolOverviewAnalytics from "@/components/school-dashboard/SchoolOverviewAnalytics";

type SchoolAccess = {
  membershipId: string;
  role: "school_admin" | "teacher";
  school: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
};

type Teacher = {
  id: string;
  email: string;
  full_name: string | null;
  status: "invited" | "active" | "inactive";
  user_id: string | null;
  created_at: string;
  accepted_at: string | null;
};

export default function SchoolDashboardPage() {
  const router = useRouter();

  const [schools, setSchools] = useState<SchoolAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        router.replace("/school-access");
        return;
      }

      const response = await fetch("/api/school-portal/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error || "Could not load school access.");
        setLoading(false);
        return;
      }

      setSchools(result.schools || []);
      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F7F6FF] px-4 text-[#111135]">
        <p className="text-slate-600">Loading your school portal...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F7F6FF] px-4 text-[#111135]">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lg shadow-violet-500/5">
          <h1 className="text-2xl font-bold text-[#111135]">
            School access unavailable
          </h1>

          <p className="mt-3 text-slate-500">{error}</p>

          <Link
            href="/school-access"
            className="mt-6 inline-flex rounded-full bg-[#111135] px-5 py-3 text-sm font-bold text-white hover:bg-[#1D1B4F]"
          >
            Back to School Portal
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F6FF] px-4 py-8 text-[#111135] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-violet-500/10 backdrop-blur sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5B3DF5]">
            Scoolyx School Portal
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-[-0.035em] text-[#111135] sm:text-5xl">
            Welcome to your school dashboard
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            You can access the schools assigned to your email address.
          </p>
        </div>

        <div className="space-y-5">
          {schools.map((item) => (
            <div
              key={item.membershipId}
              className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-violet-500/5 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#111135]">
                    {item.school.name}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Role:{" "}
                    {item.role === "school_admin" ? "School Admin" : "Teacher"}
                  </p>
                </div>

                <span className="w-fit rounded-full bg-[#F1EEFF] px-3 py-1 text-xs font-bold text-[#5B3DF5]">
                  {item.school.status}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {item.school.status === "active" && (
                  <Link
                    href={`/schools/${item.school.slug}`}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#111135] hover:bg-[#F7F6FF]"
                  >
                    View School Profile
                  </Link>
                )}

                {item.role === "school_admin" && (
                  <Link
                    href={`/school-dashboard/schools/${item.school.id}/edit`}
                    className="rounded-full bg-[#5B3DF5] px-4 py-2 text-sm font-bold text-white hover:bg-[#4A2FE2]"
                  >
                    Edit School Profile
                  </Link>
                )}

                <Link
  href={`/school-dashboard/schools/${item.school.id}/assessments`}
  className="rounded-full bg-[#111135] px-4 py-2 text-sm font-bold text-white hover:bg-[#1D1B4F]"
>
  {item.role === "teacher" ? "My Assessments" : "School Assessments"}
</Link>
              </div>
                         {item.role === "school_admin" && (
  <SchoolOverviewSection
  listing={{
    id: item.school.id,
    name: item.school.name,
  }}
/>
)}

              {item.role === "school_admin" && (
                <TeacherManager
                  schoolId={item.school.id}
                  schoolName={item.school.name}
                />
              )}
   
              
            </div>
            
            
          ))}
          
        </div>
      </div>
    </main>
  );
}

function TeacherManager({
  schoolId,
  schoolName,
}: {
  schoolId: string;
  schoolName: string;
}) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [updatingTeacherId, setUpdatingTeacherId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadTeachers();
  }, [schoolId]);

  async function getAccessToken() {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      throw new Error("Your session has expired. Please sign in again.");
    }

    return accessToken;
  }

  async function loadTeachers() {
    try {
      setLoadingTeachers(true);
      setError("");

      const accessToken = await getAccessToken();

      const response = await fetch(
        `/api/school-portal/schools/${schoolId}/teachers`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Could not load teachers.");
      }

      setTeachers(result.teachers || []);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load teachers."
      );
    } finally {
      setLoadingTeachers(false);
    }
  }

  async function addTeacher(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setError("Teacher email is required.");
      return;
    }

    try {
      setAddingTeacher(true);
      setError("");
      setMessage("");

      const accessToken = await getAccessToken();

      const response = await fetch(
        `/api/school-portal/schools/${schoolId}/teachers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            fullName,
            email,
          }),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Could not add teacher.");
      }

      setTeachers((current) => [
        result.teacher,
        ...current.filter((teacher) => teacher.id !== result.teacher.id),
      ]);

      setFullName("");
      setEmail("");

      setMessage(
        "Teacher added. They can sign in using the same email through School Portal."
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not add teacher."
      );
    } finally {
      setAddingTeacher(false);
    }
  }

  async function deactivateTeacher(teacher: Teacher) {
    const confirmed = window.confirm(
      `Deactivate ${teacher.email}? They will lose access to ${schoolName}.`
    );

    if (!confirmed) return;

    try {
      setUpdatingTeacherId(teacher.id);
      setError("");
      setMessage("");

      const accessToken = await getAccessToken();

      const response = await fetch(
        `/api/school-portal/schools/${schoolId}/teachers`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            membershipId: teacher.id,
            action: "deactivate",
          }),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Could not deactivate teacher.");
      }

      setTeachers((current) =>
        current.map((item) =>
          item.id === result.teacher.id ? result.teacher : item
        )
      );

      setMessage("Teacher access has been deactivated.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not deactivate teacher."
      );
    } finally {
      setUpdatingTeacherId("");
    }
  }

  async function reinviteTeacher(teacher: Teacher) {
    try {
      setUpdatingTeacherId(teacher.id);
      setError("");
      setMessage("");

      const accessToken = await getAccessToken();

      const response = await fetch(
        `/api/school-portal/schools/${schoolId}/teachers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            fullName: teacher.full_name || "",
            email: teacher.email,
          }),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Could not reactivate teacher.");
      }

      setTeachers((current) =>
        current.map((item) =>
          item.id === result.teacher.id ? result.teacher : item
        )
      );

      setMessage(
        "Teacher access has been re-enabled. They can sign in using the same email through School Portal."
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not reactivate teacher."
      );
    } finally {
      setUpdatingTeacherId("");
    }
  }

  return (
    <section className="mt-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-violet-500/5">
      <div>
        <h3 className="text-lg font-bold text-[#111135]">
          Teachers
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Add teachers using their official school email. They must use the same
          email to access the School Portal.
        </p>
      </div>

      <form
        onSubmit={addTeacher}
        className="mt-5 grid gap-3 rounded-3xl bg-[#F7F6FF] p-4 md:grid-cols-[1fr_1fr_auto]"
      >
        <input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Teacher name (optional)"
          className="rounded-full border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-100"
        />

        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="teacher@school.ae"
          required
          className="rounded-full border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-100"
        />

        <button
          type="submit"
          disabled={addingTeacher}
          className="rounded-full bg-[#111135] px-5 py-3 text-sm font-bold text-white hover:bg-[#1D1B4F] disabled:opacity-60"
        >
          {addingTeacher ? "Adding..." : "Add Teacher"}
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-full bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p className="mt-4 rounded-full bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      )}

      <div className="mt-5 space-y-3">
        {loadingTeachers && (
          <p className="text-sm text-slate-500">Loading teachers...</p>
        )}

        {!loadingTeachers && teachers.length === 0 && (
          <p className="rounded-2xl border border-dashed px-4 py-5 text-sm text-slate-500">
            No teachers have been added yet.
          </p>
        )}

        {teachers.map((teacher) => (
          <div
            key={teacher.id}
            className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-semibold text-[#111135]">
                {teacher.full_name || "Teacher"}
              </p>

              <p className="mt-1 text-sm text-slate-500">{teacher.email}</p>

              <span
                className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  teacher.status === "active"
                    ? "bg-emerald-50 text-emerald-700"
                    : teacher.status === "invited"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {teacher.status === "active"
                  ? "Active"
                  : teacher.status === "invited"
                  ? "Invitation pending"
                  : "Inactive"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {teacher.status === "inactive" ? (
                <button
                  type="button"
                  onClick={() => reinviteTeacher(teacher)}
                  disabled={updatingTeacherId === teacher.id}
                  className="rounded-full border px-4 py-2 text-sm font-semibold text-[#111135] disabled:opacity-60"
                >
                  {updatingTeacherId === teacher.id
                    ? "Updating..."
                    : "Re-enable"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => deactivateTeacher(teacher)}
                  disabled={updatingTeacherId === teacher.id}
                  className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
                >
                  {updatingTeacherId === teacher.id
                    ? "Updating..."
                    : "Deactivate"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
function SchoolOverviewSection({
  listing,
}: {
  listing: { id: string; name: string };
}) {
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggleOverview() {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (!nextOpen || analytics) return;

    try {
      setLoading(true);
      setError("");

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const response = await fetch(
        `/api/school-portal/schools/${listing.id}/overview`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Could not load overview.");
      }

      setAnalytics(result.analytics);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load overview."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6">
      <button
        type="button"
        onClick={toggleOverview}
        className="w-full rounded-3xl border bg-[#F7F6FF] px-5 py-4 text-left font-semibold text-[#111135] hover:bg-[#F7F6FF]"
      >
        {open ? "Close Overview Dashboard" : "Open Overview Dashboard"}
      </button>

      {open && loading && (
        <p className="mt-4 text-sm text-slate-500">Loading overview...</p>
      )}

      {open && error && (
        <p className="mt-4 rounded-full bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {open && analytics && (
        <SchoolOverviewAnalytics listing={listing} analytics={analytics} />
      )}
    </section>
  );
}