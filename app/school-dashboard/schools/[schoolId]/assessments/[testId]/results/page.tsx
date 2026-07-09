"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  Loader2,
  PlayCircle,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { supabase } from "@/lib/SupabaseClient";

type AttemptStatus = "in_progress" | "submitted" | "auto_submitted";

type ResultAttempt = {
  id: string;
  learnerId: string | null;
  learnerName: string;
  learnerRelationship: "self" | "child" | null;
  classOrGrade: string | null;
  section: string | null;
  attemptNumber: number;
  status: AttemptStatus;
  startedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  timeTakenSeconds: number | null;
  score: number | null;
  totalMarks: number | null;
  percentage: number | null;
  isCompleted: boolean;
};

type QuestionAnalytics = {
  testQuestionId: string;
  orderNumber: number;
  questionText: string;
  difficulty: string | null;
  marks: number | null;
  answeredCount: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  correctPercentage: number | null;
  averageMarks: number | null;
};

type ResultsPayload = {
  role: "teacher" | "school_admin";
  test: {
    id: string;
    title: string;
    status: string;
    curriculumName: string | null;
    classLevel: string | null;
    subject: string | null;
    durationMinutes: number;
    totalQuestions: number;
    totalMarks: number | null;
    createdAt: string;
    creator: {
      name: string;
      email: string | null;
    } | null;
    topics: Array<{
      sectionCode: string | null;
      name: string;
    }>;
  };
  summary: {
    startedCount: number;
    inProgressCount: number;
    completedCount: number;
    averagePercentage: number | null;
    averageScore: number | null;
    averageTimeTakenSeconds: number | null;
  };
  analytics: {
    completionRate: number;
    statusBreakdown: Array<{
      label: string;
      status: AttemptStatus;
      count: number;
    }>;
    scoreDistribution: Array<{
      label: string;
      count: number;
    }>;
    questionAnalytics: QuestionAnalytics[];
    difficultQuestions: QuestionAnalytics[];
  };
  attempts: ResultAttempt[];
};

function formatDateTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatSeconds(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";

  const minutes = Math.floor(value / 60);
  const seconds = value % 60;

  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function statusClass(status: AttemptStatus) {
  if (status === "submitted") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "auto_submitted") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-sky-200 bg-sky-50 text-sky-800";
}

function statusLabel(status: AttemptStatus) {
  if (status === "submitted") return "Submitted";
  if (status === "auto_submitted") return "Auto-submitted";
  return "In progress";
}

function clampPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function shortQuestion(value: string) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length > 90 ? `${cleaned.slice(0, 90)}...` : cleaned;
}

