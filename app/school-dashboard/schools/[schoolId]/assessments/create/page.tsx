"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Loader2,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/SupabaseClient";
import Link from "next/link";
import { useParams } from "next/navigation";

type Curriculum = {
  id: string;
  code: string;
  display_name: string;
  curriculum_family: string | null;
};

type CurriculumLevel = {
  id: string;
  code: string;
  displayName: string;
  sortOrder: number;
  hasPublishedContent: boolean;
};

type TeacherCurriculumOption = {
  id: string;
  code: string;
  displayName: string;
  levels: CurriculumLevel[];
};

type QuestionCountBreakdown = {
  easy: number;
  medium: number;
  hard: number;
  total: number;
};

type CurriculumSection = {
  id: string;
  section_code: string | null;
  topic_name_exact: string;
  is_active: boolean;
  review_status: string;
  question_counts?: QuestionCountBreakdown;
};

type CurriculumChapter = {
  id: string;
  chapter_number: string | null;
  chapter_name: string;
  is_active: boolean;
  curriculum_sections: CurriculumSection[];
};

type CurriculumDocument = {
  id: string;
  curriculum_id: string;
  curriculum_level_id: string | null;
  class_level: string;
  subject: string;
  textbook_name: string;
  textbook_year_or_version: string | null;
  processing_status: string;
  curricula: Curriculum | Curriculum[] | null;
  curriculum_chapters: CurriculumChapter[];
};

type DifficultyMix = {
  easy: number;
  medium: number;
  hard: number;
};

type CreatedTest = {
  id: string;
  title: string;
  status: string;
  share_code: string;
  total_questions: number;
};

type CatalogResponse = {
  catalog?: CurriculumDocument[];
  curricula?: TeacherCurriculumOption[];
  error?: string;
};

function uniqueValues(values: string[]) {
  return [...new Set(values)];
}

