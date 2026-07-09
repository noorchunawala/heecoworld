"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  Loader2,
  LockKeyhole,
  Trash2,
  RefreshCw,X , Plus ,Copy,
Send ,ArrowDown,
ArrowUp,BarChart3
} from "lucide-react";
import { supabase } from "@/lib/SupabaseClient";

type Curriculum = {
  id: string;
  code: string;
  display_name: string;
};

type Test = {
  id: string;
  title: string;
  class_level: string;
  subject: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  status: "draft" | "published" | "closed";
  access_mode: string;
  share_code: string | null;
  instructions: string | null;
  difficulty_mix: {
    easy?: number;
    medium?: number;
    hard?: number;
  };
  show_result_immediately: boolean;
  show_explanations_immediately: boolean;
  created_at: string;
  curricula: Curriculum | Curriculum[] | null;
};

type TestSection = {
  id: string;
  curriculum_section_id: string;
  curriculum_sections:
    | {
        id: string;
        section_code: string | null;
        topic_name_exact: string;
      }
    | {
        id: string;
        section_code: string | null;
        topic_name_exact: string;
      }[]
    | null;
};

type QuestionSnapshot = {
  question_type?: string;
  difficulty?: string;
  language?: string;
  question_text?: string;
  options?: {
    A?: string | null;
    B?: string | null;
    C?: string | null;
    D?: string | null;
  };
  correct_option?: "A" | "B" | "C" | "D" | null;
  correct_answer_text?: string | null;
  explanation?: string | null;
};

type TestQuestion = {
  id: string;
  question_id: string | null;
  curriculum_section_id: string | null;
  source_type: "question_bank" | "teacher_custom";
  order_number: number;
  question_snapshot: QuestionSnapshot;
  marks: number;
  negative_marks: number;
};
type SwapCandidate = {
  id: string;
  question_type: string;
  difficulty: string;
  question_text: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_option: "A" | "B" | "C" | "D" | null;
  correct_answer_text: string | null;
  explanation: string;
  marks: number;
  negative_marks: number;
  inclusion_tags: unknown;
};

type DraftPayload = {
  test: Test;
  sections: TestSection[];
  questions: TestQuestion[];
};

function getCurriculum(test: Test): Curriculum | null {
  if (Array.isArray(test.curricula)) {
    return test.curricula[0] ?? null;
  }

  return test.curricula;
}

function getSection(section: TestSection) {
  if (Array.isArray(section.curriculum_sections)) {
    return section.curriculum_sections[0] ?? null;
  }

  return section.curriculum_sections;
}

