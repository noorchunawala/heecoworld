"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Play,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { supabase } from "@/lib/SupabaseClient";

type LearnerQuestion = {
  id: string;
  orderNumber: number;
  questionType: string;
  difficulty: string | null;
  questionText: string;
  options: {
    A: string | null;
    B: string | null;
    C: string | null;
    D: string | null;
  };
  marks: number;
};

type LearnerTest = {
  id: string;
  title: string;
  teacherName: string;
  curriculumName: string | null;
  classLevel: string | null;
  subject: string | null;
  topic: string | null;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  instructions: string | null;
};

type Learner = {
  id: string;
  fullName: string;
  grade: string | null;
};

type Attempt = {
  id: string;
  token: string;
  status: "in_progress" | "submitted" | "auto_submitted";
  startedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  timeTakenSeconds: number | null;
  score: number | null;
  totalMarks: number | null;
  percentage: number | null;
};

type ResultSummary = {
  status: "submitted" | "auto_submitted";
  score: number;
  totalMarks: number;
  percentage: number;
  timeTakenSeconds: number;
};

type ResultQuestion = {
  testQuestionId: string;
  orderNumber: number;
  questionText: string;
  options: {
    A?: string | null;
    B?: string | null;
    C?: string | null;
    D?: string | null;
  };
  selectedOption: string | null;
  isCorrect: boolean;
  marks: number;
  marksAwarded: number;
  correctOption: string | null;
  explanation: string | null;
};

type ResultVisibility = {
  showResultImmediately: boolean;
  showExplanationsImmediately: boolean;
};

type Screen = "loading" | "code" | "intro" | "taking" | "result" | "unavailable" | "error";

function formatRemainingTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatTakenTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return minutes === 0 ? `${seconds}s` : `${minutes}m ${seconds}s`;
}

function getRemainingSeconds(expiresAt: string) {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function assessmentCodeStorageKey(learnerId: string, testId: string) {
  return `heecoworld-assessment-code:${learnerId}:${testId}`;
}

export default function LearnerAssessmentPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading learner assessment..." />}>
      <LearnerAssessmentContent />
    </Suspense>
  );
}

function LearnerAssessmentContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawTestId = params.testId;
  const testId = Array.isArray(rawTestId) ? rawTestId[0] : rawTestId;
  const learnerId = searchParams.get("learnerId")?.trim() ?? "";
  const mode = searchParams.get("mode")?.trim();
