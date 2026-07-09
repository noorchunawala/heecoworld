import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";
import {
  requireAuthenticatedUser,
  requireOwnedActiveLearner,
} from "@/lib/learnerAssessmentAccess";

type CurriculumSectionRow = {
  id: string;
  section_code: string | null;
  topic_name_exact: string;
  is_active: boolean;
  review_status: string;
};

type CurriculumChapterRow = {
  id: string;
  chapter_number: string | null;
  chapter_name: string;
  is_active: boolean;
  curriculum_sections: CurriculumSectionRow[];
};

type CatalogDocumentRow = {
  id: string;
  curriculum_id: string;
  curriculum_level_id: string | null;
  subject: string;
  processing_status: string;
  curriculum_chapters: CurriculumChapterRow[];
};

export async function GET(request: NextRequest) {
  try {
    const learnerId = new URL(request.url).searchParams.get("learnerId")?.trim();

    if (!learnerId) {
      return NextResponse.json(
        { error: "Learner profile is required." },
        { status: 400 }
      );
    }

    const auth = await requireAuthenticatedUser(request);
    if (!auth.ok) return auth.response;

    const learnerAccess = await requireOwnedActiveLearner(auth.userId, learnerId);
    if (!learnerAccess.ok) return learnerAccess.response;

    const learner = learnerAccess.learner;

    const { data: questionRows, error: questionError } = await supabaseAdmin
      .from("question_bank")
      .select("id, curriculum_section_id")
      .eq("is_active", true)
      .eq("publication_status", "published");

    if (questionError) {
      console.error("Practice options question lookup error:", questionError);
      return NextResponse.json(
        { error: "Could not load practice test options.", message: questionError.message },
        { status: 500 }
      );
    }

    const sectionQuestionCounts = new Map<string, number>();

    for (const row of questionRows || []) {
      if (!row.curriculum_section_id) continue;

      sectionQuestionCounts.set(
        row.curriculum_section_id,
        (sectionQuestionCounts.get(row.curriculum_section_id) || 0) + 1
      );
    }

    const { data, error } = await supabaseAdmin
      .from("curriculum_documents")
      .select(`
        id,
        curriculum_id,
        curriculum_level_id,
        subject,
        processing_status,
        curriculum_chapters (
          id,
          chapter_number,
          chapter_name,
          is_active,
          curriculum_sections (
            id,
            section_code,
            topic_name_exact,
            is_active,
            review_status
          )
        )
      `)
      .eq("processing_status", "published")
      .eq("curriculum_id", learner.curriculum_id)
      .eq("curriculum_level_id", learner.curriculum_level_id)
      .order("subject", { ascending: true });

    if (error) {
      console.error("Practice create-options catalog error:", error);
      return NextResponse.json(
        { error: "Could not load practice test options.", message: error.message },
        { status: 500 }
      );
    }

    const catalog = ((data ?? []) as unknown as CatalogDocumentRow[])
      .map((document) => ({
        ...document,
        curriculum_chapters: (document.curriculum_chapters ?? [])
          .filter((chapter) => chapter.is_active)
          .map((chapter) => ({
            ...chapter,
            curriculum_sections: (chapter.curriculum_sections ?? [])
              .filter(
                (section) =>
                  section.is_active &&
                  section.review_status === "approved" &&
                  sectionQuestionCounts.has(section.id)
              )
              .map((section) => ({
                ...section,
                questionCount: sectionQuestionCounts.get(section.id) || 0,
              })),
          }))
          .filter((chapter) => chapter.curriculum_sections.length > 0),
      }))
      .filter((document) => document.curriculum_chapters.length > 0);

const subjects = catalog.map((document) => ({
  id: document.subject,
  name: document.subject,
  chapters: document.curriculum_chapters.map((chapter) => {
    const topics = chapter.curriculum_sections.map((section: any) => ({
      id: section.id,
      name: section.section_code
        ? `${section.section_code} ${section.topic_name_exact}`
        : section.topic_name_exact,
      questionCount: section.questionCount,
    }));

    return {
      id: chapter.id,
      name: chapter.chapter_number
        ? `Chapter ${chapter.chapter_number}: ${chapter.chapter_name}`
        : chapter.chapter_name,
      questionCount: topics.reduce(
        (total, topic) => total + topic.questionCount,
        0
      ),
      topics,
    };
  }),
}));

    return NextResponse.json({
      learner: {
        id: learner.id,
        name: learner.full_name,
      },
      subjects,
      questionCounts: [10, 20, 30, 40],
      durations: [15, 30, 45, 60],
      difficulties: [
        { id: "easy", label: "Easy" },
        { id: "mixed", label: "Mixed", recommended: true },
        { id: "challenging", label: "Challenging" },
      ],
    });
  } catch (error) {
    console.error("Unexpected practice create-options error:", error);
    return NextResponse.json(
      { error: "Something went wrong while loading practice test options." },
      { status: 500 }
    );
  }
}