export default function AssessmentsPage() {
  const params = useParams();

  const schoolId = Array.isArray(params.schoolId)
    ? params.schoolId[0]
    : params.schoolId;

  const [catalog, setCatalog] = useState<CurriculumDocument[]>([]);
  const [curricula, setCurricula] = useState<TeacherCurriculumOption[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  const [curriculumId, setCurriculumId] = useState("");
  const [curriculumLevelId, setCurriculumLevelId] = useState("");
  const [subject, setSubject] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [testScope, setTestScope] = useState<"chapter" | "topic">("chapter");

  const [title, setTitle] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [instructions, setInstructions] = useState(
    "Attempt all questions. Read every option carefully before submitting.",
  );

  const [difficultyMix, setDifficultyMix] = useState<DifficultyMix>({
    easy: 4,
    medium: 4,
    hard: 2,
  });

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createdTest, setCreatedTest] = useState<CreatedTest | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadCatalog() {
      try {
        setLoadingCatalog(true);
        setCatalogError("");

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error(
            "Your teacher session has expired. Please sign in again.",
          );
        }

        if (!schoolId) {
          throw new Error("School ID is missing.");
        }

        const response = await fetch(
          `/api/school-portal/assessments/catalog?schoolId=${encodeURIComponent(
            schoolId,
          )}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          },
        );

        const payload = (await response.json()) as CatalogResponse;

        if (!response.ok) {
          throw new Error(
            payload?.error || "Could not load the assessment curriculum.",
          );
        }

        if (mounted) {
          setCatalog(Array.isArray(payload.catalog) ? payload.catalog : []);
          setCurricula(
            Array.isArray(payload.curricula) ? payload.curricula : [],
          );
        }
      } catch (error) {
        if (mounted) {
          setCatalogError(
            error instanceof Error
              ? error.message
              : "Could not load the assessment curriculum.",
          );
        }
      } finally {
        if (mounted) {
          setLoadingCatalog(false);
        }
      }
    }

    void loadCatalog();

    return () => {
      mounted = false;
    };
  }, [schoolId]);

  const selectedCurriculum = useMemo(
    () =>
      curricula.find((curriculum) => curriculum.id === curriculumId) ?? null,
    [curricula, curriculumId],
  );

  const levelOptions = selectedCurriculum?.levels ?? [];

  const selectedLevel = useMemo(
    () => levelOptions.find((level) => level.id === curriculumLevelId) ?? null,
    [levelOptions, curriculumLevelId],
  );

  const levelDocuments = useMemo(() => {
    return catalog.filter(
      (document) =>
        document.curriculum_id === curriculumId &&
        document.curriculum_level_id === curriculumLevelId,
    );
  }, [catalog, curriculumId, curriculumLevelId]);

  const subjectOptions = useMemo(() => {
    return uniqueValues(
      levelDocuments.map((document) => document.subject),
    ).sort((a, b) => a.localeCompare(b));
  }, [levelDocuments]);

  const sourceDocuments = useMemo(() => {
    return levelDocuments.filter((document) => document.subject === subject);
  }, [levelDocuments, subject]);

  const selectedDocument = useMemo(() => {
    return (
      sourceDocuments.find((document) => document.id === documentId) ?? null
    );
  }, [sourceDocuments, documentId]);

  const selectedChapter = useMemo(() => {
    return (
      selectedDocument?.curriculum_chapters.find(
        (chapter) => chapter.id === chapterId,
      ) ?? null
    );
  }, [selectedDocument, chapterId]);

  const sectionOptions = selectedChapter?.curriculum_sections ?? [];

function getQuestionCounts(item: any): QuestionCountBreakdown {
  const counts = item?.question_counts || item?.questionCounts;

  return {
    easy: counts?.easy ?? 0,
    medium: counts?.medium ?? 0,
    hard: counts?.hard ?? 0,
    total: counts?.total ?? 0,
  };
}

  const selectedSection = useMemo(() => {
    return sectionOptions.find((section) => section.id === sectionId) ?? null;
  }, [sectionOptions, sectionId]);

  const chapterQuestionCounts = useMemo<QuestionCountBreakdown>(() => {
    return sectionOptions.reduce(
      (total, section) => {
        const counts = getQuestionCounts(section);
        return {
          easy: total.easy + counts.easy,
          medium: total.medium + counts.medium,
          hard: total.hard + counts.hard,
          total: total.total + counts.total,
        };
      },
      { easy: 0, medium: 0, hard: 0, total: 0 },
    );
  }, [sectionOptions]);

  const selectedAvailability =
    testScope === "chapter" ? chapterQuestionCounts : getQuestionCounts(selectedSection);

  const totalQuestions =
    difficultyMix.easy + difficultyMix.medium + difficultyMix.hard;

  const difficultyTotalMatchesQuestionCount = totalQuestions === questionCount;
  
const hasSelection =
  testScope === "chapter"
    ? Boolean(selectedChapter)
    : Boolean(selectedSection);

  const hasEnoughEasyQuestions =
  !hasSelection ||
  difficultyMix.easy <= selectedAvailability.easy;
  const hasEnoughMediumQuestions =  !hasSelection || difficultyMix.medium <= selectedAvailability.medium;
  const hasEnoughHardQuestions =  !hasSelection || difficultyMix.hard <= selectedAvailability.hard;
  

const hasEnoughTotalQuestions =
  !hasSelection || questionCount <= selectedAvailability.total;
  const hasEnoughQuestions =
    hasEnoughTotalQuestions &&
    hasEnoughEasyQuestions &&
    hasEnoughMediumQuestions &&
    hasEnoughHardQuestions;

  const selectedLevelHasPublishedContent = Boolean(
    selectedLevel?.hasPublishedContent,
  );

  const canCreate =
    Boolean(title.trim()) &&
    Boolean(curriculumId) &&
    Boolean(curriculumLevelId) &&
    selectedLevelHasPublishedContent &&
    Boolean(subject) &&
    Boolean(documentId) &&
    Boolean(chapterId) &&
    (testScope === "chapter" || Boolean(sectionId)) &&
    questionCount > 0 &&
    totalQuestions > 0 &&
    difficultyTotalMatchesQuestionCount &&
    hasEnoughQuestions &&
    durationMinutes > 0 &&
    !creating;

  function resetBelowCurriculum() {
    setCurriculumLevelId("");
    setSubject("");
    setDocumentId("");
    setChapterId("");
    setSectionId("");
    setTestScope("chapter");
  }

  function resetBelowLevel() {
    setSubject("");
    setDocumentId("");
    setChapterId("");
    setSectionId("");
    setTestScope("chapter");
  }

  function resetBelowSubject() {
    setDocumentId("");
    setChapterId("");
    setSectionId("");
    setTestScope("chapter");
  }

  function resetBelowDocument() {
    setChapterId("");
    setSectionId("");
    setTestScope("chapter");
  }

  function updateDifficulty(level: keyof DifficultyMix, rawValue: string) {
    const parsed = Number(rawValue);

    setDifficultyMix((current) => ({
      ...current,
      [level]: Number.isFinite(parsed)
        ? Math.max(0, Math.min(100, Math.floor(parsed)))
        : 0,
    }));
  }

  async function handleCreateTest() {
    if (!canCreate || !selectedLevel || !schoolId) {
      return;
    }

    try {
      setCreating(true);
      setCreateError("");
      setCreatedTest(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          "Your teacher session has expired. Please sign in again.",
        );
      }

      const response = await fetch(
        "/api/school-portal/assessments/create-test",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            schoolId,
            title: title.trim(),
            curriculumId,
            curriculumLevelId,
            // Kept for the existing RPC. The database resolves and stores the UUID.
            classLevel: selectedLevel.displayName,
            subject,
            chapterId: testScope === "chapter" ? chapterId : null,
            sectionId: testScope === "topic" ? sectionId : null,
            questionCount,
            durationMinutes,
            difficultyMix,
            instructions: instructions.trim() || null,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Could not create a draft test.");
      }

      setCreatedTest(payload.test);
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "Could not create a draft test.",
      );
    } finally {
      setCreating(false);
    }
  }

  if (loadingCatalog) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-20">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-slate-700" />
          <p className="text-sm font-medium text-slate-700">
            Loading assessment curriculum...
          </p>
        </div>
      </main>
    );
  }

  if (catalogError) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Assessment setup could not load
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {catalogError}
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/school-dashboard"
          className="mb-4 inline-block text-sm font-semibold text-blue-600"
        >
          ← Back to School Dashboard
        </Link>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              <Sparkles className="h-3.5 w-3.5" />
              Curriculum-aligned assessments
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Create a test
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Choose an official academic level, then create a fresh draft from
              the stored question bank. Only published and approved topics are
              available.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <p className="font-semibold text-slate-900">
              {catalog.length} curriculum source
              {catalog.length === 1 ? "" : "s"} available
            </p>
            <p className="mt-0.5 text-slate-500">
              Your school&apos;s offered curricula only.
            </p>
          </div>
        </div>

        {createdTest && (
          <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />

              <div>
                <p className="font-semibold text-emerald-950">
                  Draft test created successfully
                </p>

                <p className="mt-1 text-sm leading-6 text-emerald-900">
                  <strong>{createdTest.title}</strong> now has{" "}
                  {createdTest.total_questions} saved question snapshots. It is
                  still a draft, so students cannot access it yet.
                </p>

                <Link
                  href={`/school-dashboard/schools/${schoolId}/assessments/${createdTest.id}`}
                  className="mt-3 inline-flex rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900"
                >
                  Open draft editor
                </Link>
              </div>
            </div>
          </div>
        )}

        {createError && (
          <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-5">
            <div className="flex gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
              <div>
                <p className="font-semibold text-red-950">
                  Draft test was not created
                </p>
                <p className="mt-1 text-sm leading-6 text-red-800">
                  {createError}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.45fr_0.8fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-slate-900 p-2.5 text-white">
                <BookOpen className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  1. Choose the syllabus topic
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Choose an entire chapter or a specific approved topic.
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <Field label="Curriculum">
                <select
                  value={curriculumId}
                  onChange={(event) => {
                    setCurriculumId(event.target.value);
                    resetBelowCurriculum();
                  }}
                >
                  <option value="">Select curriculum</option>
                  {curricula.map((curriculum) => (
                    <option key={curriculum.id} value={curriculum.id}>
                      {curriculum.displayName}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Academic level">
                <select
                  value={curriculumLevelId}
                  disabled={!curriculumId}
                  onChange={(event) => {
                    setCurriculumLevelId(event.target.value);
                    resetBelowLevel();
                  }}
                >
                  <option value="">Select academic level</option>
                  {levelOptions.map((level) => (
                    <option
                      key={level.id}
                      value={level.id}
                      disabled={!level.hasPublishedContent}
                    >
                      {level.displayName}
                      {!level.hasPublishedContent
                        ? " — No published content yet"
                        : ""}
                    </option>
                  ))}
                </select>
                {curriculumId && levelOptions.length === 0 && (
                  <p className="mt-2 text-xs leading-5 text-amber-700">
                    Global academic levels have not been configured for this
                    curriculum yet.
                  </p>
                )}
              </Field>

              <Field label="Subject">
                <select
                  value={subject}
                  disabled={
                    !curriculumLevelId || !selectedLevelHasPublishedContent
                  }
                  onChange={(event) => {
                    setSubject(event.target.value);
                    resetBelowSubject();
                  }}
                >
                  <option value="">Select subject</option>
                  {subjectOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Content source">
                <select
                  value={documentId}
                  disabled={!subject}
                  onChange={(event) => {
                    setDocumentId(event.target.value);
                    resetBelowDocument();
                  }}
                >
                  <option value="">Select source</option>
                  {sourceDocuments.map((document) => (
                    <option key={document.id} value={document.id}>
                      {document.textbook_name}
                      {document.textbook_year_or_version
                        ? ` — ${document.textbook_year_or_version}`
                        : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Chapter">
                <select
                  value={chapterId}
                  disabled={!documentId}
                  onChange={(event) => {
                    setChapterId(event.target.value);
                    setSectionId("");
                    setTestScope("chapter");
                  }}
                >
                  <option value="">Select chapter</option>
                  {selectedDocument?.curriculum_chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.chapter_number
                        ? `Chapter ${chapter.chapter_number}: `
                        : ""}
                      {chapter.chapter_name}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-800">
                  Test scope
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={!chapterId}
                    onClick={() => {
                      setTestScope("chapter");
                      setSectionId("");
                    }}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                      testScope === "chapter"
                        ? "border-slate-900 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    } disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
                  >
                    Entire chapter
                    <span className="mt-1 block text-xs font-medium opacity-80">
                      Use questions from all approved topics in this chapter.
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={!chapterId}
                    onClick={() => setTestScope("topic")}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                      testScope === "topic"
                        ? "border-slate-900 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    } disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
                  >
                    Specific topic
                    <span className="mt-1 block text-xs font-medium opacity-80">
                      Use questions from one selected topic only.
                    </span>
                  </button>
                </div>
              </div>

              {testScope === "topic" && (
                <Field label="Topic">
                  <select
                    value={sectionId}
                    disabled={!chapterId}
                    onChange={(event) => setSectionId(event.target.value)}
                  >
                    <option value="">Select topic</option>
                    {sectionOptions.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.section_code ? `${section.section_code} — ` : ""}
                        {section.topic_name_exact}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </div>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-900">
                <Clock3 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Test settings
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  The teacher can still edit the paper before publishing.
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-5">
              <Field label="Test title">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Example: Chapter 1 weekly practice"
                />
              </Field>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Available questions
                </p>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-white px-2 py-3">
                    <p className="font-bold text-slate-950">{selectedAvailability.total}</p>
                    <p className="mt-1 text-slate-500">Total</p>
                  </div>
                  <div className="rounded-xl bg-white px-2 py-3">
                    <p className="font-bold text-slate-950">{selectedAvailability.easy}</p>
                    <p className="mt-1 text-slate-500">Easy</p>
                  </div>
                  <div className="rounded-xl bg-white px-2 py-3">
                    <p className="font-bold text-slate-950">{selectedAvailability.medium}</p>
                    <p className="mt-1 text-slate-500">Medium</p>
                  </div>
                  <div className="rounded-xl bg-white px-2 py-3">
                    <p className="font-bold text-slate-950">{selectedAvailability.hard}</p>
                    <p className="mt-1 text-slate-500">Hard</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  {testScope === "chapter"
                    ? "Counts are across all approved topics in the selected chapter."
                    : "Counts are for the selected topic only."}
                </p>
              </div>

              <Field label="Number of questions">
                <input
                  type="number"
                  min="1"
                  max={selectedAvailability.total || 100}
                  value={questionCount}
                  onChange={(event) =>
                    setQuestionCount(
                      Math.max(
                        1,
                        Math.min(
                          selectedAvailability.total || 100,
                          Number(event.target.value) || 1,
                        ),
                      ),
                    )
                  }
                />
                {!hasEnoughTotalQuestions && (
                  <p className="mt-2 text-xs leading-5 text-red-700">
                    Only {selectedAvailability.total} questions are available for this selection.
                  </p>
                )}
              </Field>

              <Field label="Duration (minutes)">
                <input
                  type="number"
                  min="1"
                  max="240"
                  value={durationMinutes}
                  onChange={(event) =>
                    setDurationMinutes(
                      Math.max(
                        1,
                        Math.min(240, Number(event.target.value) || 1),
                      ),
                    )
                  }
                />
              </Field>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-800">
                    Difficulty mix
                  </label>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                    {totalQuestions} / {questionCount} questions
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3">
                  <DifficultyInput
                    label="Easy"
                    value={difficultyMix.easy}
                    onChange={(value) => updateDifficulty("easy", value)}
                  />

                  <DifficultyInput
                    label="Medium"
                    value={difficultyMix.medium}
                    onChange={(value) => updateDifficulty("medium", value)}
                  />

                  <DifficultyInput
                    label="Hard"
                    value={difficultyMix.hard}
                    onChange={(value) => updateDifficulty("hard", value)}
                  />
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  A fresh paper is generated from stored, validated questions.
                  The difficulty total must match the selected question count.
                  The teacher will be able to swap, remove, reorder, or add a
                  custom question before publishing.
                </p>

                {!difficultyTotalMatchesQuestionCount && (
                  <p className="mt-2 text-xs font-semibold text-red-700">
                    Difficulty total is {totalQuestions}. It must equal {questionCount}.
                  </p>
                )}
                {!hasEnoughEasyQuestions && (
                  <p className="mt-2 text-xs font-semibold text-red-700">
                    Only {selectedAvailability.easy} Easy questions are available.
                  </p>
                )}
                {!hasEnoughMediumQuestions && (
                  <p className="mt-2 text-xs font-semibold text-red-700">
                    Only {selectedAvailability.medium} Medium questions are available.
                  </p>
                )}
                {!hasEnoughHardQuestions && (
                  <p className="mt-2 text-xs font-semibold text-red-700">
                    Only {selectedAvailability.hard} Hard questions are available.
                  </p>
                )}
              </div>

              <Field label="Instructions (optional)">
                <textarea
                  rows={4}
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                  placeholder="Add instructions visible to students..."
                />
              </Field>
            </div>
          </aside>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="font-semibold text-slate-950">
              Create an editable draft paper
            </p>
            <p className="mt-1 text-sm text-slate-600">
              It will not be visible to students until the teacher publishes it.
            </p>
          </div>

          <button
            type="button"
            disabled={!canCreate}
            onClick={handleCreateTest}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating draft...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate draft test
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
      </span>

      <div className="[&_input]:w-full [&_select]:w-full [&_textarea]:w-full [&_input]:rounded-xl [&_select]:rounded-xl [&_textarea]:rounded-xl [&_input]:border [&_select]:border [&_textarea]:border [&_input]:border-slate-200 [&_select]:border-slate-200 [&_textarea]:border-slate-200 [&_input]:bg-white [&_select]:bg-white [&_textarea]:bg-white [&_input]:px-3.5 [&_select]:px-3.5 [&_textarea]:px-3.5 [&_input]:py-3 [&_select]:py-3 [&_textarea]:py-3 [&_input]:text-sm [&_select]:text-sm [&_textarea]:text-sm [&_input]:text-slate-900 [&_select]:text-slate-900 [&_textarea]:text-slate-900 [&_input]:outline-none [&_select]:outline-none [&_textarea]:outline-none [&_input]:transition [&_select]:transition [&_textarea]:transition [&_input]:focus:border-slate-400 [&_select]:focus:border-slate-400 [&_textarea]:focus:border-slate-400 [&_input]:focus:ring-4 [&_select]:focus:ring-4 [&_textarea]:focus:ring-4 [&_input]:focus:ring-slate-100 [&_select]:focus:ring-slate-100 [&_textarea]:focus:ring-slate-100 [&_input:disabled]:cursor-not-allowed [&_select:disabled]:cursor-not-allowed [&_textarea:disabled]:cursor-not-allowed [&_input:disabled]:bg-slate-50 [&_select:disabled]:bg-slate-50 [&_textarea:disabled]:bg-slate-50 [&_input:disabled]:text-slate-400 [&_select:disabled]:text-slate-400 [&_textarea:disabled]:text-slate-400">
        {children}
      </div>
    </label>
  );
}

function DifficultyInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-slate-600">
        {label}
      </span>

      <input
        type="number"
        min="0"
        max="100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      />
    </label>
  );
}
