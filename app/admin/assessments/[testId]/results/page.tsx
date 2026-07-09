"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Users,
  CircleAlert,
} from "lucide-react";
import { supabase } from "@/lib/SupabaseClient";

type TestSummary = {
  id: string;
  title: string;
  status: "draft" | "published" | "closed";
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  createdAt: string;
};

type ResultsSummary = {
  totalAttempts: number;
  submittedAttempts: number;
  inProgressAttempts: number;
  averagePercentage: number;
  highestPercentage: number;
};

type Attempt = {
  id: string;
  studentName: string;
  classOrGrade: string | null;
  attemptNumber: number;
  status: "in_progress" | "submitted" | "auto_submitted";
  startedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  timeTakenSeconds: number | null;
  score: number | null;
  totalMarks: number | null;
  percentage: number | null;
};

type ResultsPayload = {
  test: TestSummary;
  summary: ResultsSummary;
  attempts: Attempt[];
};
type OptionKey = "A" | "B" | "C" | "D";

type AnalyticsQuestion = {
  testQuestionId: string;
  orderNumber: number;
  questionText: string;
  difficulty: string | null;
  marks: number;
  correctOption: OptionKey | null;
  options: {
    A?: string | null;
    B?: string | null;
    C?: string | null;
    D?: string | null;
  };
  submittedAttempts: number;
  answeredCount: number;
  unansweredCount: number;
  correctCount: number;
  wrongCount: number;
  correctRate: number;
  optionCounts: Record<OptionKey, number>;
  mostSelectedWrongOption: {
    option: OptionKey;
    count: number;
  } | null;
};