export default function AssessmentResultsPage() {
  const params = useParams();

  const schoolId = Array.isArray(params.schoolId)
    ? params.schoolId[0]
    : params.schoolId;

  const testId = Array.isArray(params.testId) ? params.testId[0] : params.testId;

  const [data, setData] = useState<ResultsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [learnerSearch, setLearnerSearch] = useState("");
  

  useEffect(() => {
    let mounted = true;

    async function loadResults() {
      try {
        setLoading(true);
        setError("");

        if (!testId) {
          throw new Error("Assessment ID is missing.");
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Your school session has expired. Please sign in again.");
        }

        const response = await fetch(
          `/api/school-portal/assessments/${encodeURIComponent(testId)}/results`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            cache: "no-store",
          },
        );

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || "Could not load assessment results.");
        }

        if (mounted) {
          setData(payload as ResultsPayload);
        }
      } catch (caughtError) {
        if (mounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Could not load assessment results.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadResults();

    return () => {
      mounted = false;
    };
  }, [testId]);

  const completionRate = useMemo(() => {
    if (!data?.summary.startedCount) return 0;

    return Math.round(
      (data.summary.completedCount / data.summary.startedCount) * 100,
    );
  }, [data?.summary.completedCount, data?.summary.startedCount]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-20 shadow-sm">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-slate-700" />
          <p className="text-sm font-semibold text-slate-700">
            Loading assessment results...
          </p>
        </div>
      </main>
    );
  }

  if (error || !data || !schoolId || !testId) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <div className="flex gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <h1 className="text-lg font-semibold text-slate-950">
                Results could not load
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {error || "Your assessment result access is unavailable."}
              </p>
              <Link
                href={`/school-dashboard/schools/${schoolId ?? ""}/assessments`}
                className="mt-5 inline-flex text-sm font-semibold text-slate-900 hover:underline"
              >
                Back to assessments
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const { test, summary, attempts, analytics } = data;
  const filteredAttempts = attempts.filter((attempt) => {
  const query = learnerSearch.trim().toLowerCase();

  if (!query) return true;

  return [
    attempt.learnerName,
    attempt.classOrGrade,
    attempt.section,
    statusLabel(attempt.status),
    attempt.percentage !== null ? `${attempt.percentage}%` : "",
    attempt.score !== null ? String(attempt.score) : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query);
});
  const maxScoreBucket = Math.max(
    1,
    ...analytics.scoreDistribution.map((bucket) => bucket.count),
  );
  const maxStatusBucket = Math.max(
    1,
    ...analytics.statusBreakdown.map((bucket) => bucket.count),
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/school-dashboard/schools/${schoolId}/assessments`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to assessments
        </Link>

        <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-6 text-white sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-sky-100">
                  <BarChart3 className="h-3.5 w-3.5" />
                  {data.role === "teacher"
                    ? "Your assessment results"
                    : "School assessment results"}
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  {test.title}
                </h1>

                <p className="mt-2 text-sm font-medium text-slate-300">
                  {[test.curriculumName, test.classLevel, test.subject]
                    .filter(Boolean)
                    .join(" · ")}
                </p>

                {test.creator && (
                  <p className="mt-3 text-sm text-slate-300">
                    Created by{" "}
                    <span className="font-semibold text-white">
                      {test.creator.name}
                    </span>
                  </p>
                )}

                {test.topics.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {test.topics.map((topic) => (
                      <span
                        key={`${topic.sectionCode ?? "topic"}-${topic.name}`}
                        className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold text-slate-100"
                      >
                        {topic.sectionCode ? `${topic.sectionCode} · ` : ""}
                        {topic.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[360px]">
                <HeroMetric label="Questions" value={String(test.totalQuestions)} />
                <HeroMetric label="Duration" value={`${test.durationMinutes}m`} />
                <HeroMetric label="Completion" value={`${completionRate}%`} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<UserRound className="h-4 w-4" />}
            label="Started"
            value={String(summary.startedCount)}
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Completed"
            value={String(summary.completedCount)}
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Average score"
            value={
              summary.averagePercentage === null
                ? "—"
                : `${summary.averagePercentage}%`
            }
          />
          <StatCard
            icon={<Clock3 className="h-4 w-4" />}
            label="Avg. time"
            value={formatSeconds(summary.averageTimeTakenSeconds)}
          />
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <ChartCard
            title="Score distribution"
            description="Completed learner attempts grouped by percentage band."
          >
            <div className="space-y-4">
              {analytics.scoreDistribution.map((bucket) => (
                <BarRow
                  key={bucket.label}
                  label={bucket.label}
                  value={bucket.count}
                  width={(bucket.count / maxScoreBucket) * 100}
                />
              ))}
            </div>
          </ChartCard>

          <ChartCard
            title="Attempt status"
            description="A quick view of started, submitted, and auto-submitted attempts."
          >
            <div className="space-y-4">
              {analytics.statusBreakdown.map((bucket) => (
                <BarRow
                  key={bucket.status}
                  label={bucket.label}
                  value={bucket.count}
                  width={(bucket.count / maxStatusBucket) * 100}
                />
              ))}
            </div>
          </ChartCard>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Question-wise performance
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Correct percentage is calculated from completed attempts only.
              </p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
              {analytics.questionAnalytics.length} questions
            </span>
          </div>

          {analytics.questionAnalytics.length === 0 ? (
            <EmptyAnalytics message="Question analytics will appear once learners submit attempts." />
          ) : (
            <div className="mt-6 space-y-4">
              {analytics.questionAnalytics.map((question) => (
                <QuestionPerformanceRow
                  key={question.testQuestionId}
                  question={question}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white p-3 text-amber-700 shadow-sm">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Difficult questions
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                These are the questions with the lowest correct percentage. Use
                them for quick revision or classroom discussion.
              </p>
            </div>
          </div>

          {analytics.difficultQuestions.length === 0 ? (
            <EmptyAnalytics message="Difficult questions will appear after completed attempts are available." />
          ) : (
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {analytics.difficultQuestions.map((question) => (
                <article
                  key={question.testQuestionId}
                  className="rounded-2xl border border-amber-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                      Q{question.orderNumber}
                    </span>
                    <span className="text-sm font-bold text-slate-950">
                      {question.correctPercentage ?? 0}% correct
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-800">
                    {shortQuestion(question.questionText)}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {question.wrongCount} wrong · {question.skippedCount} skipped
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <h2 className="font-semibold text-slate-950">Learner attempts</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Completed attempts can be opened for a full answer review. In-progress
              attempts remain protected until the learner submits.
            </p>
            <input
  value={learnerSearch}
  onChange={(event) => setLearnerSearch(event.target.value)}
  placeholder="Search learner, class, section, status, or score..."
  className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
/>
          </div>

         {filteredAttempts.length === 0 ? (
  <div className="px-5 py-12 text-center sm:px-6">
    <h3 className="text-base font-semibold text-slate-950">
      No learners match this search
    </h3>
    <p className="mt-2 text-sm text-slate-600">
      Try searching by learner name, class, section, status, or score.
    </p>
  </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredAttempts.map((attempt) => (
                <article
                  key={attempt.id}
                  className="flex flex-col gap-4 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(
                          attempt.status,
                        )}`}
                      >
                        {statusLabel(attempt.status)}
                      </span>

                      {attempt.classOrGrade && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                          {attempt.classOrGrade}
                          {attempt.section ? ` · ${attempt.section}` : ""}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 text-base font-semibold text-slate-950">
                      {attempt.learnerName}
                    </h3>

                    <p className="mt-1 text-sm text-slate-600">
                      {attempt.isCompleted
                        ? `Submitted ${formatDateTime(attempt.submittedAt)}`
                        : `Started ${formatDateTime(attempt.startedAt)}`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                    <MiniMetric
                      label="Score"
                      value={
                        attempt.isCompleted && attempt.score !== null
                          ? `${attempt.score} / ${attempt.totalMarks ?? "—"}`
                          : "—"
                      }
                    />
                    <MiniMetric
                      label="Percentage"
                      value={
                        attempt.isCompleted && attempt.percentage !== null
                          ? `${attempt.percentage}%`
                          : "—"
                      }
                    />
                    <MiniMetric
                      label="Time"
                      value={
                        attempt.isCompleted
                          ? formatSeconds(attempt.timeTakenSeconds)
                          : "Running"
                      }
                    />

                    {attempt.isCompleted ? (
                      <Link
                        href={`/school-dashboard/schools/${schoolId}/assessments/${testId}/results/${attempt.id}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Review answers
                      </Link>
                    ) : (
                      <span className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-500">
                        Awaiting submission
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-300">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
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
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-bold uppercase tracking-[0.1em]">
          {label}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-bold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function BarRow({
  label,
  value,
  width,
}: {
  label: string;
  value: number;
  width: number;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-bold text-slate-950">{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-900 transition-all"
          style={{ width: `${Math.max(4, width)}%` }}
        />
      </div>
    </div>
  );
}

function QuestionPerformanceRow({ question }: { question: QuestionAnalytics }) {
  const percent = clampPercent(question.correctPercentage);

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm">
              Q{question.orderNumber}
            </span>
            {question.difficulty && (
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold capitalize text-slate-500 shadow-sm">
                {question.difficulty}
              </span>
            )}
          </div>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-900">
            {shortQuestion(question.questionText)}
          </p>
        </div>

        <div className="shrink-0 text-left sm:w-36 sm:text-right">
          <p className="text-2xl font-bold text-slate-950">
            {question.correctPercentage === null
              ? "—"
              : `${question.correctPercentage}%`}
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Correct
          </p>
        </div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-4 grid gap-2 text-center sm:grid-cols-4">
        <MiniMetric label="Correct" value={String(question.correctCount)} />
        <MiniMetric label="Wrong" value={String(question.wrongCount)} />
        <MiniMetric label="Skipped" value={String(question.skippedCount)} />
        <MiniMetric
          label="Avg marks"
          value={question.averageMarks === null ? "—" : String(question.averageMarks)}
        />
      </div>
    </article>
  );
}

function EmptyAnalytics({ message }: { message: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-5 py-8 text-center">
      <BarChart3 className="mx-auto h-6 w-6 text-slate-400" />
      <p className="mt-3 text-sm font-semibold text-slate-600">{message}</p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}
