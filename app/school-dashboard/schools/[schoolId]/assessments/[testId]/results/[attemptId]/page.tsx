"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Loader2,
  UserRound,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/SupabaseClient";

type AnswerReviewQuestion = {
  id: string;
  orderNumber: number;
  questionType: string;
  questionText: string;
  options: {
    A: string | null;
    B: string | null;
    C: string | null;
    D: string | null;
  };
  selectedOption: string | null;
  answerText: string | null;
  isCorrect: boolean;
  marks: number;
  negativeMarks: number;
  marksAwarded: number;
  correctOption: string | null;
  explanation: string | null;
};

type ReviewPayload = {
  role: "teacher" | "school_admin";
  test: {
    id: string;
    title: string;
    curriculumName: string | null;
    classLevel: string | null;
    subject: string | null;
  };
  attempt: {
    id: string;
    learnerId: string | null;
    learnerName: string;
    learnerRelationship: "self" | "child" | null;
    classOrGrade: string | null;
    section: string | null;
    status: "submitted" | "auto_submitted";
    startedAt: string;
    submittedAt: string | null;
    timeTakenSeconds: number;
    score: number;
    totalMarks: number;
    percentage: number;
  };
  questions: AnswerReviewQuestion[];
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

function formatSeconds(value: number) {
  const minutes = Math.floor(Math.max(0, value) / 60);
  const seconds = Math.max(0, value) % 60;

  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export default function AssessmentAnswerReviewPage() {
  const params = useParams();

  const schoolId = Array.isArray(params.schoolId)
    ? params.schoolId[0]
    : params.schoolId;

  const testId = Array.isArray(params.testId) ? params.testId[0] : params.testId;

  const attemptId = Array.isArray(params.attemptId)
    ? params.attemptId[0]
    : params.attemptId;

  const [data, setData] = useState<ReviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadReview() {
      try {
        setLoading(true);
        setError("");

        if (!testId || !attemptId) {
          throw new Error("Assessment result details are incomplete.");
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Your school session has expired. Please sign in again.");
        }

        const response = await fetch(
          `/api/school-portal/assessments/${encodeURIComponent(
            testId,
          )}/results/${encodeURIComponent(attemptId)}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            cache: "no-store",
          },
        );

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || "Could not load this answer review.");
        }

        if (mounted) {
          setData(payload as ReviewPayload);
        }
      } catch (caughtError) {
        if (mounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Could not load this answer review.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadReview();

    return () => {
      mounted = false;
    };
  }, [attemptId, testId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-20 shadow-sm">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-slate-700" />
          <p className="text-sm font-semibold text-slate-700">
            Loading answer review...
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
                Answer review could not load
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {error || "This learner result is unavailable."}
              </p>
              <Link
                href={`/school-dashboard/schools/${schoolId ?? ""}/assessments/${testId ?? ""}/results`}
                className="mt-5 inline-flex text-sm font-semibold text-slate-900 hover:underline"
              >
                Back to assessment results
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const { test, attempt, questions } = data;

  const correctCount = questions.filter((question) => question.isCorrect).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/school-dashboard/schools/${schoolId}/assessments/${testId}/results`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to results
        </Link>

        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
                <UserRound className="h-3.5 w-3.5" />
                Learner answer review
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                {attempt.learnerName}
              </h1>

              <p className="mt-2 text-sm font-medium text-slate-600">
                {[attempt.classOrGrade, attempt.section]
                  .filter(Boolean)
                  .join(" · ") || "Learner profile"}
              </p>

              <p className="mt-5 text-base font-semibold text-slate-950">
                {test.title}
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {[test.curriculumName, test.classLevel, test.subject]
                  .filter(Boolean)
                  .join(" · ")}
              </p>

              <p className="mt-4 text-sm text-slate-500">
                Submitted {formatDateTime(attempt.submittedAt)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[440px]">
              <ReviewMetric label="Score" value={`${attempt.score} / ${attempt.totalMarks}`} />
              <ReviewMetric label="Percentage" value={`${attempt.percentage}%`} />
              <ReviewMetric label="Correct" value={`${correctCount} / ${questions.length}`} />
              <ReviewMetric label="Time" value={formatSeconds(attempt.timeTakenSeconds)} />
            </div>
          </div>
        </section>

        <section className="mt-6 space-y-4">
          {questions.map((question) => (
            <article
              key={question.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-bold text-white">
                  Question {question.orderNumber}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                    question.isCorrect
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {question.isCorrect ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  {question.isCorrect ? "Correct" : "Incorrect"}
                </span>

                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                  {question.marksAwarded} / {question.marks} marks
                </span>
              </div>

              <h2 className="mt-4 text-base font-semibold leading-7 text-slate-950">
                {question.questionText}
              </h2>

              <div className="mt-4 grid gap-2">
                {(["A", "B", "C", "D"] as const).map((optionKey) => {
                  const optionText = question.options[optionKey];

                  if (!optionText) return null;

                  const isSelected = question.selectedOption === optionKey;
                  const isCorrect = question.correctOption === optionKey;

                  return (
                    <div
                      key={optionKey}
                      className={`rounded-2xl border px-4 py-3 text-sm ${
                        isCorrect
                          ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                          : isSelected
                            ? "border-red-200 bg-red-50 text-red-950"
                            : "border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className="mr-2 font-bold">{optionKey}.</span>
                      {optionText}

                      {isCorrect && (
                        <span className="ml-2 text-xs font-bold text-emerald-700">
                          Correct answer
                        </span>
                      )}

                      {!isCorrect && isSelected && (
                        <span className="ml-2 text-xs font-bold text-red-700">
                          Learner&apos;s answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {!question.selectedOption && (
                <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  No option was selected for this question.
                </p>
              )}

              {question.explanation && (
                <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-sky-700">
                    Explanation
                  </p>
                  <p className="mt-2 text-sm leading-6 text-sky-950">
                    {question.explanation}
                  </p>
                </div>
              )}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function ReviewMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}
