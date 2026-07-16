import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

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

type CurriculumDocumentRow = {
  id: string;
  curriculum_id: string;
  curriculum_level_id: string | null;
  subject: string;
  textbook_name: string | null;
  processing_status: string;
  curriculum_chapters: CurriculumChapterRow[];
};

export async function GET() {
  try {
    const questionRows: {
      id: string;
      curriculum_section_id: string | null;
    }[] = [];

    let from = 0;
    const pageSize = 1000;

    while (true) {
      const { data: page, error } = await supabaseAdmin
        .from("question_bank")
        .select("id, curriculum_section_id")
        .eq("is_active", true)
        .eq("publication_status", "published")
        .eq("validation_status", "passed")
        .eq("visibility_scope", "global")
        .range(from, from + pageSize - 1);

      if (error) {
        console.error("Public practice question lookup error:", error);

        return NextResponse.json(
          { error: "Could not load practice test options." },
          { status: 500 }
        );
      }

      questionRows.push(...(page ?? []));

      if (!page || page.length < pageSize) {
        break;
      }

      from += pageSize;
    }

    const sectionQuestionCounts = new Map<string, number>();

    for (const row of questionRows) {
      if (!row.curriculum_section_id) continue;

      sectionQuestionCounts.set(
        row.curriculum_section_id,
        (sectionQuestionCounts.get(row.curriculum_section_id) ?? 0) + 1
      );
    }

    const [
      curriculaResult,
      levelsResult,
      documentsResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("curricula")
        .select("id, code, display_name")
        .eq("is_active", true)
        .order("display_name", { ascending: true }),

      supabaseAdmin
        .from("curriculum_levels")
        .select("id, curriculum_id, code, display_name, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabaseAdmin
        .from("curriculum_documents")
        .select(`
          id,
          curriculum_id,
          curriculum_level_id,
          subject,
          textbook_name,
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
        .order("subject", { ascending: true }),
    ]);

    if (
      curriculaResult.error ||
      levelsResult.error ||
      documentsResult.error
    ) {
      console.error(
        "Public practice catalogue error:",
        curriculaResult.error ||
          levelsResult.error ||
          documentsResult.error
      );

      return NextResponse.json(
        { error: "Could not load practice test options." },
        { status: 500 }
      );
    }

    const documents = (
      (documentsResult.data ?? []) as unknown as CurriculumDocumentRow[]
    )
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
                questionCount:
                  sectionQuestionCounts.get(section.id) ?? 0,
              })),
          }))
          .filter(
            (chapter) => chapter.curriculum_sections.length > 0
          ),
      }))
      .filter(
        (document) =>
          document.curriculum_level_id &&
          document.curriculum_chapters.length > 0
      );

    const documentsByCurriculumLevel = new Map<
      string,
      CurriculumDocumentRow[]
    >();

    for (const document of documents) {
      if (!document.curriculum_level_id) continue;

      const key = `${document.curriculum_id}:${document.curriculum_level_id}`;
      const current = documentsByCurriculumLevel.get(key) ?? [];

      current.push(document);
      documentsByCurriculumLevel.set(key, current);
    }

    const levelsByCurriculum = new Map<
      string,
      {
        id: string;
        code: string;
        displayName: string;
        sortOrder: number;
      }[]
    >();

    for (const level of levelsResult.data ?? []) {
      const key = `${level.curriculum_id}:${level.id}`;

      if (!documentsByCurriculumLevel.has(key)) {
        continue;
      }

      const current = levelsByCurriculum.get(level.curriculum_id) ?? [];

      current.push({
        id: level.id,
        code: level.code,
        displayName: level.display_name,
        sortOrder: level.sort_order,
      });

      levelsByCurriculum.set(level.curriculum_id, current);
    }

    const curricula = (curriculaResult.data ?? [])
      .map((curriculum) => {
        const levels = (
          levelsByCurriculum.get(curriculum.id) ?? []
        )
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((level) => {
            const key = `${curriculum.id}:${level.id}`;
            const levelDocuments =
              documentsByCurriculumLevel.get(key) ?? [];

            const subjects = levelDocuments.map((document) => ({
              id: document.id,
              name:
                document.subject === "English" ||
                document.subject === "Hindi"
                  ? `${document.subject} - ${
                      document.textbook_name || "Textbook"
                    }`
                  : document.subject,
              chapters: document.curriculum_chapters.map(
                (chapter) => {
                  const topics =
                    chapter.curriculum_sections.map(
                      (section: any) => ({
                        id: section.id,
                        name: section.section_code
                          ? `${section.section_code} ${section.topic_name_exact}`
                          : section.topic_name_exact,
                        questionCount: section.questionCount,
                      })
                    );

                  return {
                    id: chapter.id,
                    name: chapter.chapter_number
                      ? `Chapter ${chapter.chapter_number}: ${chapter.chapter_name}`
                      : chapter.chapter_name,
                    questionCount: topics.reduce(
                      (total, topic) =>
                        total + topic.questionCount,
                      0
                    ),
                    topics,
                  };
                }
              ),
            }));

            return {
              ...level,
              subjects,
            };
          });

        return {
          id: curriculum.id,
          code: curriculum.code,
          displayName: curriculum.display_name,
          levels,
        };
      })
      .filter((curriculum) => curriculum.levels.length > 0);

    return NextResponse.json({
      curricula,
      questionCounts: [10, 20, 30, 40],
      durations: [15, 30, 45, 60],
      difficulties: [
        { id: "easy", label: "Easy" },
        {
          id: "mixed",
          label: "Mixed",
          recommended: true,
        },
        {
          id: "challenging",
          label: "Challenging",
        },
      ],
    });
  } catch (error) {
    console.error(
      "Unexpected public practice options error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while loading practice test options.",
      },
      { status: 500 }
    );
  }
}