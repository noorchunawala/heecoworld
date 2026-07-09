"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/lib/SupabaseClient";

type Learner = { id: string; full_name: string; grade: string | null };

type Assessment = {
  id: string;
  title: string;
  teacherName: string;
  subject: string | null;
  classLevel: string | null;
  topic: string | null;
  totalMarks: number;
  learnerAttempt: {
    isCompleted: boolean;
    score: number | null;
    totalMarks: number | null;
    percentage: number | null;
    submittedAt: string | null;
    status: string;
  } | null;
};

type ProgressTab = "overall" | "school" | "practice";

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function LearnerProgressPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading learner progress..." />}>
      <LearnerProgressContent />
    </Suspense>
  );
}

function LearnerProgressContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedLearnerId = searchParams.get("learnerId")?.trim() ?? "";

  const [learners, setLearners] = useState<Learner[]>([]);
  const [activeLearnerId, setActiveLearnerId] = useState(requestedLearnerId);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [practiceAssessments, setPracticeAssessments] = useState<Assessment[]>(
    [],
  );

  const [progressTab, setProgressTab] = useState<ProgressTab>("overall");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLearners() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          router.replace(
            `/login?redirectTo=${encodeURIComponent("/my-learning/progress")}`,
          );
          return;
        }

        const response = await fetch("/api/learner-profiles", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Could not load learner profiles.");
        }

        if (!active) return;

        const nextLearners = (payload.learners ?? []) as Learner[];

        setLearners(nextLearners);
        setActiveLearnerId((current) => current || nextLearners[0]?.id || "");
      } catch (caught) {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Could not load learner profiles.",
          );
        }
      }
    }

    void loadLearners();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!activeLearnerId) {
      setAssessments([]);
      setPracticeAssessments([]);
      setLoading(false);
      return;
    }

    let active = true;

    async function loadProgress() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) return;

        const response = await fetch(
          `/api/learner-assessments?learnerId=${encodeURIComponent(
            activeLearnerId,
          )}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          },
        );

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Could not load learner progress.");
        }

        if (active) {
          setAssessments(payload.assessments ?? []);
        }

        const practiceResponse = await fetch(
          `/api/practice-tests?learnerId=${encodeURIComponent(
            activeLearnerId,
          )}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          },
        );

        const practicePayload = await practiceResponse.json();

        if (!practiceResponse.ok) {
          throw new Error(
            practicePayload?.error || "Could not load practice tests.",
          );
        }

        if (active) {
          setPracticeAssessments(practicePayload.assessments ?? []);
        }
      } catch (caught) {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Could not load learner progress.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProgress();

    return () => {
      active = false;
    };
  }, [activeLearnerId]);

  const schoolCompleted = useMemo(
    () =>
      assessments.filter((assessment) => assessment.learnerAttempt?.isCompleted),
    [assessments],
  );

  const practiceCompleted = useMemo(
    () =>
      practiceAssessments.filter(
        (assessment) => assessment.learnerAttempt?.isCompleted,
      ),
    [practiceAssessments],
  );

  const completed = useMemo(() => {
    if (progressTab === "school") return schoolCompleted;
    if (progressTab === "practice") return practiceCompleted;

    return [...schoolCompleted, ...practiceCompleted];
  }, [progressTab, schoolCompleted, practiceCompleted]);

  const averagePercentage = useMemo(() => {
    const marks = completed
      .map((assessment) => assessment.learnerAttempt?.percentage)
      .filter((value): value is number => typeof value === "number");

    return marks.length
      ? Math.round(marks.reduce((sum, value) => sum + value, 0) / marks.length)
      : null;
  }, [completed]);

  const subjectProgress = useMemo(() => {
    const groups = new Map<
      string,
      { total: number; score: number; count: number }
    >();

    completed.forEach((assessment) => {
      const key = assessment.subject || "Other";
      const current = groups.get(key) ?? { total: 0, score: 0, count: 0 };

      current.total += Number(
        assessment.learnerAttempt?.totalMarks ?? assessment.totalMarks ?? 0,
      );
      current.score += Number(assessment.learnerAttempt?.score ?? 0);
      current.count += 1;

      groups.set(key, current);
    });

    return Array.from(groups.entries())
      .map(([subject, values]) => ({
        subject,
        count: values.count,
        percentage:
          values.total > 0 ? Math.round((values.score / values.total) * 100) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [completed]);

  const activeLearner =
    learners.find((learner) => learner.id === activeLearnerId) ?? null;

  if (loading && learners.length === 0) {
    return <LoadingState label="Loading learner progress..." />;
  }

  return (
    <main className="min-h-screen bg-[#F7F6FF] px-4 py-8 text-[#111135] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/my-learning"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#5B3DF5] transition hover:text-[#111135]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Learning
        </Link>

        <section className="mt-6 rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-violet-500/10 backdrop-blur md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#5B3DF5]">
                Learning Progress
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-[-0.035em] text-[#111135] md:text-5xl">
                {activeLearner
                  ? `${activeLearner.full_name}'s progress`
                  : "Learner progress"}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                School assessments, practice tests, results and subject-level
                performance in one place.
              </p>
            </div>

            {learners.length > 1 && (
              <select
                value={activeLearnerId}
                onChange={(event) => {
                  setActiveLearnerId(event.target.value);
                  router.replace(
                    `/my-learning/progress?learnerId=${encodeURIComponent(
                      event.target.value,
                    )}`,
                  );
                }}
                className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#111135] outline-none transition focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100"
              >
                {learners.map((learner) => (
                  <option key={learner.id} value={learner.id}>
                    {learner.full_name}
                    {learner.grade ? ` · ${learner.grade}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="mt-8 inline-flex w-full rounded-full bg-[#F7F6FF] p-1 sm:w-auto">
            {[
              { id: "overall", label: "Overall" },
              { id: "school", label: "School" },
              { id: "practice", label: "Practice" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setProgressTab(tab.id as ProgressTab)}
                className={`flex-1 rounded-full px-5 py-2.5 text-sm font-black transition sm:flex-none ${
                  progressTab === tab.id
                    ? "bg-white text-[#5B3DF5] shadow-sm"
                    : "text-[#111135] hover:bg-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {error ? (
          <div className="mt-8 rounded-3xl border border-red-200 bg-white p-6 text-sm leading-6 text-red-700 shadow-lg shadow-violet-500/5">
            {error}
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              <StatCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                label="Completed"
                value={String(completed.length)}
              />

              <StatCard
                icon={<TrendingUp className="h-5 w-5" />}
                label="Average score"
                value={averagePercentage === null ? "—" : `${averagePercentage}%`}
              />

              <StatCard
                icon={<BookOpen className="h-5 w-5" />}
                label="Subjects attempted"
                value={String(subjectProgress.length)}
              />
            </section>

            <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-violet-500/5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F1EEFF] text-[#5B3DF5]">
                  <BarChart3 className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-black text-[#111135]">
                    Subject progress
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Based on the selected progress view.
                  </p>
                </div>
              </div>

              {subjectProgress.length === 0 ? (
                <EmptyState label="No completed assessments yet." />
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {subjectProgress.map((item) => (
                    <div
                      key={item.subject}
                      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-black text-[#111135]">
                          {item.subject}
                        </p>
                        <p className="text-xl font-black text-[#5B3DF5]">
                          {item.percentage}%
                        </p>
                      </div>

                      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#5B3DF5]"
                          style={{
                            width: `${Math.min(100, item.percentage)}%`,
                          }}
                        />
                      </div>

                      <p className="mt-3 text-xs font-semibold text-slate-500">
                        {item.count} completed assessment
                        {item.count === 1 ? "" : "s"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-violet-500/5">
              <h2 className="text-lg font-black text-[#111135]">
                {progressTab === "practice"
                  ? "Completed practice tests"
                  : progressTab === "school"
                    ? "Completed school assessments"
                    : "Completed assessments"}
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Open any completed assessment to view its saved result.
              </p>

              {loading ? (
                <div className="mt-6 flex items-center gap-2 text-sm font-bold text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Refreshing progress...
                </div>
              ) : completed.length === 0 ? (
                <EmptyState label="Completed assessments will appear here." />
              ) : (
                <div className="mt-6 grid gap-3">
                  {completed.map((assessment) => (
                    <article
                      key={assessment.id}
                      className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-[#5B3DF5]/30 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-black text-[#111135]">
                          {assessment.title}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {assessment.teacherName} ·{" "}
                          {assessment.subject || "Subject"}
                          {assessment.classLevel
                            ? ` · ${assessment.classLevel}`
                            : ""}
                        </p>

                        <p className="mt-2 text-xs font-semibold text-slate-500">
                          Completed{" "}
                          {formatDate(
                            assessment.learnerAttempt?.submittedAt ?? null,
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
                          {assessment.learnerAttempt?.percentage ?? 0}%
                        </div>

                        <Link
                          href={`/my-learning/assessments/${
                            assessment.id
                          }?learnerId=${encodeURIComponent(activeLearnerId)}`}
                          className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#111135] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#1D1B4F]"
                        >
                          View result
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <main className="min-h-screen bg-[#F7F6FF] px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-xl items-center justify-center rounded-3xl border border-slate-100 bg-white px-6 py-20 shadow-lg shadow-violet-500/5">
        <Loader2 className="mr-3 h-5 w-5 animate-spin text-[#5B3DF5]" />
        <p className="text-sm font-bold text-slate-700">{label}</p>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-violet-500/5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F1EEFF] text-[#5B3DF5]">
        {icon}
      </div>

      <p className="mt-5 text-sm font-semibold text-slate-500">{label}</p>

      <p className="mt-1 text-4xl font-black tracking-tight text-[#111135]">
        {value}
      </p>
    </article>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-[#F7F6FF] px-5 py-8 text-center text-sm font-semibold text-slate-600">
      {label}
    </div>
  );
}