const isPracticeMode = mode === "practice";

  const [screen, setScreen] = useState<Screen>("loading");
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [assessmentCode, setAssessmentCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [openingWithCode, setOpeningWithCode] = useState(false);
  const [codeRefreshKey, setCodeRefreshKey] = useState(0);
  const [test, setTest] = useState<LearnerTest | null>(null);
  const [learner, setLearner] = useState<Learner | null>(null);
  const [questions, setQuestions] = useState<LearnerQuestion[]>([]);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [starting, setStarting] = useState(false);
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ResultSummary | null>(null);
  const [resultQuestions, setResultQuestions] = useState<ResultQuestion[]>([]);
  const [resultVisibility, setResultVisibility] = useState<ResultVisibility | null>(null);

  const autoSubmitTriggeredRef = useRef(false);
  const activeQuestion = questions[activeQuestionIndex] ?? null;

  const answeredCount = useMemo(
    () => questions.filter((question) => Boolean(answers[question.id])).length,
    [answers, questions]
  );

  const progressPercentage =
    questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const getAccessToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      router.replace(
        `/login?redirectTo=${encodeURIComponent(
          `/my-learning/assessments/${testId}?learnerId=${learnerId}${isPracticeMode ? "&mode=practice" : ""}`
        )}`
      );
      return null;
    }

    return session.access_token;
  }, [learnerId, router, testId, isPracticeMode]);

  const hydrateAttempt = useCallback(
    async (attemptToken: string) => {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        return;
      }

      const response = await fetch(`/api/tests/attempts/${attemptToken}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Could not load this assessment attempt.");
      }

      const savedAnswers = (payload.answers ?? []).reduce(
        (
          map: Record<string, string>,
          answer: { test_question_id: string; selected_option: string | null }
        ) => {
          if (answer.selected_option) {
            map[answer.test_question_id] = answer.selected_option;
          }

          return map;
        },
        {}
      );

      const nextAttempt: Attempt = {
        id: payload.attempt.id,
        token: attemptToken,
        status: payload.attempt.status,
        startedAt: payload.attempt.startedAt,
        expiresAt: payload.attempt.expiresAt,
        submittedAt: payload.attempt.submittedAt ?? null,
        timeTakenSeconds: payload.attempt.timeTakenSeconds ?? null,
        score: payload.attempt.score ?? null,
        totalMarks: payload.attempt.totalMarks ?? null,
        percentage: payload.attempt.percentage ?? null,
      };

      setAttempt(nextAttempt);
      setAnswers(savedAnswers);

      if (nextAttempt.status === "in_progress") {
        autoSubmitTriggeredRef.current = false;
        setRemainingSeconds(getRemainingSeconds(nextAttempt.expiresAt));
        setScreen("taking");
        return;
      }

      const restoredResult = payload.result;
      const restoredQuestions: ResultQuestion[] = Array.isArray(restoredResult?.questions)
        ? restoredResult.questions.map(
            (question: {
              id: string;
              orderNumber: number;
              questionText: string;
              options?: { key: string; text: string | null }[];
              selectedOption?: string | null;
              isCorrect?: boolean;
              marks?: number;
              marksAwarded?: number;
              correctOption?: string | null;
              explanation?: string | null;
            }) => {
              const optionMap = (question.options ?? []).reduce(
                (map, option) => {
                  if (["A", "B", "C", "D"].includes(option.key)) {
                    map[option.key as "A" | "B" | "C" | "D"] = option.text;
                  }

                  return map;
                },
                {} as ResultQuestion["options"]
              );

              return {
                testQuestionId: question.id,
                orderNumber: question.orderNumber,
                questionText: question.questionText,
                options: optionMap,
                selectedOption: question.selectedOption ?? null,
                isCorrect: Boolean(question.isCorrect),
                marks: Number(question.marks ?? 0),
                marksAwarded: Number(question.marksAwarded ?? 0),
                correctOption: question.correctOption ?? null,
                explanation: question.explanation ?? null,
              };
            }
          )
        : [];

      setResult({
        status: nextAttempt.status,
        score: Number(nextAttempt.score ?? 0),
        totalMarks: Number(nextAttempt.totalMarks ?? 0),
        percentage: Number(nextAttempt.percentage ?? 0),
        timeTakenSeconds: Number(nextAttempt.timeTakenSeconds ?? 0),
      });
      setResultVisibility({
        showResultImmediately: Boolean(restoredResult),
        showExplanationsImmediately: Boolean(restoredResult?.showExplanationsImmediately),
      });
      setResultQuestions(restoredQuestions);
      setScreen("result");
    },
    [getAccessToken]
  );

  const submitTest = useCallback(
    async (submissionMode: "manual" | "auto") => {
      if (!attempt?.token || submitting) {
        return;
      }

      if (
        submissionMode === "manual" &&
        !window.confirm(
          `Submit this assessment now? ${learner?.fullName ?? "The learner"} has answered ${answeredCount} of ${questions.length} questions.`
        )
      ) {
        return;
      }

      const accessToken = await getAccessToken();

      if (!accessToken) {
        return;
      }

      try {
        setSubmitting(true);
        setActionError("");

        const response = await fetch(`/api/tests/attempts/${attempt.token}/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            submissionMode,
            answers: Object.entries(answers).map(([testQuestionId, selectedOption]) => ({
              testQuestionId,
              selectedOption,
            })),
          }),
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Could not submit this assessment.");
        }

        if (payload.alreadySubmitted) {
          await hydrateAttempt(attempt.token);
          return;
        }

        const returnedResult = payload.result;

        setResult({
          status: returnedResult.status,
          score: Number(returnedResult.score ?? 0),
          totalMarks: Number(returnedResult.totalMarks ?? 0),
          percentage: Number(returnedResult.percentage ?? 0),
          timeTakenSeconds: Number(returnedResult.timeTakenSeconds ?? 0),
        });
        setResultVisibility(
          payload.visibility ?? {
            showResultImmediately: true,
            showExplanationsImmediately: false,
          }
        );
        setResultQuestions(payload.questions ?? []);
        setAttempt((current) =>
          current ? { ...current, status: returnedResult.status } : current
        );
        setScreen("result");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        setActionError(
          error instanceof Error ? error.message : "Could not submit this assessment."
        );

        if (submissionMode === "auto") {
          autoSubmitTriggeredRef.current = false;
        }
      } finally {
        setSubmitting(false);
      }
    },
    [answers, answeredCount, attempt?.token, getAccessToken, hydrateAttempt, learner?.fullName, questions.length, submitting]
  );

  useEffect(() => {
    if (!testId || !learnerId) {
      setPageError("Open this assessment from the learner's My Learning page.");
      setScreen("error");
      return;
    }

    const storedAssessmentCode = window.sessionStorage
      .getItem(assessmentCodeStorageKey(learnerId, testId))
      ?.trim()
      .toUpperCase();

    let active = true;

    async function loadAssessment() {
      try {
        setScreen("loading");
        setPageError("");

        const accessToken = await getAccessToken();
        if (!accessToken) return;

       const query = new URLSearchParams({ learnerId });

if (!isPracticeMode && storedAssessmentCode) {
  query.set("assessmentCode", storedAssessmentCode);
}

const loadUrl = isPracticeMode
  ? `/api/practice-tests/${testId}?${query.toString()}`
  : `/api/learner-assessments/${testId}?${query.toString()}`;

const response = await fetch(loadUrl, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Could not open this assessment.");
        }
        if (!active) return;

        if (payload.availability === "not_started") {
          setPageError("This assessment has not started yet.");
          setScreen("unavailable");
          return;
        }
        if (payload.availability === "closed") {
          setPageError("This assessment is no longer available.");
          setScreen("unavailable");
          return;
        }

        setTest(payload.test);
        setLearner(payload.learner);
        setQuestions(payload.questions ?? []);

        if (payload.learnerAttempt?.token) {
          await hydrateAttempt(payload.learnerAttempt.token);
        } else {
          setScreen("intro");
        }
      } catch (error) {
        if (!active) return;
       if (storedAssessmentCode && learnerId && testId) {
  window.sessionStorage.removeItem(
    assessmentCodeStorageKey(learnerId, testId)
  );
}
        setPageError(error instanceof Error ? error.message : "Could not open this assessment.");
        setScreen("error");
      }
    }

    void loadAssessment();
    return () => { active = false; };
  }, [codeRefreshKey, getAccessToken, hydrateAttempt, learnerId, testId, isPracticeMode]);

  useEffect(() => {
    if (
      screen !== "taking" ||
      !attempt?.expiresAt ||
      attempt.status !== "in_progress"
    ) {
      return;
    }

    const updateTimer = () => {
      const secondsLeft = getRemainingSeconds(attempt.expiresAt);
      setRemainingSeconds(secondsLeft);

      if (secondsLeft <= 0 && !autoSubmitTriggeredRef.current) {
        autoSubmitTriggeredRef.current = true;
        void submitTest("auto");
      }
    };

    updateTimer();
    const timerId = window.setInterval(updateTimer, 1000);

    return () => window.clearInterval(timerId);
  }, [attempt?.expiresAt, attempt?.status, screen, submitTest]);

  async function handleStartOrResume() {
    if (!testId || !learnerId) {
      return;
    }

    const savedAssessmentCode = window.sessionStorage
      .getItem(assessmentCodeStorageKey(learnerId, testId))
      ?.trim()
      .toUpperCase();

   if (!isPracticeMode && !savedAssessmentCode) {
  setActionError("Enter the assessment code before starting this test.");
  setScreen("code");
  return;
}

    const accessToken = await getAccessToken();

    if (!accessToken) {
      return;
    }

    try {
      setStarting(true);
      setActionError("");

      const startUrl = isPracticeMode
  ? `/api/practice-tests/${testId}/start`
  : `/api/learner-assessments/${testId}/start`;

const response = await fetch(startUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      body: JSON.stringify(
  isPracticeMode
    ? { learnerId }
    : { learnerId, assessmentCode: savedAssessmentCode }
),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Could not start this assessment.");
      }

      const nextAttempt: Attempt = {
        id: payload.attempt.id,
        token: payload.attempt.token,
        status: payload.attempt.status,
        startedAt: payload.attempt.startedAt,
        expiresAt: payload.attempt.expiresAt,
        submittedAt: payload.attempt.submittedAt ?? null,
        timeTakenSeconds: payload.attempt.timeTakenSeconds ?? null,
        score: payload.attempt.score ?? null,
        totalMarks: payload.attempt.totalMarks ?? null,
        percentage: payload.attempt.percentage ?? null,
      };

      if (payload.mode === "completed") {
        await hydrateAttempt(nextAttempt.token);
        return;
      }

      autoSubmitTriggeredRef.current = false;
      setAttempt(nextAttempt);
      setAnswers({});
      setActiveQuestionIndex(0);
      setRemainingSeconds(getRemainingSeconds(nextAttempt.expiresAt));
      setScreen("taking");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not start this assessment."
      );
    } finally {
      setStarting(false);
    }
  }

  async function handleSelectAnswer(
    questionId: string,
    selectedOption: "A" | "B" | "C" | "D"
  ) {
    if (!attempt?.token || submitting) {
      return;
    }

    const previousAnswers = answers;

    setAnswers((current) => ({
      ...current,
      [questionId]: selectedOption,
    }));

    const accessToken = await getAccessToken();

    if (!accessToken) {
      setAnswers(previousAnswers);
      return;
    }

    try {
      setSavingQuestionId(questionId);
      setActionError("");

      const response = await fetch(`/api/tests/attempts/${attempt.token}/answers`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          testQuestionId: questionId,
          selectedOption,
        }),
      });
      const payload = await response.json();

      if (response.status === 410 && payload?.shouldAutoSubmit) {
        autoSubmitTriggeredRef.current = true;
        await submitTest("auto");
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "Could not save this answer.");
      }
    } catch (error) {
      setAnswers(previousAnswers);
      setActionError(
        error instanceof Error ? error.message : "Could not save this answer."
      );
    } finally {
      setSavingQuestionId(null);
    }
  }

  async function handleAssessmentCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!testId || !learnerId) {
      return;
    }

    const code = assessmentCode.trim().toUpperCase();

    if (!code) {
      setCodeError("Enter the assessment code shared by the teacher.");
      return;
    }

    try {
      setOpeningWithCode(true);
      setCodeError("");

      const accessToken = await getAccessToken();

      if (!accessToken) {
        return;
      }

      const response = await fetch(
        "/api/learner-assessments/resolve-code",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            learnerId,
            assessmentCode: code,
          }),
        }
      );

      const payload = await response.json();

      if (!response.ok || !payload?.test?.id) {
        throw new Error(
          payload?.error || "This assessment code could not be used for this learner."
        );
      }

      if (payload.test.id !== testId) {
        throw new Error("This code belongs to a different assessment.");
      }

      window.sessionStorage.setItem(
        assessmentCodeStorageKey(learnerId, testId),
        code
      );
      setCodeRefreshKey((current) => current + 1);
    } catch (error) {
      setCodeError(
        error instanceof Error
          ? error.message
          : "This assessment code could not be used for this learner."
      );
    } finally {
      setOpeningWithCode(false);
    }
  }

  function goToQuestion(index: number) {
    if (index < 0 || index >= questions.length) {
      return;
    }

    setActiveQuestionIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (screen === "loading") {
    return <LoadingState label="Loading learner assessment..." />;
  }

  if (screen === "code") {
    return (
      <main className="min-h-screen bg-[#F8F1E7] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-xl">
          <Link
            href="/my-learning"
            className="text-sm font-semibold text-[#B58A34] hover:text-[#071B33]"
          >
            ← Back to My Learning
          </Link>

          <section className="mt-4 rounded-3xl border border-[#071B33]/10 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F8F1E7] text-[#B58A34]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-[#071B33]">
              Enter assessment code
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Enter the code provided by the teacher to start this assessment.
              It must match this learner&apos;s school, curriculum, and academic level.
            </p>

            <form onSubmit={handleAssessmentCodeSubmit} className="mt-6">
              <label className="text-sm font-semibold text-[#071B33]">
                Assessment code
              </label>
              <input
                value={assessmentCode}
                onChange={(event) =>
                  setAssessmentCode(event.target.value.toUpperCase())
                }
                placeholder="Example: A4K92P1M"
                autoCapitalize="characters"
                autoComplete="off"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold tracking-[0.08em] text-[#071B33] outline-none transition placeholder:tracking-normal placeholder:text-slate-400 focus:border-[#B58A34] focus:ring-4 focus:ring-[#F8F1E7]"
              />

              {codeError && (
                <p className="mt-3 text-sm leading-6 text-red-700">
                  {codeError}
                </p>
              )}

              <button
                type="submit"
                disabled={openingWithCode}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#071B33] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0B2A4D] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {openingWithCode ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking code...
                  </>
                ) : (
                  "Open assessment"
                )}
              </button>
            </form>
          </section>
        </div>
      </main>
    );
  }

  if (screen === "unavailable" || screen === "error" || !test) {
    return (
      <main className="min-h-screen bg-[#F8F1E7] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-white p-7 shadow-sm">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <h1 className="text-xl font-bold text-[#071B33]">Assessment unavailable</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {pageError || "This assessment is not available."}
              </p>
              <Link
                href="/my-learning"
                className="mt-5 inline-flex rounded-full bg-[#071B33] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Back to My Learning
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "intro") {
    return (
      <main className="min-h-screen bg-[#F8F1E7] px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-2xl">
          <Link href="/my-learning" className="text-sm font-semibold text-[#B58A34] hover:text-[#071B33]">
            ← Back to My Learning
          </Link>
          <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D6B46A]/40 bg-[#F8F1E7] px-3 py-1.5 text-xs font-bold text-[#071B33]">
              <ShieldCheck className="h-3.5 w-3.5" />
              {isPracticeMode ? "Practice test" : "School assessment"}
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-[#071B33]">{test.title}</h1>
            <p className="mt-3 text-sm font-medium text-slate-600">
              {[test.curriculumName, test.classLevel, test.subject].filter(Boolean).join(" · ")}
            </p>
            {test.topic && <p className="mt-2 text-sm text-[#B58A34]">{test.topic}</p>}
            <p className="mt-4 text-sm leading-6 text-slate-600">
             {isPracticeMode ? (
  <>Created for practice by Scoolyx for {learner?.fullName ?? "this learner"}.</>
) : (
  <>Created by <span className="font-semibold text-[#071B33]">{test.teacherName}</span> for {learner?.fullName ?? "this learner"}.</>
)}
            </p>
            {test.instructions && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Instructions</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{test.instructions}</p>
              </div>
            )}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <InfoCard icon={<Timer className="h-4 w-4" />} label="Duration" value={`${test.durationMinutes} min`} />
              <InfoCard icon={<Clock3 className="h-4 w-4" />} label="Questions" value={String(test.totalQuestions)} />
              <InfoCard icon={<CheckCircle2 className="h-4 w-4" />} label="Total marks" value={String(test.totalMarks)} />
            </div>
            {actionError && <ErrorBanner message={actionError} />}
            <div className="mt-8 border-t border-slate-100 pt-7">
              <h2 className="text-lg font-bold text-[#071B33]">Ready to begin?</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                The timer starts only after you press Start Assessment. Answers save automatically, and this learner can take the assessment only once.
              </p>
              <button
                type="button"
                onClick={handleStartOrResume}
                disabled={starting}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#071B33] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0B2A4D] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {starting ? <><Loader2 className="h-4 w-4 animate-spin" /> Starting assessment...</> : <><Play className="h-4 w-4" /> Start Assessment</>}
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (screen === "result" && result) {
    const showScore = resultVisibility?.showResultImmediately ?? false;
    const showExplanations = resultVisibility?.showExplanationsImmediately ?? false;

    return (
      <main className="min-h-screen bg-[#F8F1E7] px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-3xl">
          <section className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-9">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-800"><CheckCircle2 className="h-6 w-6" /></div>
              <div>
                <p className="text-sm font-bold text-emerald-800">
                  {result.status === "auto_submitted" ? "Time ended — assessment submitted automatically" : "Assessment submitted successfully"}
                </p>
                <h1 className="mt-1 text-2xl font-bold text-[#071B33]">{test.title}</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {showScore ? "The result is ready." : "Responses have been saved. The teacher will release the result later."}
                </p>
              </div>
            </div>
            {showScore && (
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <ResultCard label="Score" value={`${result.score} / ${result.totalMarks}`} />
                <ResultCard label="Percentage" value={`${result.percentage}%`} />
                <ResultCard label="Time taken" value={formatTakenTime(result.timeTakenSeconds)} />
              </div>
            )}
            <Link href="/my-learning" className="mt-7 inline-flex rounded-full bg-[#071B33] px-5 py-3 text-sm font-semibold text-white">
              Back to My Learning
            </Link>
          </section>
          {showExplanations && resultQuestions.length > 0 && (
            <section className="mt-6 space-y-4">
              {resultQuestions.map((question) => (
                <article key={question.testQuestionId} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#071B33] px-2.5 py-1 text-xs font-bold text-white">Question {question.orderNumber}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${question.isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{question.isCorrect ? "Correct" : "Incorrect"}</span>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">{question.marksAwarded} / {question.marks} marks</span>
                  </div>
                  <h2 className="mt-4 text-base font-semibold leading-7 text-[#071B33]">{question.questionText}</h2>
                  <div className="mt-4 grid gap-2">
                    {(["A", "B", "C", "D"] as const).map((optionKey) => {
                      const optionText = question.options?.[optionKey];
                      if (!optionText) return null;
                      const isSelected = question.selectedOption === optionKey;
                      const isCorrect = question.correctOption === optionKey;
                      return <div key={optionKey} className={`rounded-xl border px-4 py-3 text-sm ${isCorrect ? "border-emerald-200 bg-emerald-50 text-emerald-950" : isSelected ? "border-red-200 bg-red-50 text-red-950" : "border-slate-200 bg-slate-50 text-slate-700"}`}><span className="mr-2 font-bold">{optionKey}.</span>{optionText}</div>;
                    })}
                  </div>
                  {question.explanation && <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-sky-700">Explanation</p><p className="mt-2 text-sm leading-6 text-sky-950">{question.explanation}</p></div>}
                </article>
              ))}
            </section>
          )}
        </div>
      </main>
    );
  }

  if (!activeQuestion || !attempt) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#F8F1E7] pb-28">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0"><p className="truncate text-sm font-bold text-[#071B33]">{test.title}</p><p className="mt-1 text-xs font-medium text-slate-500">Question {activeQuestionIndex + 1} of {questions.length}</p></div>
          <div className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${remainingSeconds <= 60 ? "bg-red-100 text-red-800" : "bg-[#071B33] text-white"}`}><Clock3 className="h-4 w-4" />{formatRemainingTime(remainingSeconds)}</div>
        </div>
        <div className="h-1 bg-slate-100"><div className="h-full bg-[#B58A34] transition-all duration-300" style={{ width: `${Math.min(100, ((activeQuestionIndex + 1) / questions.length) * 100)}%` }} /></div>
      </header>
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_220px]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#071B33] px-2.5 py-1 text-xs font-bold text-white">Question {activeQuestion.orderNumber}</span>{activeQuestion.difficulty && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{activeQuestion.difficulty}</span>}<span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">{activeQuestion.marks} mark{activeQuestion.marks === 1 ? "" : "s"}</span></div>
          <h1 className="mt-6 text-lg font-semibold leading-8 text-[#071B33] sm:text-xl">{activeQuestion.questionText}</h1>
          <div className="mt-6 grid gap-3">
            {(["A", "B", "C", "D"] as const).map((optionKey) => {
              const optionText = activeQuestion.options[optionKey];
              if (!optionText) return null;
              const isSelected = answers[activeQuestion.id] === optionKey;
              return <button key={optionKey} type="button" disabled={submitting} onClick={() => handleSelectAnswer(activeQuestion.id, optionKey)} className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left text-sm transition ${isSelected ? "border-[#071B33] bg-[#071B33] text-white" : "border-slate-200 bg-white text-slate-800 hover:border-[#B58A34] hover:bg-[#F8F1E7]"} disabled:cursor-not-allowed disabled:opacity-60`}><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isSelected ? "bg-white text-[#071B33]" : "bg-[#F8F1E7] text-[#071B33]"}`}>{optionKey}</span><span className="leading-6">{optionText}</span></button>;
            })}
          </div>
          <div className="mt-5 min-h-5 text-xs font-medium text-slate-500">{savingQuestionId === activeQuestion.id ? "Saving answer..." : answers[activeQuestion.id] ? "Answer saved" : "Select one option to answer"}</div>
          {actionError && <ErrorBanner message={actionError} />}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={() => goToQuestion(activeQuestionIndex - 1)} disabled={activeQuestionIndex === 0 || submitting} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#071B33] disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" />Previous</button>
            {activeQuestionIndex === questions.length - 1 ? <button type="button" onClick={() => void submitTest("manual")} disabled={submitting} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#071B33] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</> : <><CheckCircle2 className="h-4 w-4" />Submit assessment</>}</button> : <button type="button" onClick={() => goToQuestion(activeQuestionIndex + 1)} disabled={submitting} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#071B33] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">Next<ChevronRight className="h-4 w-4" /></button>}
          </div>
        </section>
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-bold text-[#071B33]">Progress</p><span className="text-xs font-bold text-slate-600">{answeredCount}/{questions.length}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#B58A34] transition-all" style={{ width: `${progressPercentage}%` }} /></div><div className="mt-5 grid grid-cols-5 gap-2">{questions.map((question, index) => { const hasAnswer = Boolean(answers[question.id]); const isActive = index === activeQuestionIndex; return <button key={question.id} type="button" onClick={() => goToQuestion(index)} disabled={submitting} className={`flex aspect-square items-center justify-center rounded-lg text-xs font-bold transition ${isActive ? "bg-[#071B33] text-white" : hasAnswer ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{index + 1}</button>; })}</div><button type="button" onClick={() => void submitTest("manual")} disabled={submitting} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#071B33] disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</> : <><CheckCircle2 className="h-4 w-4" />Submit assessment</>}</button></aside>
      </div>
    </main>
  );
}

function LoadingState({ label }: { label: string }) {
  return <main className="min-h-screen bg-[#F8F1E7] px-4 py-10 sm:px-6"><div className="mx-auto flex max-w-xl items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-20"><Loader2 className="mr-3 h-5 w-5 animate-spin text-[#071B33]" /><p className="text-sm font-semibold text-slate-700">{label}</p></div></main>;
}

function ErrorBanner({ message }: { message: string }) {
  return <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">{message}</div>;
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center gap-2 text-slate-500">{icon}<span className="text-xs font-semibold">{label}</span></div><p className="mt-2 text-lg font-bold text-[#071B33]">{value}</p></div>;
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p><p className="mt-2 text-xl font-bold text-[#071B33]">{value}</p></div>;
}
