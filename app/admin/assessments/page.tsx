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

type Curriculum = {
  id: string;
  code: string;
  display_name: string;
  curriculum_family: string;
};

type CurriculumSection = {
  id: string;
  section_code: string | null;
  topic_name_exact: string;
  is_active: boolean;
  review_status: string;
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

function getCurriculum(
  document: CurriculumDocument
): Curriculum | null {
  if (Array.isArray(document.curricula)) {
    return document.curricula[0] ?? null;
  }

  return document.curricula;
}

function uniqueValues(values: string[]) {
  return [...new Set(values)];
}

export default function AssessmentsPage() {
  const [catalog, setCatalog] = useState<CurriculumDocument[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  const [curriculumId, setCurriculumId] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [sectionId, setSectionId] = useState("");

  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [instructions, setInstructions] = useState(
    "Attempt all questions. Read every option carefully before submitting."
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
          throw new Error("Your admin session has expired. Please sign in again.");
        }

        const response = await fetch("/api/admin/assessments/catalog", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(
            payload?.error || "Could not load the assessment curriculum."
          );
        }

        if (mounted) {
          setCatalog(payload.catalog ?? []);
        }
      } catch (error) {
        if (mounted) {
          setCatalogError(
            error instanceof Error
              ? error.message
              : "Could not load the assessment curriculum."
          );
        }
      } finally {
        if (mounted) {
          setLoadingCatalog(false);
        }
      }
    }

    loadCatalog();

    return () => {
      mounted = false;
    };
  }, []);

  const curriculumOptions = useMemo(() => {
    const map = new Map<string, Curriculum>();

    catalog.forEach((document) => {
      const curriculum = getCurriculum(document);

      if (curriculum) {
        map.set(curriculum.id, curriculum);
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.display_name.localeCompare(b.display_name)
    );
  }, [catalog]);

  const curriculumDocuments = useMemo(() => {
    return catalog.filter((document) => document.curriculum_id === curriculumId);
  }, [catalog, curriculumId]);

  const classOptions = useMemo(() => {
    return uniqueValues(curriculumDocuments.map((document) => document.class_level))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [curriculumDocuments]);

  const subjectDocuments = useMemo(() => {
    return curriculumDocuments.filter(
      (document) => document.class_level === classLevel
    );
  }, [curriculumDocuments, classLevel]);

  const subjectOptions = useMemo(() => {
    return uniqueValues(subjectDocuments.map((document) => document.subject)).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [subjectDocuments]);

  const sourceDocuments = useMemo(() => {
    return subjectDocuments.filter((document) => document.subject === subject);
  }, [subjectDocuments, subject]);

  const selectedDocument = useMemo(() => {
    return sourceDocuments.find((document) => document.id === documentId) ?? null;
  }, [sourceDocuments, documentId]);

  const selectedChapter = useMemo(() => {
    return (
      selectedDocument?.curriculum_chapters.find(
        (chapter) => chapter.id === chapterId
      ) ?? null
    );
  }, [selectedDocument, chapterId]);

  const sectionOptions = selectedChapter?.curriculum_sections ?? [];

  const totalQuestions =
    difficultyMix.easy + difficultyMix.medium + difficultyMix.hard;

  const canCreate =
    Boolean(title.trim()) &&
    Boolean(curriculumId) &&
    Boolean(classLevel) &&
    Boolean(subject) &&
    Boolean(documentId) &&
    Boolean(chapterId) &&
    Boolean(sectionId) &&
    totalQuestions > 0 &&
    durationMinutes > 0 &&
    !creating;

  function resetBelowCurriculum() {
    setClassLevel("");
    setSubject("");
    setDocumentId("");
    setChapterId("");
    setSectionId("");
  }

  function resetBelowClass() {
    setSubject("");
    setDocumentId("");
    setChapterId("");
    setSectionId("");
  }

  function resetBelowSubject() {
    setDocumentId("");
    setChapterId("");
    setSectionId("");
  }

  function resetBelowDocument() {
    setChapterId("");
    setSectionId("");
  }

  function updateDifficulty(
    level: keyof DifficultyMix,
    rawValue: string
  ) {
    const parsed = Number(rawValue);

    setDifficultyMix((current) => ({
      ...current,
      [level]: Number.isFinite(parsed)
        ? Math.max(0, Math.min(100, Math.floor(parsed)))
        : 0,
    }));
  }

  async function handleCreateTest() {
    if (!canCreate) {
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
        throw new Error("Your admin session has expired. Please sign in again.");
      }

      const response = await fetch("/api/admin/assessments/create-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          curriculumId,
          classLevel,
          subject,
          sectionId,
          durationMinutes,
          difficultyMix,
          instructions: instructions.trim() || null,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error || "Could not create a draft test."
        );
      }

      setCreatedTest(payload.test);
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "Could not create a draft test."
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
              Select the curriculum topic, create a fresh draft from the
              stored question bank, then review and edit it before publishing.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <p className="font-semibold text-slate-900">
              {catalog.length} curriculum source
              {catalog.length === 1 ? "" : "s"} available
            </p>
            <p className="mt-0.5 text-slate-500">
              Only published, syllabus-locked topics appear here.
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
                  {createdTest.total_questions} saved question snapshots.
                  It is still a draft, so students cannot access it yet.
                </p>

              <Link
  href={`/admin/assessments/${createdTest.id}`}
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
                  Tests can only use questions from the selected topic.
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
                  {curriculumOptions.map((curriculum) => (
                    <option key={curriculum.id} value={curriculum.id}>
                      {curriculum.display_name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Class / grade">
                <select
                  value={classLevel}
                  disabled={!curriculumId}
                  onChange={(event) => {
                    setClassLevel(event.target.value);
                    resetBelowClass();
                  }}
                >
                  <option value="">Select class or grade</option>
                  {classOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Subject">
                <select
                  value={subject}
                  disabled={!classLevel}
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

              <Field label="Duration (minutes)">
                <input
                  type="number"
                  min="1"
                  max="240"
                  value={durationMinutes}
                  onChange={(event) =>
                    setDurationMinutes(
                      Math.max(1, Math.min(240, Number(event.target.value) || 1))
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
                    {totalQuestions} questions
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
                  The teacher will be able to swap, remove, reorder, or add a
                  custom question before publishing.
                </p>
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

      <div
        className="[
          &_input,
          &_select,
          &_textarea
        ]:w-full
        [&_input,
          &_select,
          &_textarea
        ]:rounded-xl
        [&_input,
          &_select,
          &_textarea
        ]:border
        [&_input,
          &_select,
          &_textarea
        ]:border-slate-200
        [&_input,
          &_select,
          &_textarea
        ]:bg-white
        [&_input,
          &_select,
          &_textarea
        ]:px-3.5
        [&_input,
          &_select,
          &_textarea
        ]:py-3
        [&_input,
          &_select,
          &_textarea
        ]:text-sm
        [&_input,
          &_select,
          &_textarea
        ]:text-slate-900
        [&_input,
          &_select,
          &_textarea
        ]:outline-none
        [&_input,
          &_select,
          &_textarea
        ]:transition
        [&_input,
          &_select,
          &_textarea
        ]:focus:border-slate-400
        [&_input,
          &_select,
          &_textarea
        ]:focus:ring-4
        [&_input,
          &_select,
          &_textarea
        ]:focus:ring-slate-100
        [&_input:disabled,
          &_select:disabled,
          &_textarea:disabled
        ]:cursor-not-allowed
        [&_input:disabled,
          &_select:disabled,
          &_textarea:disabled
        ]:bg-slate-50
        [&_input:disabled,
          &_select:disabled,
          &_textarea:disabled
        ]:text-slate-400"
      >
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