function difficultyLabel(difficulty?: string) {
  if (!difficulty) {
    return "Question";
  }

  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

export default function AssessmentDraftPage() {
  const params = useParams();

const rawSchoolId = params.schoolId;
const schoolId = Array.isArray(rawSchoolId)
  ? rawSchoolId[0]
  : rawSchoolId;

const rawTestId = params.testId;
const testId = Array.isArray(rawTestId) ? rawTestId[0] : rawTestId;

  const [draft, setDraft] = useState<DraftPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(
  null
);
const [swapTargetQuestionId, setSwapTargetQuestionId] = useState<
  string | null
>(null);
const [movingQuestionId, setMovingQuestionId] = useState<string | null>(
  null
);

const [swapCandidates, setSwapCandidates] = useState<SwapCandidate[]>([]);

const [loadingSwapOptionsFor, setLoadingSwapOptionsFor] = useState<
  string | null
>(null);

const [swappingCandidateId, setSwappingCandidateId] = useState<
  string | null
>(null);
  useEffect(() => {
    let mounted = true;

    async function loadDraft() {
      try {
        setLoading(true);
        setError("");

        if (!testId) {
          throw new Error("Draft test ID is missing.");
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Your school session has expired. Please sign in again.");
        }

        const response = await fetch(
          `/api/school-portal/assessments/${testId}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Could not load this draft test.");
        }

        if (mounted) {
          setDraft(payload);
        }
      } catch (loadError) {
        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load this draft test."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDraft();

    return () => {
      mounted = false;
    };
  }, [testId]);
  const [showCustomQuestionForm, setShowCustomQuestionForm] = useState(false);

const [addingCustomQuestion, setAddingCustomQuestion] = useState(false);
const [publishing, setPublishing] = useState(false);
const [publishSuccess, setPublishSuccess] = useState("");

const [customQuestion, setCustomQuestion] = useState({
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctOption: "A",
  explanation: "",
  difficulty: "medium",
  marks: "1",
});

  const syllabusLabel = useMemo(() => {
    if (!draft) {
      return "";
    }

    const curriculum = getCurriculum(draft.test);

    return [
      curriculum?.display_name,
      draft.test.class_level,
      draft.test.subject,
    ]
      .filter(Boolean)
      .join(" · ");
  }, [draft]);
  async function handleRemoveQuestion(question: TestQuestion) {
  if (!testId || !draft) {
    return;
  }

  const confirmed = window.confirm(
    `Remove Question ${question.order_number} from this draft?`
  );

  if (!confirmed) {
    return;
  }

  try {
    setDeletingQuestionId(question.id);
    setActionError("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Your school session has expired. Please sign in again.");
    }

    const response = await fetch(
      `/api/school-portal/assessments/${testId}/questions/${question.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error || "Could not remove this question.");
    }

    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        test: {
          ...current.test,
          total_questions: payload.totalQuestions,
          total_marks: payload.totalMarks,
        },
       questions: current.questions
  .filter((item) => item.id !== question.id)
  .map((item, index) => ({
    ...item,
    order_number: index + 1,
  })),
      };
    });
  } catch (removeError) {
    setActionError(
      removeError instanceof Error
        ? removeError.message
        : "Could not remove this question."
    );
  } finally {
    setDeletingQuestionId(null);
  }
}

async function handleOpenSwapOptions(question: TestQuestion) {
  if (!testId) {
    return;
  }

  try {
    setActionError("");
    setLoadingSwapOptionsFor(question.id);
    setSwapTargetQuestionId(question.id);
    setSwapCandidates([]);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Your school session has expired. Please sign in again.");
    }

    const response = await fetch(
      `/api/school-portal/assessments/${testId}/questions/${question.id}/swap-options`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(
        payload?.error || "Could not load replacement questions."
      );
    }

    setSwapCandidates(payload.candidates ?? []);
  } catch (swapError) {
    setSwapTargetQuestionId(null);
    setSwapCandidates([]);

    setActionError(
      swapError instanceof Error
        ? swapError.message
        : "Could not load replacement questions."
    );
  } finally {
    setLoadingSwapOptionsFor(null);
  }
}

async function handleSwapQuestion(
  question: TestQuestion,
  candidate: SwapCandidate
) {
  if (!testId) {
    return;
  }

  try {
    setActionError("");
    setSwappingCandidateId(candidate.id);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Your school session has expired. Please sign in again.");
    }

    const response = await fetch(
      `/api/school-portal/assessments/${testId}/questions/${question.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          replacementQuestionId: candidate.id,
        }),
      }
    );

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error || "Could not swap this question.");
    }

    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        questions: current.questions.map((item) =>
          item.id === question.id ? payload.testQuestion : item
        ),
      };
    });

    setSwapTargetQuestionId(null);
    setSwapCandidates([]);
  } catch (swapError) {
    setActionError(
      swapError instanceof Error
        ? swapError.message
        : "Could not swap this question."
    );
  } finally {
    setSwappingCandidateId(null);
  }
}
async function handleMoveQuestion(
  question: TestQuestion,
  direction: "up" | "down"
) {
  if (!testId || !draft || draft.test.status !== "draft") {
    return;
  }

  const orderedQuestions = [...draft.questions].sort(
    (a, b) => a.order_number - b.order_number
  );

  const currentIndex = orderedQuestions.findIndex(
    (item) => item.id === question.id
  );

  const targetIndex =
    direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (
    currentIndex === -1 ||
    targetIndex < 0 ||
    targetIndex >= orderedQuestions.length
  ) {
    return;
  }

  try {
    setActionError("");
    setMovingQuestionId(question.id);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Your school session has expired. Please sign in again.");
    }

    const response = await fetch(
      `/api/school-portal/assessments/${testId}/questions/${question.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "reorder",
          direction,
        }),
      }
    );

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error || "Could not reorder this question.");
    }

    const returnedQuestions = Array.isArray(payload.questions)
      ? (payload.questions as Array<{
          id: string;
          order_number: number;
        }>)
      : [];

    if (returnedQuestions.length === 0) {
      throw new Error("Question order was updated but could not be refreshed.");
    }

    const orderByQuestionId = new Map(
      returnedQuestions.map((item) => [item.id, item.order_number] as const)
    );

    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        questions: current.questions
          .map((item) => ({
            ...item,
            order_number:
              orderByQuestionId.get(item.id) ?? item.order_number,
          }))
          .sort((a, b) => a.order_number - b.order_number),
      };
    });
  } catch (moveError) {
    setActionError(
      moveError instanceof Error
        ? moveError.message
        : "Could not reorder this question."
    );
  } finally {
    setMovingQuestionId(null);
  }
}