type AnalyticsPayload = {
  summary: {
    submittedAttempts: number;
    questionsAnalysed: number;
    averageCorrectRate: number;
    hardestQuestion: {
      testQuestionId: string;
      orderNumber: number;
      correctRate: number;
    } | null;
  };
  questions: AnalyticsQuestion[];
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-AE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatTakenTime(totalSeconds: number | null) {
  if (!totalSeconds || totalSeconds <= 0) {
    return "—";
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

function statusLabel(status: Attempt["status"]) {
  if (status === "auto_submitted") {
    return "Auto submitted";
  }

  if (status === "submitted") {
    return "Submitted";
  }

  return "In progress";
}

function statusClassName(status: Attempt["status"]) {
  if (status === "submitted") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "auto_submitted") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}
function difficultyLabel(difficulty: string | null) {
  if (!difficulty) {
    return "Question";
  }

  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}
export default function AssessmentResultsPage() {
  const params = useParams();
  const rawTestId = params.testId;
  const testId = Array.isArray(rawTestId) ? rawTestId[0] : rawTestId;

  const [payload, setPayload] = useState<ResultsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
const [analyticsLoading, setAnalyticsLoading] = useState(true);
const [analyticsError, setAnalyticsError] = useState("");

  const submittedAttempts = useMemo(
    () =>
      (payload?.attempts ?? []).filter(
        (attempt) =>
          attempt.status === "submitted" ||
          attempt.status === "auto_submitted"
      ),
    [payload?.attempts]
  );

  useEffect(() => {
    let mounted = true;

    async function loadResults() {
      try {
        setLoading(true);
        setError("");

        if (!testId) {
          throw new Error("Test ID is missing.");
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Your admin session has expired. Please sign in again.");
        }

        const response = await fetch(
          `/api/admin/assessments/${testId}/attempts`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        const resultPayload = await response.json();

        if (!response.ok) {
          throw new Error(
            resultPayload?.error || "Could not load test results."
          );
        }

        if (mounted) {
          setPayload(resultPayload);
        }
      } catch (loadError) {
        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load test results."
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
useEffect(() => {
  let mounted = true;

  async function loadAnalytics() {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError("");

      if (!testId) {
        throw new Error("Test ID is missing.");
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Your admin session has expired. Please sign in again.");
      }

      const response = await fetch(
        `/api/admin/assessments/${testId}/analytics`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const analyticsPayload = await response.json();

      if (!response.ok) {
        throw new Error(
          analyticsPayload?.error || "Could not load question analytics."
        );
      }

      if (mounted) {
        setAnalytics(analyticsPayload);
      }
    } catch (loadError) {
      if (mounted) {
        setAnalyticsError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load question analytics."
        );
      }
    } finally {
      if (mounted) {
        setAnalyticsLoading(false);
      }
    }
  }

  void loadAnalytics();

  return () => {
    mounted = false;
  };
}, [testId]);
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-20">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-slate-700" />
          <p className="text-sm font-medium text-slate-700">
            Loading test results...
          </p>
        </div>
      </main>
    );
  }

  if (error || !payload) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8">
          <div className="flex gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div>
              <h1 className="text-lg font-semibold text-slate-950">
                Results could not load
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {error || "This results page is not available."}
              </p>

              <Link
                href="/admin/assessments"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to assessments
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const { test, summary, attempts } = payload;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/admin/assessments/${test.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to test
        </Link>

        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-800">
                <BarChart3 className="h-3.5 w-3.5" />
                Teacher results dashboard
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                {test.title}
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Review student attempts, scores, percentages and completion time.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[380px]">
              <SummaryCard
                icon={<FileText className="h-4 w-4" />}
                label="Questions"
                value={String(test.totalQuestions)}
              />

              <SummaryCard
                icon={<Clock3 className="h-4 w-4" />}
                label="Timer"
                value={`${test.durationMinutes} min`}
              />

              <SummaryCard
                icon={<CheckCircle2 className="h-4 w-4" />}
                label="Marks"
                value={String(test.totalMarks)}
              />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            label="Total attempts"
            value={String(summary.totalAttempts)}
            icon={<Users className="h-4 w-4" />}
          />

          <MetricCard
            label="Submitted"
            value={String(summary.submittedAttempts)}
            icon={<CheckCircle2 className="h-4 w-4" />}
          />

          <MetricCard
            label="In progress"
            value={String(summary.inProgressAttempts)}
            icon={<Clock3 className="h-4 w-4" />}
          />

          <MetricCard
            label="Average"
            value={`${summary.averagePercentage}%`}
            icon={<BarChart3 className="h-4 w-4" />}
          />

          <MetricCard
            label="Highest"
            value={`${summary.highestPercentage}%`}
            icon={<BarChart3 className="h-4 w-4" />}
          />
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Student attempts
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                {submittedAttempts.length} submitted attempt
                {submittedAttempts.length === 1 ? "" : "s"} out of{" "}
                {attempts.length} total.
              </p>
            </div>
          </div>

          {attempts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-semibold text-slate-950">
                No student attempts yet
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Once students open the public test link and start the test,
                their attempts will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="hidden bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-slate-500 md:grid md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.8fr_1.1fr] md:gap-4">
                <span>Student</span>
                <span>Status</span>
                <span>Score</span>
                <span>Percentage</span>
                <span>Time</span>
                <span>Submitted</span>
              </div>

              <div className="divide-y divide-slate-100">
                {attempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.8fr_1.1fr] md:items-center md:gap-4"
                  >
                    <div>
                      <p className="font-bold text-slate-950">
                        {attempt.studentName || "Unnamed student"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {attempt.classOrGrade || "No class/grade"} · Attempt{" "}
                        {attempt.attemptNumber}
                      </p>
                    </div>

                    <div>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClassName(
                          attempt.status
                        )}`}
                      >
                        {statusLabel(attempt.status)}
                      </span>
                    </div>

                    <p className="font-semibold text-slate-800">
                      {attempt.score ?? "—"} /{" "}
                      {attempt.totalMarks ?? test.totalMarks}
                    </p>

                    <p className="font-semibold text-slate-800">
                      {attempt.percentage === null ||
                      attempt.percentage === undefined
                        ? "—"
                        : `${attempt.percentage}%`}
                    </p>

                    <p className="text-slate-700">
                      {formatTakenTime(attempt.timeTakenSeconds)}
                    </p>

                    <p className="text-slate-600">
                      {formatDateTime(attempt.submittedAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h2 className="text-lg font-bold text-slate-950">
        Question-level insights
      </h2>

      <p className="mt-1 text-sm leading-6 text-slate-600">
        Identify questions students found difficult and the most common wrong
        answer patterns.
      </p>
    </div>
  </div>

  {analyticsLoading ? (
    <div className="mt-6 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-700">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading question analytics...
    </div>
  ) : analyticsError ? (
    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
      {analyticsError}
    </div>
  ) : !analytics || analytics.summary.submittedAttempts === 0 ? (
    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center">
      <p className="font-semibold text-slate-950">
        Analytics will appear after the first submission
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        Once at least one student submits this test, HeecoWorld will show
        question-wise correct rates and common wrong options here.
      </p>
    </div>
  ) : (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Submitted students"
          value={String(analytics.summary.submittedAttempts)}
          icon={<Users className="h-4 w-4" />}
        />

        <MetricCard
          label="Average correct rate"
          value={`${analytics.summary.averageCorrectRate}%`}
          icon={<BarChart3 className="h-4 w-4" />}
        />

        <MetricCard
          label="Hardest question"
          value={
            analytics.summary.hardestQuestion
              ? `Q${analytics.summary.hardestQuestion.orderNumber} · ${analytics.summary.hardestQuestion.correctRate}%`
              : "—"
          }
          icon={<CircleAlert className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 space-y-4">
        {analytics.questions.map((question) => (
          <article
            key={question.testQuestionId}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-bold text-white">
                    Question {question.orderNumber}
                  </span>

                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                    {difficultyLabel(question.difficulty)}
                  </span>

                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                    {question.marks} mark
                    {question.marks === 1 ? "" : "s"}
                  </span>
                </div>

                <p className="mt-3 text-sm font-semibold leading-6 text-slate-950">
                  {question.questionText}
                </p>
              </div>

              <div className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                  Correct rate
                </p>

                <p className="mt-1 text-xl font-bold text-slate-950">
                  {question.correctRate}%
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(["A", "B", "C", "D"] as const).map((optionKey) => {
                const isCorrect = question.correctOption === optionKey;
                const optionText = question.options?.[optionKey];

                if (!optionText) {
                  return null;
                }

                return (
                  <div
                    key={optionKey}
                    className={`rounded-xl border px-3 py-3 text-sm ${
                      isCorrect
                        ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">{optionKey}</span>

                      <span className="text-xs font-bold">
                        {question.optionCounts[optionKey]} selected
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-5">{optionText}</p>

                    {isCorrect && (
                      <p className="mt-2 text-xs font-bold text-emerald-700">
                        Correct answer
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700">
                {question.correctCount} correct
              </span>

              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700">
                {question.wrongCount} wrong
              </span>

              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700">
                {question.unansweredCount} unanswered
              </span>

              {question.mostSelectedWrongOption && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-800">
                  Most common wrong answer:{" "}
                  {question.mostSelectedWrongOption.option} (
                  {question.mostSelectedWrongOption.count})
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  )}
</section>
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-semibold">{label}</span>
      </div>

      <p className="mt-2 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}

function MetricCard({
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

      <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}