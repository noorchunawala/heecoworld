"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  BarChart3,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Clock3,
  Copy,
  FileText,
  KeyRound,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/SupabaseClient";

type TestMetrics = {
  attemptCount: number;
  averageScore: number | null;
  averagePercentage: number | null;
};

type AssessmentTest = {
  id: string;
  title: string;
  classLevel: string;
  subject: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  status: "draft" | "published" | "closed";
  accessMode: string;
  createdAt: string;
  creator: {
    name: string;
    email: string;
  } | null;
  metrics: TestMetrics;
};

type WorkspacePayload = {
  role: "teacher" | "school_admin";
  tests: AssessmentTest[];
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusStyle(status: AssessmentTest["status"]) {
  if (status === "published") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "closed") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

function statusLabel(status: AssessmentTest["status"]) {
  if (status === "published") {
    return "Published";
  }

  if (status === "closed") {
    return "Closed";
  }

  return "Draft";
}

export default function SchoolAssessmentsPage() {
  const params = useParams();

  const rawSchoolId = params.schoolId;

  const schoolId = Array.isArray(rawSchoolId)
    ? rawSchoolId[0]
    : rawSchoolId;

  const [data, setData] = useState<WorkspacePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [testSearch, setTestSearch] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [assessmentCodes, setAssessmentCodes] = useState<Record<string, string>>({});
  const [loadingCodeFor, setLoadingCodeFor] = useState("");
  const [copiedCodeFor, setCopiedCodeFor] = useState("");
  const [codeError, setCodeError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadAssessments() {
      try {
        setLoading(true);
        setError("");

        if (!schoolId) {
          throw new Error("School ID is missing.");
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Your school session has expired. Please sign in again.");
        }

        const response = await fetch(
          `/api/school-portal/assessments?schoolId=${encodeURIComponent(
            schoolId
          )}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(
            payload?.error || "Could not load school assessments."
          );
        }

        if (mounted) {
          setData({
            role: payload.role,
            tests: payload.tests ?? [],
          });
        }
      } catch (loadError) {
        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load school assessments."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadAssessments();

    return () => {
      mounted = false;
    };
  }, [schoolId]);

  async function getAccessToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Your school session has expired. Please sign in again.");
    }

    return session.access_token;
  }

  async function showAssessmentCode(testId: string) {
    if (assessmentCodes[testId]) {
      return;
    }

    try {
      setLoadingCodeFor(testId);
      setCodeError("");

      const accessToken = await getAccessToken();
      const response = await fetch(
        `/api/school-portal/assessments/${encodeURIComponent(testId)}/access-code`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "Could not load the assessment code.");
      }

      if (typeof payload?.assessmentCode !== "string" || !payload.assessmentCode) {
        throw new Error("This assessment does not have an active code.");
      }

      setAssessmentCodes((current) => ({
        ...current,
        [testId]: payload.assessmentCode,
      }));
    } catch (codeLoadError) {
      setCodeError(
        codeLoadError instanceof Error
          ? codeLoadError.message
          : "Could not load the assessment code.",
      );
    } finally {
      setLoadingCodeFor("");
    }
  }

  async function copyAssessmentCode(testId: string) {
    const assessmentCode = assessmentCodes[testId];

    if (!assessmentCode) {
      await showAssessmentCode(testId);
      return;
    }

    try {
      await navigator.clipboard.writeText(assessmentCode);
      setCopiedCodeFor(testId);
      window.setTimeout(() => {
        setCopiedCodeFor((current) => (current === testId ? "" : current));
      }, 1800);
    } catch {
      setCodeError("Could not copy the assessment code. Please copy it manually.");
    }
  }

  const totals = useMemo(() => {
    const tests = data?.tests ?? [];

    const publishedTests = tests.filter(
      (test) => test.status === "published"
    ).length;

    const draftTests = tests.filter((test) => test.status === "draft").length;

    const totalAttempts = tests.reduce(
      (sum, test) => sum + test.metrics.attemptCount,
      0
    );

    return {
      totalTests: tests.length,
      publishedTests,
      draftTests,
      totalAttempts,
    };
  }, [data?.tests]);

  const teachers = useMemo(() => {
    const teachersById = new Map<string, { id: string; name: string }>();

    for (const test of data?.tests ?? []) {
      if (!test.creator) {
        continue;
      }

      const id = `${test.creator.email}::${test.creator.name}`;
      teachersById.set(id, {
        id,
        name: test.creator.name || test.creator.email,
      });
    }

    return [...teachersById.values()].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [data?.tests]);

  const filteredTests = useMemo(() => {
    const normalizedSearch = testSearch.trim().toLowerCase();

    return (data?.tests ?? []).filter((test) => {
      const creatorId = test.creator
        ? `${test.creator.email}::${test.creator.name}`
        : "";

      const matchesTeacher =
        data?.role !== "school_admin" ||
        teacherFilter === "all" ||
        creatorId === teacherFilter;

      if (!matchesTeacher) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        test.title,
        test.classLevel,
        test.subject,
        test.creator?.name,
        test.creator?.email,
        test.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [data?.role, data?.tests, teacherFilter, testSearch]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-20 shadow-sm">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-slate-700" />
          <p className="text-sm font-semibold text-slate-700">
            Loading assessment workspace...
          </p>
        </div>
      </main>
    );
  }

  if (error || !data || !schoolId) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <div className="flex gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div>
              <h1 className="text-lg font-semibold text-slate-950">
                Assessment workspace could not load
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {error || "Your school assessment access is unavailable."}
              </p>

              <Link
                href="/school-dashboard"
                className="mt-5 inline-flex text-sm font-semibold text-slate-900 hover:underline"
              >
                Back to School Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const isTeacher = data.role === "teacher";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
              href="/school-dashboard"
              className="text-sm font-semibold text-slate-600 transition hover:text-slate-950"
            >
              ← Back to School Dashboard
            </Link>
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>


            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
              {isTeacher ? (
                <ClipboardList className="h-3.5 w-3.5" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5" />
              )}

              {isTeacher
                ? "Teacher assessment workspace"
                : "School assessment overview"}
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
              {isTeacher ? "My assessments" : "School assessments"}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {isTeacher
                ? "Create, review, publish, and track only the assessments you created."
                : "Review all assessments created by teachers in your school. School administrators have oversight access, not editing access."}
            </p>
          </div>

          {isTeacher && (
            <Link
              href={`/school-dashboard/schools/${schoolId}/assessments/create`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Create Assessment
            </Link>
          )}
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={<FileText className="h-4 w-4" />}
            label={isTeacher ? "My tests" : "School tests"}
            value={String(totals.totalTests)}
          />

          <SummaryCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Published"
            value={String(totals.publishedTests)}
          />

          <SummaryCard
            icon={<ClipboardList className="h-4 w-4" />}
            label="Drafts"
            value={String(totals.draftTests)}
          />

          <SummaryCard
            icon={<BarChart3 className="h-4 w-4" />}
            label="Submitted attempts"
            value={String(totals.totalAttempts)}
          />
        </section>

        {data.tests.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <ClipboardList className="h-6 w-6" />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-950">
              {isTeacher
                ? "You have not created an assessment yet"
                : "No teacher assessment has been created yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              {isTeacher
                ? "Choose a curriculum topic and generate an editable draft from the validated question bank."
                : "Once teachers create assessments for this school, they will appear here with their status and performance metrics."}
            </p>

            {isTeacher && (
              <Link
                href={`/school-dashboard/schools/${schoolId}/assessments/create`}
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Create first assessment
              </Link>
            )}
          </section>
        ) : (
          <>
          {codeError && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              {codeError}
            </div>
          )}

          <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <h2 className="font-semibold text-slate-950">
                {isTeacher ? "Your test papers" : "Tests created by teachers"}
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                {isTeacher
                  ? "Search your assessments by title, subject, or class level."
                  : "Search assessments or narrow the list to one teacher. Metrics are based on submitted and auto-submitted attempts."}
              </p>

              <div className="mt-4 flex flex-col gap-3 md:flex-row">
                <label className="relative flex-1">
                  <span className="sr-only">Search assessments</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={testSearch}
                    onChange={(event) => setTestSearch(event.target.value)}
                    placeholder="Search by test title, subject, or class level"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </label>

                {!isTeacher && (
                  <label className="md:w-64">
                    <span className="sr-only">Filter by teacher</span>
                    <select
                      value={teacherFilter}
                      onChange={(event) => setTeacherFilter(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    >
                      <option value="all">All teachers</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </div>

            {filteredTests.length === 0 ? (
              <div className="px-5 py-12 text-center sm:px-6">
                <p className="font-semibold text-slate-950">
                  No assessments match these filters
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Try a different test title, subject, class level, or teacher.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTests.map((test) => (
                  <article
                    key={test.id}
                    className="flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyle(
                            test.status
                          )}`}
                        >
                          {statusLabel(test.status)}
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                          {test.classLevel}
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                          {test.subject}
                        </span>
                      </div>

                      <h3 className="mt-3 text-base font-semibold text-slate-950">
                        {test.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-600">
                        {test.totalQuestions} questions · {test.totalMarks} marks ·{" "}
                        {test.durationMinutes} min · Created{" "}
                        {formatDate(test.createdAt)}
                      </p>

                      {!isTeacher && test.creator && (
                        <p className="mt-2 text-sm text-slate-500">
                          Created by{" "}
                          <span className="font-semibold text-slate-700">
                            {test.creator.name}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                      <MetricPill
                        label="Attempts"
                        value={String(test.metrics.attemptCount)}
                      />

                      <MetricPill
                        label="Average"
                        value={
                          test.metrics.averagePercentage === null
                            ? "—"
                            : `${test.metrics.averagePercentage}%`
                        }
                      />

                      {test.status === "published" && (
                        <>
                          {assessmentCodes[test.id] ? (
                            <div className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-950">
                              <KeyRound className="h-4 w-4 text-violet-700" />
                              <span className="text-violet-700">Code</span>
                              <code className="rounded bg-white px-2 py-0.5 font-mono tracking-[0.12em] text-slate-950">
                                {assessmentCodes[test.id]}
                              </code>
                              <button
                                type="button"
                                onClick={() => void copyAssessmentCode(test.id)}
                                className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-bold text-violet-800 transition hover:bg-violet-100"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                {copiedCodeFor === test.id ? "Copied" : "Copy"}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void showAssessmentCode(test.id)}
                              disabled={loadingCodeFor === test.id}
                              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-800 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {loadingCodeFor === test.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Loading code...
                                </>
                              ) : (
                                <>
                                  <KeyRound className="h-4 w-4" />
                                  Assessment code
                                </>
                              )}
                            </button>
                          )}

                          <Link
                            href={`/school-dashboard/schools/${schoolId}/assessments/${test.id}/results`}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            <BarChart3 className="h-4 w-4" />
                            Results
                          </Link>
                        </>
                      )}

                      {isTeacher && (
                        <Link
                          href={`/school-dashboard/schools/${schoolId}/assessments/${test.id}`}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                        >
                          {test.status === "draft"
                            ? "Open draft"
                            : "View assessment"}
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
          </>
        )}

        {!isTeacher && (
          <section className="mt-6 rounded-3xl border border-sky-100 bg-sky-50 p-5 sm:p-6">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />

              <div>
                <p className="font-semibold text-sky-950">
                  School administrator access
                </p>

                <p className="mt-1 text-sm leading-6 text-sky-900">
                  You can review every teacher-created assessment and its
                  school-level metrics. Teachers remain the only people who can
                  edit or publish their own papers.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-bold uppercase tracking-[0.1em]">
          {label}
        </span>
      </div>

      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

function MetricPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>

      <p className="mt-0.5 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}