import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

type DifficultyMode = "easy" | "mixed" | "challenging";

function buildDifficultyMix(questionCount: number, mode: DifficultyMode) {
  if (mode === "easy") {
    return {
      easy: questionCount,
      medium: 0,
      hard: 0,
    };
  }

  if (mode === "challenging") {
    const hard = Math.ceil(questionCount * 0.6);
    const medium = questionCount - hard;

    return {
      easy: 0,
      medium,
      hard,
    };
  }

  const easy = Math.floor(questionCount * 0.34);
  const medium = Math.floor(questionCount * 0.33);
  const hard = questionCount - easy - medium;

  return {
    easy,
    medium,
    hard,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    const curriculumId =
      typeof body?.curriculumId === "string"
        ? body.curriculumId.trim()
        : "";

    const curriculumLevelId =
      typeof body?.curriculumLevelId === "string"
        ? body.curriculumLevelId.trim()
        : "";

    const sectionId =
      typeof body?.sectionId === "string"
        ? body.sectionId.trim()
        : "";

    const chapterId =
      typeof body?.chapterId === "string"
        ? body.chapterId.trim()
        : "";

    const questionCount = Number(body?.questionCount);
    const durationMinutes = Number(body?.durationMinutes);

    const difficultyMode: DifficultyMode =
      body?.difficultyMode === "easy" ||
      body?.difficultyMode === "mixed" ||
      body?.difficultyMode === "challenging"
        ? body.difficultyMode
        : "mixed";

    if (!curriculumId || !curriculumLevelId) {
      return NextResponse.json(
        {
          error: "Curriculum and academic level are required.",
        },
        { status: 400 }
      );
    }

    if ((!sectionId && !chapterId) || (sectionId && chapterId)) {
      return NextResponse.json(
        {
          error:
            "Select either an entire chapter or a specific topic.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(questionCount) ||
      questionCount < 1 ||
      questionCount > 100
    ) {
      return NextResponse.json(
        {
          error: "Select between 1 and 100 questions.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 1 ||
      durationMinutes > 240
    ) {
      return NextResponse.json(
        {
          error: "Duration must be between 1 and 240 minutes.",
        },
        { status: 400 }
      );
    }

    const difficultyMix = buildDifficultyMix(
      questionCount,
      difficultyMode
    );

    const { data: testId, error: createError } =
      await supabaseAdmin.rpc(
        "create_guest_practice_test_from_question_bank",
        {
          p_curriculum_id: curriculumId,
          p_curriculum_level_id: curriculumLevelId,
          p_section_id: sectionId || null,
          p_chapter_id: chapterId || null,
          p_question_count: questionCount,
          p_duration_minutes: durationMinutes,
          p_difficulty_mix: difficultyMix,
        }
      );

    if (createError || !testId) {
      console.error(
        "Create public practice test error:",
        createError
      );

      return NextResponse.json(
        {
          error:
            createError?.message ||
            "Could not create a practice test from the available question bank.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      message: "Practice test created successfully.",
      test: {
        id: testId,
      },
      assessmentUrl: `/my-learning/assessments/${testId}?mode=practice`,
    });
  } catch (error) {
    console.error(
      "Unexpected public practice test creation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while creating the practice test.",
      },
      { status: 500 }
    );
  }
}