"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Play,
  ShieldCheck,
  Timer,
} from "lucide-react";

type PublicQuestion = {
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

type PublicTest = {
  id: string;
  title: string;
  curriculumName: string | null;
  classLevel: string;
  subject: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  instructions: string | null;
};

type Attempt = {
  id: string;
  token: string;
  studentName: string;
  classOrGrade: string | null;
  attemptNumber: number;
  status: "in_progress" | "submitted" | "auto_submitted";
  startedAt: string;
  expiresAt: string;
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

type Screen =
  | "loading"
  | "intro"
  | "taking"
  | "result"
  | "unavailable"
  | "error";

function formatRemainingTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

function formatTakenTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

function getRemainingSeconds(expiresAt: string) {
  return Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)
  );
}

export default function StudentTestPage() {
  const params = useParams();

  const rawShareCode = params.shareCode;
  const shareCode = Array.isArray(rawShareCode)
    ? rawShareCode[0]
    : rawShareCode;

  const storageKey = useMemo(
    () => `heecoworld_test_attempt_${shareCode ?? "unknown"}`,
    [shareCode]
  );

  const [screen, setScreen] = useState<Screen>("loading");
  const [pageError, setPageError] = useState("");

  const [test, setTest] = useState<PublicTest | null>(null);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);

  const [studentName, setStudentName] = useState("");
  const [classOrGrade, setClassOrGrade] = useState("");

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const [starting, setStarting] = useState(false);
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);

  const [actionError, setActionError] = useState("");

  const [result, setResult] = useState<ResultSummary | null>(null);
  const [resultQuestions, setResultQuestions] = useState<ResultQuestion[]>([]);
  const [resultVisibility, setResultVisibility] =
    useState<ResultVisibility | null>(null);

  const autoSubmitTriggeredRef = useRef(false);

  const activeQuestion = questions[activeQuestionIndex] ?? null;

  const answeredCount = useMemo(
    () =>
      questions.filter((question) => Boolean(answers[question.id])).length,
    [answers, questions]
  );

  const progressPercentage =
    questions.length > 0
      ? Math.round((answeredCount / questions.length) * 100)
      : 0;

  const submitTest = useCallback(
    async (submissionMode: "manual" | "auto") => {
      if (!attempt?.token || submitting) {
        return;
      }

      if (
        submissionMode === "manual" &&
        !window.confirm(
          `Submit your test now? You have answered ${answeredCount} of ${questions.length} questions.`
        )
      ) {
        return;
      }

      try {
        setSubmitting(true);
        setActionError("");

        const answerPayload = Object.entries(answers).map(
          ([testQuestionId, selectedOption]) => ({
            testQuestionId,
            selectedOption,
          })
        );

        const response = await fetch(
          `/api/tests/attempts/${attempt.token}/submit`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              submissionMode,
              answers: answerPayload,
            }),
          }
        );

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Could not submit this test.");
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
            showExplanationsImmediately: true,
          }
        );

        setResultQuestions(payload.questions ?? []);

        setAttempt((current) =>
          current
            ? {
                ...current,
                status: returnedResult.status,
              }
            : current
        );

        setScreen("result");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (submitError) {
        setActionError(
          submitError instanceof Error
            ? submitError.message
            : "Could not submit this test."
        );

        if (submissionMode === "auto") {
          autoSubmitTriggeredRef.current = false;
        }
      } finally {
        setSubmitting(false);
      }
    },
    [answers, answeredCount, attempt?.token, questions.length, submitting]
  );

  useEffect(() => {
    if (!shareCode) {
      setPageError("Test link is incomplete.");
      setScreen("error");
      return;
    }

    let active = true;

    async function loadTest() {
      try {
        setScreen("loading");
        setPageError("");

        const response = await fetch(`/api/tests/${shareCode}`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(
            payload?.error || "Could not load this test."
          );
        }

        if (!active) {
          return;
        }

        if (payload.availability === "not_started") {
          setPageError("This test has not started yet.");
          setScreen("unavailable");
          return;
        }

        if (payload.availability === "closed") {
          setPageError("This test is no longer available.");
          setScreen("unavailable");
          return;
        }

        if (payload.availability !== "available") {
          throw new Error("This test is unavailable.");
        }

        setTest(payload.test);
        setQuestions(payload.questions ?? []);

        const savedToken = window.localStorage.getItem(storageKey);

        if (!savedToken) {
          setScreen("intro");
          return;
        }

        const attemptResponse = await fetch(
          `/api/tests/attempts/${savedToken}`
        );

        const attemptPayload = await attemptResponse.json();

        if (!attemptResponse.ok) {
          window.localStorage.removeItem(storageKey);
          setScreen("intro");
          return;
        }

        if (!active) {
          return;
        }

        const savedAnswers = (attemptPayload.answers ?? []).reduce(
          (
            map: Record<string, string>,
            answer: {
              test_question_id: string;
              selected_option: string | null;
            }
          ) => {
            if (answer.selected_option) {
              map[answer.test_question_id] = answer.selected_option;
            }

            return map;
          },
          {}
        );

        setAnswers(savedAnswers);

        const resumedAttempt: Attempt = {
          id: attemptPayload.attempt.id,
          token: savedToken,
          studentName: attemptPayload.attempt.studentName,
          classOrGrade: attemptPayload.attempt.classOrGrade,
          attemptNumber: attemptPayload.attempt.attemptNumber,
          status: attemptPayload.attempt.status,
          startedAt: attemptPayload.attempt.startedAt,
          expiresAt: attemptPayload.attempt.expiresAt,
        };

        setAttempt(resumedAttempt);
        setStudentName(resumedAttempt.studentName);
        setClassOrGrade(resumedAttempt.classOrGrade ?? "");

        if (resumedAttempt.status === "in_progress") {
          autoSubmitTriggeredRef.current = false;
          setRemainingSeconds(getRemainingSeconds(resumedAttempt.expiresAt));
          setScreen("taking");
          return;
        }

       const restoredResult = attemptPayload.result;

const restoredQuestions: ResultQuestion[] = Array.isArray(
  restoredResult?.questions
)
  ? restoredResult.questions.map(
      (question: {
        id: string;
        orderNumber: number;
        questionText: string;
        options?: {
          key: string;
          text: string | null;
        }[];
        selectedOption?: string | null;
        isCorrect?: boolean;
        marks?: number;
        marksAwarded?: number;
        correctOption?: string | null;
        explanation?: string | null;
      }) => {
        const restoredOptions = (question.options ?? []).reduce(
          (optionMap, option) => {
            if (
              option.key === "A" ||
              option.key === "B" ||
              option.key === "C" ||
              option.key === "D"
            ) {
              optionMap[option.key] = option.text;
            }

            return optionMap;
          },
          {} as ResultQuestion["options"]
        );

        return {
          testQuestionId: question.id,
          orderNumber: question.orderNumber,
          questionText: question.questionText,
          options: restoredOptions,
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
  status: resumedAttempt.status,
  score: Number(attemptPayload.attempt.score ?? 0),
  totalMarks: Number(attemptPayload.attempt.totalMarks ?? 0),
  percentage: Number(attemptPayload.attempt.percentage ?? 0),
  timeTakenSeconds: Number(
    attemptPayload.attempt.timeTakenSeconds ?? 0
  ),
});

setResultVisibility({
  showResultImmediately: Boolean(restoredResult),
  showExplanationsImmediately: Boolean(
    restoredResult?.showExplanationsImmediately
  ),
});

setResultQuestions(restoredQuestions);
setScreen("result");
      } catch (error) {
        if (!active) {
          return;
        }

        setPageError(
          error instanceof Error
            ? error.message
            : "Could not load this test."
        );
        setScreen("error");
      }
    }

    void loadTest();

    return () => {
      active = false;
    };
  }, [shareCode, storageKey]);

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

    return () => {
      window.clearInterval(timerId);
    };
  }, [attempt?.expiresAt, attempt?.status, screen, submitTest]);

  async function handleStartTest() {
    if (!shareCode || !studentName.trim()) {
      setActionError("Please enter the student's name.");
      return;
    }

    try {
      setStarting(true);
      setActionError("");

      const response = await fetch(`/api/tests/${shareCode}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentName: studentName.trim(),
          classOrGrade: classOrGrade.trim() || null,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Could not start this test.");
      }

      const createdAttempt: Attempt = {
        id: payload.attempt.id,
        token: payload.attempt.token,
        studentName: payload.attempt.studentName,
        classOrGrade: payload.attempt.classOrGrade,
        attemptNumber: payload.attempt.attemptNumber,
        status: payload.attempt.status,
        startedAt: payload.attempt.startedAt,
        expiresAt: payload.attempt.expiresAt,
      };

      window.localStorage.setItem(storageKey, createdAttempt.token);

      autoSubmitTriggeredRef.current = false;
      setAttempt(createdAttempt);
      setAnswers({});
      setActiveQuestionIndex(0);
      setRemainingSeconds(getRemainingSeconds(createdAttempt.expiresAt));
      setScreen("taking");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (startError) {
      setActionError(
        startError instanceof Error
          ? startError.message
          : "Could not start this test."
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

    setAnswers((current) => ({
      ...current,
      [questionId]: selectedOption,
    }));

    try {
      setSavingQuestionId(questionId);
      setActionError("");

      const response = await fetch(
        `/api/tests/attempts/${attempt.token}/answers`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            testQuestionId: questionId,
            selectedOption,
          }),
        }
      );

      const payload = await response.json();

      if (response.status === 410 && payload?.shouldAutoSubmit) {
        autoSubmitTriggeredRef.current = true;
        await submitTest("auto");
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "Could not save this answer.");
      }
    } catch (saveError) {
      setActionError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save this answer."
      );
    } finally {
      setSavingQuestionId(null);
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
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-xl items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-20">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-slate-800" />
          <p className="text-sm font-semibold text-slate-700">
            Loading your test...
          </p>
        </div>
      </main>
    );
  }

  if (screen === "unavailable" || screen === "error" || !test) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-white p-7 shadow-sm">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <h1 className="text-xl font-bold text-slate-950">
                Test unavailable
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {pageError || "This test link is not available."}
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "intro") {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              Curriculum-aligned assessment
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
              {test.title}
            </h1>

            <p className="mt-3 text-sm font-medium text-slate-600">
              {[test.curriculumName, test.classLevel, test.subject]
                .filter(Boolean)
                .join(" · ")}
            </p>

            {test.instructions && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Instructions
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {test.instructions}
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <InfoCard
                icon={<Timer className="h-4 w-4" />}
                label="Duration"
                value={`${test.durationMinutes} min`}
              />

              <InfoCard
                icon={<Clock3 className="h-4 w-4" />}
                label="Questions"
                value={String(test.totalQuestions)}
              />

              <InfoCard
                icon={<CheckCircle2 className="h-4 w-4" />}
                label="Total marks"
                value={String(test.totalMarks)}
              />
            </div>

            {actionError && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
                {actionError}
              </div>
            )}

            <div className="mt-8 border-t border-slate-100 pt-7">
              <h2 className="text-lg font-bold text-slate-950">
                Start your attempt
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                The timer starts only after you press Start Test. Your selected
                answers are saved automatically.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-800">
                    Student name <span className="text-red-600">*</span>
                  </span>

                  <input
                    value={studentName}
                    onChange={(event) => setStudentName(event.target.value)}
                    placeholder="Enter student name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-800">
                    Class / grade <span className="text-slate-400">(optional)</span>
                  </span>

                  <input
                    value={classOrGrade}
                    onChange={(event) => setClassOrGrade(event.target.value)}
                    placeholder={`Example: Class ${test.classLevel}`}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={handleStartTest}
                disabled={starting || !studentName.trim()}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {starting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting test...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Start Test
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "result" && result) {
    const showScore = resultVisibility?.showResultImmediately ?? true;
    const showExplanations =
      resultVisibility?.showExplanationsImmediately ?? false;

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-3xl">
          <section className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-9">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-800">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm font-bold text-emerald-800">
                  {result.status === "auto_submitted"
                    ? "Time ended — test submitted automatically"
                    : "Test submitted successfully"}
                </p>

                <h1 className="mt-1 text-2xl font-bold text-slate-950">
                  {test.title}
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {showScore
                    ? "Your result is ready."
                    : "Your responses have been saved. Your teacher will release the result later."}
                </p>
              </div>
            </div>

            {showScore && (
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <ResultCard
                  label="Score"
                  value={`${result.score} / ${result.totalMarks}`}
                />

                <ResultCard
                  label="Percentage"
                  value={`${result.percentage}%`}
                />

                <ResultCard
                  label="Time taken"
                  value={formatTakenTime(result.timeTakenSeconds)}
                />
              </div>
            )}

            {showExplanations && resultQuestions.length > 0 && (
              <p className="mt-7 text-sm font-semibold text-slate-900">
                Review your answers and explanations below.
              </p>
            )}

            {!showExplanations && showScore && (
              <p className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Your score is available. Detailed explanations are not enabled
                for this test yet.
              </p>
            )}
          </section>

          {showExplanations && resultQuestions.length > 0 && (
            <section className="mt-6 space-y-4">
              {resultQuestions.map((question) => (
                <article
                  key={question.testQuestionId}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-bold text-white">
                      Question {question.orderNumber}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        question.isCorrect
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {question.isCorrect ? "Correct" : "Incorrect"}
                    </span>

                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                      {question.marksAwarded} / {question.marks} marks
                    </span>
                  </div>

                  <h2 className="mt-4 text-base font-semibold leading-7 text-slate-950">
                    {question.questionText}
                  </h2>

                  <div className="mt-4 grid gap-2">
                    {(["A", "B", "C", "D"] as const).map((optionKey) => {
                      const optionText = question.options?.[optionKey];

                      if (!optionText) {
                        return null;
                      }

                      const isSelected = question.selectedOption === optionKey;
                      const isCorrect = question.correctOption === optionKey;

                      return (
                        <div
                          key={optionKey}
                          className={`rounded-xl border px-4 py-3 text-sm ${
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
                              Your answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

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
          )}
        </div>
      </main>
    );
  }

  if (!activeQuestion || !attempt) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-28">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-950">
              {test.title}
            </p>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Question {activeQuestionIndex + 1} of {questions.length}
            </p>
          </div>

          <div
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${
              remainingSeconds <= 60
                ? "bg-red-100 text-red-800"
                : "bg-slate-950 text-white"
            }`}
          >
            <Clock3 className="h-4 w-4" />
            {formatRemainingTime(remainingSeconds)}
          </div>
        </div>

        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-slate-950 transition-all duration-300"
            style={{
              width: `${Math.min(
                100,
                ((activeQuestionIndex + 1) / questions.length) * 100
              )}%`,
            }}
          />
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_220px]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-bold text-white">
              Question {activeQuestion.orderNumber}
            </span>

            {activeQuestion.difficulty && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                {activeQuestion.difficulty.charAt(0).toUpperCase() +
                  activeQuestion.difficulty.slice(1)}
              </span>
            )}

            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
              {activeQuestion.marks} mark
              {activeQuestion.marks === 1 ? "" : "s"}
            </span>
          </div>

          <h1 className="mt-6 text-lg font-semibold leading-8 text-slate-950 sm:text-xl">
            {activeQuestion.questionText}
          </h1>

          <div className="mt-6 grid gap-3">
            {(["A", "B", "C", "D"] as const).map((optionKey) => {
              const optionText = activeQuestion.options[optionKey];

              if (!optionText) {
                return null;
              }

              const isSelected = answers[activeQuestion.id] === optionKey;

              return (
                <button
                  key={optionKey}
                  type="button"
                  disabled={submitting}
                  onClick={() =>
                    handleSelectAnswer(activeQuestion.id, optionKey)
                  }
                  className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left text-sm transition ${
                    isSelected
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isSelected
                        ? "bg-white text-slate-950"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {optionKey}
                  </span>

                  <span className="leading-6">{optionText}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 min-h-5 text-xs font-medium text-slate-500">
            {savingQuestionId === activeQuestion.id
              ? "Saving your answer..."
              : answers[activeQuestion.id]
                ? "Answer saved"
                : "Select one option to answer"}
          </div>

          {actionError && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
              {actionError}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => goToQuestion(activeQuestionIndex - 1)}
              disabled={activeQuestionIndex === 0 || submitting}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            {activeQuestionIndex === questions.length - 1 ? (
              <button
                type="button"
                onClick={() => void submitTest("manual")}
                disabled={submitting}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit test
                    <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goToQuestion(activeQuestionIndex + 1)}
                disabled={submitting}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-950">Your progress</p>

            <span className="text-xs font-bold text-slate-600">
              {answeredCount}/{questions.length}
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="mt-5 grid grid-cols-5 gap-2">
            {questions.map((question, index) => {
              const hasAnswer = Boolean(answers[question.id]);
              const isActive = index === activeQuestionIndex;

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => goToQuestion(index)}
                  disabled={submitting}
                  className={`flex aspect-square items-center justify-center rounded-lg text-xs font-bold transition ${
                    isActive
                      ? "bg-slate-950 text-white"
                      : hasAnswer
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  } disabled:cursor-not-allowed`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => void submitTest("manual")}
            disabled={submitting}
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit test
                <CheckCircle2 className="h-4 w-4" />
              </>
            )}
          </button>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white p-3 lg:hidden">
        <button
          type="button"
          onClick={() => void submitTest("manual")}
          disabled={submitting}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit test
              <CheckCircle2 className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </main>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-semibold">{label}</span>
      </div>

      <p className="mt-2 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}

function ResultCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-slate-950">{value}</p>
    </div>
  );
}