"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Loader2,
  Play,
  Sparkles,
} from "lucide-react";

type TopicOption = {
  id: string;
  name: string;
  questionCount: number;
};

type ChapterOption = {
  id: string;
  name: string;
  questionCount: number;
  topics: TopicOption[];
};

type SubjectOption = {
  id: string;
  name: string;
  chapters: ChapterOption[];
};

type LevelOption = {
  id: string;
  code: string;
  displayName: string;
  sortOrder: number;
  subjects: SubjectOption[];
};

type CurriculumOption = {
  id: string;
  code: string;
  displayName: string;
  levels: LevelOption[];
};

type OptionsResponse = {
  curricula?: CurriculumOption[];
  questionCounts?: number[];
  durations?: number[];
  difficulties?: {
    id: "easy" | "mixed" | "challenging";
    label: string;
    recommended?: boolean;
  }[];
  error?: string;
};

export default function PublicPracticeTestsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [curricula, setCurricula] = useState<CurriculumOption[]>([]);
  const [questionCounts, setQuestionCounts] = useState<number[]>([
    10,
    20,
    30,
    40,
  ]);
  const [durations, setDurations] = useState<number[]>([15, 30, 45, 60]);

  const [curriculumId, setCurriculumId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [topicId, setTopicId] = useState("");

  const [scope, setScope] = useState<"chapter" | "topic">("chapter");
  const [questionCount, setQuestionCount] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [difficultyMode, setDifficultyMode] = useState<
    "easy" | "mixed" | "challenging"
  >("mixed");

  useEffect(() => {
    async function loadOptions() {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await fetch(
          "/api/public/practice-tests/options",
          {
            cache: "no-store",
          }
        );

        const payload = (await response
          .json()
          .catch(() => ({}))) as OptionsResponse;

        if (!response.ok) {
          throw new Error(
            payload.error || "Could not load practice test options."
          );
        }

        const nextCurricula = payload.curricula ?? [];

        setCurricula(nextCurricula);
        setQuestionCounts(payload.questionCounts ?? [10, 20, 30, 40]);
        setDurations(payload.durations ?? [15, 30, 45, 60]);

        const firstCurriculum = nextCurricula[0];
        const firstLevel = firstCurriculum?.levels?.[0];
        const firstSubject = firstLevel?.subjects?.[0];
        const firstChapter = firstSubject?.chapters?.[0];
        const firstTopic = firstChapter?.topics?.[0];

        setCurriculumId(firstCurriculum?.id ?? "");
        setLevelId(firstLevel?.id ?? "");
        setSubjectId(firstSubject?.id ?? "");
        setChapterId(firstChapter?.id ?? "");
        setTopicId(firstTopic?.id ?? "");
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not load practice test options."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadOptions();
  }, []);

  const selectedCurriculum = useMemo(
    () =>
      curricula.find((curriculum) => curriculum.id === curriculumId) ??
      null,
    [curricula, curriculumId]
  );

  const selectedLevel = useMemo(
    () =>
      selectedCurriculum?.levels.find((level) => level.id === levelId) ??
      null,
    [selectedCurriculum, levelId]
  );

  const selectedSubject = useMemo(
    () =>
      selectedLevel?.subjects.find((subject) => subject.id === subjectId) ??
      null,
    [selectedLevel, subjectId]
  );

  const selectedChapter = useMemo(
    () =>
      selectedSubject?.chapters.find(
        (chapter) => chapter.id === chapterId
      ) ?? null,
    [selectedSubject, chapterId]
  );

  const selectedTopic = useMemo(
    () =>
      selectedChapter?.topics.find((topic) => topic.id === topicId) ??
      null,
    [selectedChapter, topicId]
  );

  const availableQuestions =
    scope === "chapter"
      ? selectedChapter?.questionCount ?? 0
      : selectedTopic?.questionCount ?? 0;

  function handleCurriculumChange(nextCurriculumId: string) {
    setCurriculumId(nextCurriculumId);

    const curriculum = curricula.find(
      (item) => item.id === nextCurriculumId
    );

    const level = curriculum?.levels?.[0];
    const subject = level?.subjects?.[0];
    const chapter = subject?.chapters?.[0];
    const topic = chapter?.topics?.[0];

    setLevelId(level?.id ?? "");
    setSubjectId(subject?.id ?? "");
    setChapterId(chapter?.id ?? "");
    setTopicId(topic?.id ?? "");
  }

  function handleLevelChange(nextLevelId: string) {
    setLevelId(nextLevelId);

    const level = selectedCurriculum?.levels.find(
      (item) => item.id === nextLevelId
    );

    const subject = level?.subjects?.[0];
    const chapter = subject?.chapters?.[0];
    const topic = chapter?.topics?.[0];

    setSubjectId(subject?.id ?? "");
    setChapterId(chapter?.id ?? "");
    setTopicId(topic?.id ?? "");
  }

  function handleSubjectChange(nextSubjectId: string) {
    setSubjectId(nextSubjectId);

    const subject = selectedLevel?.subjects.find(
      (item) => item.id === nextSubjectId
    );

    const chapter = subject?.chapters?.[0];
    const topic = chapter?.topics?.[0];

    setChapterId(chapter?.id ?? "");
    setTopicId(topic?.id ?? "");
  }

  function handleChapterChange(nextChapterId: string) {
    setChapterId(nextChapterId);

    const chapter = selectedSubject?.chapters.find(
      (item) => item.id === nextChapterId
    );

    setTopicId(chapter?.topics?.[0]?.id ?? "");
  }

  async function handleCreateTest() {
    try {
      setCreating(true);
      setErrorMessage("");

      if (!curriculumId || !levelId || !subjectId || !chapterId) {
        throw new Error("Please complete all selections.");
      }

      if (scope === "topic" && !topicId) {
        throw new Error("Please select a topic.");
      }

      if (availableQuestions < questionCount) {
        throw new Error(
          `Only ${availableQuestions} questions are available for this selection.`
        );
      }

      const response = await fetch(
        "/api/public/practice-tests/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            curriculumId,
            curriculumLevelId: levelId,
            chapterId: scope === "chapter" ? chapterId : null,
            sectionId: scope === "topic" ? topicId : null,
            questionCount,
            durationMinutes,
            difficultyMode,
          }),
        }
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload?.test?.id) {
        throw new Error(
          payload?.error || "Could not create the practice test."
        );
      }

      router.push(
        `/my-learning/assessments/${payload.test.id}?mode=practice`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not create the practice test."
      );
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F6FF] px-4 py-16">
        <div className="mx-auto flex max-w-3xl items-center justify-center rounded-3xl bg-white px-6 py-20 shadow-sm">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-[#5B3DF5]" />
          <p className="text-sm font-semibold text-[#111135]">
            Loading practice options...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F6FF] px-4 py-10 md:py-14">
      <div className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-[2rem] bg-[#111135] p-7 text-white shadow-xl md:p-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-[#CFC7FF]">
              <Sparkles className="h-3.5 w-3.5" />
              Free practice test
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight md:text-5xl">
              Start practising without creating an account
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              Choose your curriculum, class and topic. Get an instant
              curriculum-aligned practice test and see your result when you
              finish.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-200">
              <span className="rounded-full bg-white/10 px-3 py-2">
                No login required
              </span>
              <span className="rounded-full bg-white/10 px-3 py-2">
                Instant score
              </span>
              <span className="rounded-full bg-white/10 px-3 py-2">
                Explanations included
              </span>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F7F6FF] text-[#5B3DF5]">
              <BookOpen className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-black text-[#111135]">
                Build your practice test
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Select what you want to practise.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm leading-6 text-red-700">
              {errorMessage}
            </div>
          )}

          {curricula.length === 0 ? (
            <div className="mt-7 rounded-2xl border border-dashed border-slate-200 bg-[#F7F6FF] px-5 py-10 text-center">
              <p className="font-semibold text-[#111135]">
                No public practice content is available yet.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-7 grid gap-5 md:grid-cols-2">
                <SelectField
                  label="Curriculum"
                  value={curriculumId}
                  onChange={handleCurriculumChange}
                  options={curricula.map((curriculum) => ({
                    value: curriculum.id,
                    label: curriculum.displayName,
                  }))}
                />

                <SelectField
                  label="Class / Level"
                  value={levelId}
                  onChange={handleLevelChange}
                  options={(selectedCurriculum?.levels ?? []).map(
                    (level) => ({
                      value: level.id,
                      label: level.displayName,
                    })
                  )}
                />

                <SelectField
                  label="Subject"
                  value={subjectId}
                  onChange={handleSubjectChange}
                  options={(selectedLevel?.subjects ?? []).map(
                    (subject) => ({
                      value: subject.id,
                      label: subject.name,
                    })
                  )}
                />

                <SelectField
                  label="Chapter"
                  value={chapterId}
                  onChange={handleChapterChange}
                  options={(selectedSubject?.chapters ?? []).map(
                    (chapter) => ({
                      value: chapter.id,
                      label: chapter.name,
                    })
                  )}
                />
              </div>

              <div className="mt-6 rounded-3xl border border-slate-100 bg-[#F7F6FF] p-5">
                <p className="text-sm font-bold text-[#111135]">
                  Practice scope
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setScope("chapter")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      scope === "chapter"
                        ? "border-[#5B3DF5] bg-white shadow-sm"
                        : "border-transparent bg-white/60"
                    }`}
                  >
                    <p className="font-bold text-[#111135]">
                      Entire chapter
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedChapter?.questionCount ?? 0} questions
                      available
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScope("topic")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      scope === "topic"
                        ? "border-[#5B3DF5] bg-white shadow-sm"
                        : "border-transparent bg-white/60"
                    }`}
                  >
                    <p className="font-bold text-[#111135]">
                      Specific topic
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Focus on one section
                    </p>
                  </button>
                </div>

                {scope === "topic" && (
                  <div className="mt-5">
                    <SelectField
                      label="Topic"
                      value={topicId}
                      onChange={setTopicId}
                      options={(selectedChapter?.topics ?? []).map(
                        (topic) => ({
                          value: topic.id,
                          label: `${topic.name} (${topic.questionCount})`,
                        })
                      )}
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-3">
                <SelectField
                  label="Questions"
                  value={String(questionCount)}
                  onChange={(value) => setQuestionCount(Number(value))}
                  options={questionCounts.map((count) => ({
                    value: String(count),
                    label: `${count} questions`,
                  }))}
                />

                <SelectField
                  label="Duration"
                  value={String(durationMinutes)}
                  onChange={(value) =>
                    setDurationMinutes(Number(value))
                  }
                  options={durations.map((duration) => ({
                    value: String(duration),
                    label: `${duration} minutes`,
                  }))}
                />

                <SelectField
                  label="Difficulty"
                  value={difficultyMode}
                  onChange={(value) =>
                    setDifficultyMode(
                      value as "easy" | "mixed" | "challenging"
                    )
                  }
                  options={[
                    { value: "easy", label: "Easy" },
                    { value: "mixed", label: "Mixed — Recommended" },
                    { value: "challenging", label: "Challenging" },
                  ]}
                />
              </div>

              <div className="mt-7 flex flex-col gap-4 rounded-3xl border border-[#5B3DF5]/15 bg-[#F7F6FF] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-[#111135]">
                    <CheckCircle2 className="h-4 w-4 text-[#5B3DF5]" />
                    {availableQuestions} questions available
                  </div>

                  <p className="mt-2 text-sm text-slate-600">
                    Your selected test will contain {questionCount} questions
                    and run for {durationMinutes} minutes.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCreateTest}
                  disabled={
                    creating ||
                    availableQuestions < questionCount ||
                    availableQuestions === 0
                  }
                  className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#111135] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1D1B4F] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating test...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Start free practice
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-5 w-5 text-[#5B3DF5]" />

            <div>
              <p className="font-bold text-[#111135]">
                Want to save your progress?
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Complete the test first. You can create a free learner profile
                afterwards to keep your scores and track improvement.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-[#111135]">{label}</span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#111135] outline-none transition focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}