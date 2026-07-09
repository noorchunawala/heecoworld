import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";
import {
  getAllowedCurriculumCodes,
  type GlobalCurriculumCode,
} from "@/lib/assessmentCurriculumMatching";

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  return token || null;
}

type QuestionCounts = {
  easy: number;
  medium: number;
  hard: number;
  total: number;
};

type CurriculumRow = {
  id: string;
  code: string;
  display_name: string;
  curriculum_family: string | null;
};

type CurriculumLevelRow = {
  id: string;
  curriculum_id: string;
  code: string;
  display_name: string;
  sort_order: number;
  is_active: boolean;
};

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
  class_level: string;
  subject: string;
  textbook_name: string;
  textbook_year_or_version: string | null;
  processing_status: string;
  curricula: CurriculumRow | CurriculumRow[] | null;
  curriculum_chapters: CurriculumChapterRow[];
};

function getCurriculumRow(
  value: CurriculumRow | CurriculumRow[] | null
): CurriculumRow | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function emptyCounts(): QuestionCounts {
  return { easy: 0, medium: 0, hard: 0, total: 0 };
}

export async function GET(request: NextRequest) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const schoolId = new URL(request.url).searchParams.get("schoolId")?.trim();

    if (!schoolId) {
      return NextResponse.json(
        { error: "School ID is required." },
        { status: 400 }
      );
    }

    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("school_memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("school_listing_id", schoolId)
      .eq("role", "teacher")
      .eq("status", "active")
      .maybeSingle();

    if (membershipError) {
      console.error("School assessment catalog membership error:", membershipError);
      return NextResponse.json(
        { error: "Could not verify your teacher access." },
        { status: 500 }
      );
    }

    if (!membership) {
      return NextResponse.json(
        {
          error:
            "You do not have active teacher access for this school's assessments.",
        },
        { status: 403 }
      );
    }

    const { data: schoolProfile, error: schoolProfileError } =
      await supabaseAdmin
        .from("school_profiles")
        .select("curricula")
        .eq("listing_id", schoolId)
        .maybeSingle();

    if (schoolProfileError) {
      console.error("School assessment catalog school-profile error:", schoolProfileError);
      return NextResponse.json(
        { error: "Could not load this school's curriculum settings." },
        { status: 500 }
      );
    }

    const allowedCurriculumCodes = getAllowedCurriculumCodes(
      schoolProfile?.curricula
    );

    if (allowedCurriculumCodes.size === 0) {
      return NextResponse.json(
        {
          error:
            "Assessment curriculum options are not available for this school yet.",
        },
        { status: 422 }
      );
    }

    const allowedCodes = [...allowedCurriculumCodes];

    const { data: globalCurricula, error: globalCurriculaError } =
      await supabaseAdmin
        .from("curricula")
        .select("id, code, display_name, curriculum_family")
        .eq("is_active", true)
        .in("code", allowedCodes)
        .order("display_name", { ascending: true });

    if (globalCurriculaError) {
      console.error("School assessment global curricula error:", globalCurriculaError);
      return NextResponse.json(
        { error: "Could not load the global curriculum catalog." },
        { status: 500 }
      );
    }

    const curriculumRows = (globalCurricula ?? []) as CurriculumRow[];
    const curriculumIds = curriculumRows.map((curriculum) => curriculum.id);

    if (curriculumIds.length === 0) {
      return NextResponse.json({ catalog: [], curricula: [] });
    }

    const [{ data: globalLevels, error: globalLevelsError }, { data, error }] =
      await Promise.all([
        supabaseAdmin
          .from("curriculum_levels")
          .select("id, curriculum_id, code, display_name, sort_order, is_active")
          .in("curriculum_id", curriculumIds)
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),

        supabaseAdmin
          .from("curriculum_documents")
          .select(`
            id,
            curriculum_id,
            curriculum_level_id,
            class_level,
            subject,
            textbook_name,
            textbook_year_or_version,
            processing_status,
            curricula (
              id,
              code,
              display_name,
              curriculum_family
            ),
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
          .in("curriculum_id", curriculumIds)
          .order("class_level", { ascending: true }),
      ]);

    if (globalLevelsError) {
      console.error("School assessment global levels error:", globalLevelsError);
      return NextResponse.json(
        { error: "Could not load global academic levels." },
        { status: 500 }
      );
    }

    if (error) {
      console.error("School assessment catalog error:", error);
      return NextResponse.json(
        { error: "Could not load assessment curriculum data." },
        { status: 500 }
      );
    }

    const rawCatalog = (data ?? []) as unknown as CatalogDocumentRow[];

    const sectionIds = rawCatalog.flatMap((document) =>
      (document.curriculum_chapters ?? []).flatMap((chapter) =>
        (chapter.curriculum_sections ?? [])
          .filter(
            (section) =>
              section.is_active && section.review_status === "approved"
          )
          .map((section) => section.id)
      )
    );

    const sectionCountMap = new Map<string, QuestionCounts>();

    if (sectionIds.length > 0) {
      const { data: questionRows, error: questionError } = await supabaseAdmin
        .from("question_bank")
        .select("curriculum_section_id, difficulty")
        .in("curriculum_section_id", sectionIds)
        .eq("publication_status", "published")
        .eq("validation_status", "passed")
        .eq("visibility_scope", "global")
        .eq("is_active", true);

      if (questionError) {
        console.error("School assessment question count error:", questionError);
        return NextResponse.json(
          { error: "Could not load question availability." },
          { status: 500 }
        );
      }

      for (const row of questionRows || []) {
        const sectionId = row.curriculum_section_id as string | null;
        const difficulty = row.difficulty as string | null;

        if (!sectionId) continue;

        const current = sectionCountMap.get(sectionId) ?? emptyCounts();

        if (difficulty === "easy") current.easy += 1;
        if (difficulty === "medium") current.medium += 1;
        if (difficulty === "hard") current.hard += 1;

        current.total += 1;
        sectionCountMap.set(sectionId, current);
      }
    }

    const catalog = rawCatalog
      .filter((document) => {
        const curriculum = getCurriculumRow(document.curricula);

        return Boolean(
          curriculum &&
            allowedCurriculumCodes.has(curriculum.code as GlobalCurriculumCode)
        );
      })
      .map((document) => ({
        ...document,
        curriculum_chapters: (document.curriculum_chapters ?? [])
          .filter((chapter) => chapter.is_active)
          .map((chapter) => {
            const sections = (chapter.curriculum_sections ?? [])
              .filter(
                (section) =>
                  section.is_active && section.review_status === "approved"
              )
            .map((section) => {
  const counts = sectionCountMap.get(section.id) ?? emptyCounts();

  return {
    ...section,
    question_counts: counts,
    questionCounts: counts,
  };
})
              .filter((section) => section.question_counts.total > 0);

            const chapterCounts = sections.reduce(
              (total, section) => ({
                easy: total.easy + section.question_counts.easy,
                medium: total.medium + section.question_counts.medium,
                hard: total.hard + section.question_counts.hard,
                total: total.total + section.question_counts.total,
              }),
              emptyCounts()
            );

           return {
  ...chapter,
  question_counts: chapterCounts,
  questionCounts: chapterCounts,
  curriculum_sections: sections,
};
          })
          .filter((chapter) => chapter.curriculum_sections.length > 0),
      }))
      .filter(
        (document) =>
          Boolean(document.curriculum_level_id) &&
          document.curriculum_chapters.length > 0
      );

    const availableLevelIds = new Set(
      catalog
        .map((document) => document.curriculum_level_id)
        .filter((levelId): levelId is string => Boolean(levelId))
    );

    const levelRows = (globalLevels ?? []) as CurriculumLevelRow[];

    const curricula = curriculumRows.map((curriculum) => ({
      id: curriculum.id,
      code: curriculum.code,
      displayName: curriculum.display_name,
      levels: levelRows
        .filter((level) => level.curriculum_id === curriculum.id)
        .map((level) => ({
          id: level.id,
          code: level.code,
          displayName: level.display_name,
          sortOrder: level.sort_order,
          hasPublishedContent: availableLevelIds.has(level.id),
        })),
    }));
    console.log(
  "Teacher catalog debug:",
  JSON.stringify(
    catalog.map((doc: any) => ({
      subject: doc.subject,
      chapters: doc.curriculum_chapters.map((chapter: any) => ({
        chapter: chapter.chapter_name,
        counts: chapter.question_counts || chapter.questionCounts,
        sections: chapter.curriculum_sections.map((section: any) => ({
          topic: section.topic_name_exact,
          counts: section.question_counts || section.questionCounts,
        })),
      })),
    })),
    null,
    2
  )
);

    return NextResponse.json({
      catalog,
      curricula,
    });
  } catch (error) {
    console.error("Unexpected school assessment catalog error:", error);

    return NextResponse.json(
      { error: "Something went wrong while loading the assessment catalog." },
      { status: 500 }
    );
  }
}