async function handleAddCustomQuestion() {
  if (!testId) {
    return;
  }

  try {
    setActionError("");
    setAddingCustomQuestion(true);

    const marks = Number(customQuestion.marks);

    if (
      !customQuestion.questionText.trim() ||
      !customQuestion.optionA.trim() ||
      !customQuestion.optionB.trim() ||
      !customQuestion.optionC.trim() ||
      !customQuestion.optionD.trim() ||
      !customQuestion.explanation.trim()
    ) {
      throw new Error(
        "Please complete the question, all four options, and explanation."
      );
    }

    if (!Number.isFinite(marks) || marks <= 0) {
      throw new Error("Please enter valid marks greater than zero.");
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Your school session has expired. Please sign in again.");
    }

    const response = await fetch(
      `/api/school-portal/assessments/${testId}/questions/custom`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...customQuestion,
          marks,
        }),
      }
    );

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(
        payload?.error || "Could not add the custom question."
      );
    }

    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        test: {
          ...current.test,
          total_questions: payload.totalQuestions,
          total_marks: payload.totalMarks,
        },
        questions: [...current.questions, payload.testQuestion],
      };
    });

    setCustomQuestion({
      questionText: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctOption: "A",
      explanation: "",
      difficulty: "medium",
      marks: "1",
    });

    setShowCustomQuestionForm(false);
  } catch (customQuestionError) {
    setActionError(
      customQuestionError instanceof Error
        ? customQuestionError.message
        : "Could not add the custom question."
    );
  } finally {
    setAddingCustomQuestion(false);
  }
}
async function handlePublishTest() {
  if (!testId || !draft) {
    return;
  }

  const confirmed = window.confirm(
    "Publish this test now? Matching learners will see it in My Learning and must enter the assessment code before their first attempt."
  );

  if (!confirmed) {
    return;
  }

  try {
    setActionError("");
    setPublishSuccess("");
    setPublishing(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Your school session has expired. Please sign in again.");
    }

    const response = await fetch(`/api/school-portal/assessments/${testId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error || "Could not publish this test.");
    }

    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        test: {
          ...current.test,
          ...payload.test,
          status: "published",
        },
      };
    });

    setPublishSuccess(
      "Test published. Share the assessment code below with the intended learners.",
    );
  } catch (publishError) {
    setActionError(
      publishError instanceof Error
        ? publishError.message
        : "Could not publish this test."
    );
  } finally {
    setPublishing(false);
  }
}

async function handleCopyAssessmentCode() {
  if (!draft?.test.share_code) {
    setActionError("This assessment code is not available yet. Refresh the page and try again.");
    return;
  }

  try {
    await navigator.clipboard.writeText(draft.test.share_code);
    setPublishSuccess("Assessment code copied. Share it only with the intended learners.");
  } catch {
    setActionError("Could not copy the assessment code automatically. Please copy it manually.");
  }
}
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-20">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-slate-700" />
          <p className="text-sm font-medium text-slate-700">
            Loading draft test...
          </p>
        </div>
      </main>
    );
  }

  if (error || !draft) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8">
          <div className="flex gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div>
              <h1 className="text-lg font-semibold text-slate-950">
                Draft test could not load
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {error || "The draft test does not exist."}
              </p>

              <Link
                href={`/school-dashboard/schools/${schoolId}/assessments/create`}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Create Assessment
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const { test, questions, sections } = draft;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/school-dashboard/schools/${schoolId}/assessments/create`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Create Assessment
        </Link>

        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              {test.status === "draft" ? (
  <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
    <LockKeyhole className="h-3.5 w-3.5" />
    Draft — not visible to students
  </div>
) : (
  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
    <CheckCircle2 className="h-3.5 w-3.5" />
    Published — learner access requires a code
  </div>
)}

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                {test.title}
              </h1>

              <p className="mt-2 text-sm font-medium text-slate-600">
                {syllabusLabel}
              </p>

              {test.instructions && (
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                  {test.instructions}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[320px]">
              <SummaryCard
                icon={<FileText className="h-4 w-4" />}
                label="Questions"
                value={String(test.total_questions)}
              />

              <SummaryCard
                icon={<Clock3 className="h-4 w-4" />}
                label="Timer"
                value={`${test.duration_minutes} min`}
              />

              <SummaryCard
                icon={<CheckCircle2 className="h-4 w-4" />}
                label="Total marks"
                value={String(test.total_marks)}
              />
            </div>
          </div>

          <div className="mt-7 border-t border-slate-100 pt-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Selected syllabus topic
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {sections.map((item) => {
                const section = getSection(item);

                if (!section) {
                  return null;
                }

                return (
                  <span
                    key={item.id}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700"
                  >
                    {section.section_code
                      ? `${section.section_code} · `
                      : ""}
                    {section.topic_name_exact}
                  </span>
                );
              })}
            </div>
          </div>
        </section>

        {actionError && (
  <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-5">
    <div className="flex gap-3">
      <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
      <div>
        <p className="font-semibold text-red-950">
          Draft could not be updated
        </p>
        <p className="mt-1 text-sm leading-6 text-red-800">
          {actionError}
        </p>
      </div>
    </div>
  </div>
)}
<section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
  {publishSuccess && (
    <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
      {publishSuccess}
    </div>
  )}

  {test.status === "draft" ? (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold text-slate-950">
          Ready to publish this test?
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-600">
          Publishing locks this draft for student attempts. Teachers will still
          be able to see results once students submit.
        </p>
      </div>

      <button
        type="button"
        onClick={handlePublishTest}
        disabled={publishing || questions.length === 0}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {publishing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Publishing...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Publish test
          </>
        )}
      </button>
    </div>
  ) : (
  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <p className="font-semibold text-slate-950">
        Test published
      </p>

      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
        Matching learners can see this assessment in My Learning. They must enter the assessment code before their first attempt.
      </p>

      {test.share_code ? (
        <div className="mt-4 inline-flex flex-wrap items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700">
              Assessment code
            </p>
            <code className="mt-1 block font-mono text-lg font-bold tracking-[0.18em] text-slate-950">
              {test.share_code}
            </code>
          </div>

          <button
            type="button"
            onClick={handleCopyAssessmentCode}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-100"
          >
            <Copy className="h-4 w-4" />
            Copy code
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm font-medium text-amber-800">
          The assessment was published, but its code could not be loaded. Refresh this page to view it.
        </p>
      )}
    </div>

    <Link
      href={`/school-dashboard/schools/${schoolId}/assessments/create`}
      className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
    >
      Create another test
    </Link>
  </div>
)}
</section>

<section className="mt-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-950">
                Draft paper preview
              </p>

              <p className="mt-1 text-sm text-slate-600">
                These are saved snapshots. Future edits to the main question
                bank will not change this test.
              </p>
            </div>

            <span className="hidden rounded-full bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 sm:inline-flex">
              {questions.length} questions saved
            </span>
          </div>

          <div className="space-y-4">
            {questions.map((question, questionIndex) => {
              const snapshot = question.question_snapshot ?? {};

              return (
                <article
                  key={question.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                 <div className="flex items-start justify-between gap-4">
  <div className="flex flex-wrap items-center gap-2">
    <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-bold text-white">
      Question {question.order_number}
    </span>

    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
      {difficultyLabel(snapshot.difficulty)}
    </span>

    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
      {question.marks} mark
      {question.marks === 1 ? "" : "s"}
    </span>

    {question.source_type === "teacher_custom" && (
      <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-800">
        Teacher custom
      </span>
    )}
  </div>
{test.status === "draft" && (
  <div className="flex shrink-0 flex-wrap justify-end gap-2">
    <button
      type="button"
      onClick={() => handleMoveQuestion(question, "up")}
      disabled={
        questionIndex === 0 ||
        movingQuestionId !== null ||
        deletingQuestionId !== null ||
        loadingSwapOptionsFor !== null
      }
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      title="Move question up"
    >
      {movingQuestionId === question.id ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <ArrowUp className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">Up</span>
    </button>

    <button
      type="button"
      onClick={() => handleMoveQuestion(question, "down")}
      disabled={
        questionIndex === questions.length - 1 ||
        movingQuestionId !== null ||
        deletingQuestionId !== null ||
        loadingSwapOptionsFor !== null
      }
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      title="Move question down"
    >
      {movingQuestionId === question.id ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <ArrowDown className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">Down</span>
    </button>

    <button
      type="button"
      onClick={() => handleOpenSwapOptions(question)}
      disabled={
        loadingSwapOptionsFor === question.id ||
        deletingQuestionId !== null ||
        movingQuestionId !== null
      }
      className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loadingSwapOptionsFor === question.id ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading
        </>
      ) : (
        <>
          <RefreshCw className="h-3.5 w-3.5" />
          Swap
        </>
      )}
    </button>

    <button
      type="button"
      onClick={() => handleRemoveQuestion(question)}
      disabled={deletingQuestionId === question.id || movingQuestionId !== null}
      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {deletingQuestionId === question.id ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Removing
        </>
      ) : (
        <>
          <Trash2 className="h-3.5 w-3.5" />
          Remove
        </>
      )}
    </button>
  </div>
)}
</div>

                  <h2 className="mt-4 text-base font-semibold leading-7 text-slate-950">
                    {snapshot.question_text || "Question text unavailable"}
                  </h2>

                  <div className="mt-4 grid gap-2">
                    {(["A", "B", "C", "D"] as const).map((optionKey) => {
                      const optionText = snapshot.options?.[optionKey];

                      if (!optionText) {
                        return null;
                      }

                      const isCorrect =
                        snapshot.correct_option === optionKey;

                      return (
                        <div
                          key={optionKey}
                          className={`rounded-xl border px-4 py-3 text-sm ${
                            isCorrect
                              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
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
                        </div>
                      );
                    })}
                  </div>

                  {snapshot.explanation && (
                    <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-sky-700">
                        Explanation
                      </p>

                      <p className="mt-2 text-sm leading-6 text-sky-950">
                        {snapshot.explanation}
                      </p>
                    </div>
                  )}
                  {swapTargetQuestionId === question.id && (
  <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4 sm:p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-semibold text-sky-950">
          Replace Question {question.order_number}
        </p>

        <p className="mt-1 text-sm leading-6 text-sky-800">
          Showing unused, validated questions from the same syllabus topic and
          difficulty level.
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          setSwapTargetQuestionId(null);
          setSwapCandidates([]);
        }}
        className="rounded-lg p-1.5 text-sky-800 transition hover:bg-sky-100"
        aria-label="Close replacement options"
      >
        <X className="h-4 w-4" />
      </button>
    </div>

    {loadingSwapOptionsFor === question.id ? (
      <div className="mt-5 flex items-center gap-2 text-sm font-medium text-sky-900">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading replacement questions...
      </div>
    ) : swapCandidates.length === 0 ? (
      <p className="mt-5 rounded-xl border border-sky-100 bg-white px-4 py-3 text-sm leading-6 text-sky-900">
        No unused replacement question is available for this topic and
        difficulty level yet.
      </p>
    ) : (
      <div className="mt-5 space-y-3">
        {swapCandidates.map((candidate) => (
          <div
            key={candidate.id}
            className="rounded-2xl border border-sky-100 bg-white p-4"
          >
            <p className="text-sm font-semibold leading-6 text-slate-950">
              {candidate.question_text}
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["A", candidate.option_a],
                  ["B", candidate.option_b],
                  ["C", candidate.option_c],
                  ["D", candidate.option_d],
                ] as const
              ).map(([optionKey, optionText]) => (
                <div
                  key={optionKey}
                  className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                >
                  <span className="mr-1 font-bold">{optionKey}.</span>
                  {optionText}
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-600">
                Correct answer:{" "}
                <span className="font-bold">
                  {candidate.correct_option ?? "Written answer"}
                </span>
              </p>

              <button
                type="button"
                onClick={() => handleSwapQuestion(question, candidate)}
                disabled={swappingCandidateId === candidate.id}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-700 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {swappingCandidateId === candidate.id ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Replacing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Use this question
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}
                </article>
              );
            })}
          </div>
          <section className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-5 sm:p-6">
            {test.status === "draft" && (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="font-semibold text-slate-950">
        Add your own question
      </p>

      <p className="mt-1 text-sm leading-6 text-slate-600">
        Teacher-added questions stay inside this draft and do not enter the
        global HeecoWorld question bank.
      </p>
    </div>

    <button
      type="button"
      onClick={() => setShowCustomQuestionForm((current) => !current)}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
    >
      <Plus className="h-4 w-4" />
      {showCustomQuestionForm ? "Close form" : "Add custom question"}
    </button>
  </div>)}

  {showCustomQuestionForm && (
    <div className="mt-6 border-t border-slate-100 pt-6">
      <div className="grid gap-5">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-800">
            Question
          </span>

          <textarea
            rows={3}
            value={customQuestion.questionText}
            onChange={(event) =>
              setCustomQuestion((current) => ({
                ...current,
                questionText: event.target.value,
              }))
            }
            placeholder="Write the question..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["A", "optionA"],
              ["B", "optionB"],
              ["C", "optionC"],
              ["D", "optionD"],
            ] as const
          ).map(([optionLabel, optionKey]) => (
            <label key={optionKey} className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-800">
                Option {optionLabel}
              </span>

              <input
                value={customQuestion[optionKey]}
                onChange={(event) =>
                  setCustomQuestion((current) => ({
                    ...current,
                    [optionKey]: event.target.value,
                  }))
                }
                placeholder={`Option ${optionLabel}`}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
            </label>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-800">
              Correct option
            </span>

            <select
              value={customQuestion.correctOption}
              onChange={(event) =>
                setCustomQuestion((current) => ({
                  ...current,
                  correctOption: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-800">
              Difficulty
            </span>

            <select
              value={customQuestion.difficulty}
              onChange={(event) =>
                setCustomQuestion((current) => ({
                  ...current,
                  difficulty: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-800">
              Marks
            </span>

            <input
              type="number"
              min="1"
              max="100"
              value={customQuestion.marks}
              onChange={(event) =>
                setCustomQuestion((current) => ({
                  ...current,
                  marks: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-800">
            Explanation shown after submission
          </span>

          <textarea
            rows={4}
            value={customQuestion.explanation}
            onChange={(event) =>
              setCustomQuestion((current) => ({
                ...current,
                explanation: event.target.value,
              }))
            }
            placeholder="Explain why the correct answer is right..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          />
        </label>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">
            This custom question is added only to this paper. It will not be
            reused in another teacher’s test.
          </p>

          <button
            type="button"
            onClick={handleAddCustomQuestion}
            disabled={addingCustomQuestion}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {addingCustomQuestion ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding question...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add to draft
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )}
</section>
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