import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

type DifficultyMix = {
  easy: number;
  medium: number;
  hard: number;
};

function isValidDifficultyMix(value: unknown): value is DifficultyMix {
  if (!value || typeof value !== "object") {
    return false;
  }

  const mix = value as Record<string, unknown>;

  return (
    typeof mix.easy === "number" &&
    typeof mix.medium === "number" &&
    typeof mix.hard === "number" &&
    Number.isInteger(mix.easy) &&
    Number.isInteger(mix.medium) &&
    Number.isInteger(mix.hard) &&
    mix.easy >= 0 &&
    mix.medium >= 0 &&
    mix.hard >= 0
  );
}

async function getLoggedInUser(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.replace("Bearer ", "").trim();

  if (!token) {
    return null;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getLoggedInUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const curriculumId =
      typeof body.curriculumId === "string" ? body.curriculumId : "";
    const classLevel =
      typeof body.classLevel === "string" ? body.classLevel.trim() : "";
    const subject =
      typeof body.subject === "string" ? body.subject.trim() : "";
    const sectionId =
      typeof body.sectionId === "string" ? body.sectionId : "";
    const durationMinutes = Number(body.durationMinutes);
    const instructions =
      typeof body.instructions === "string" ? body.instructions.trim() : null;
    const difficultyMix = body.difficultyMix;

    if (!title || !curriculumId || !classLevel || !subject || !sectionId) {
      return NextResponse.json(
        { error: "Please complete all required test details." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 1 ||
      durationMinutes > 240
    ) {
      return NextResponse.json(
        { error: "Duration must be between 1 and 240 minutes." },
        { status: 400 }
      );
    }

    if (!isValidDifficultyMix(difficultyMix)) {
      return NextResponse.json(
        { error: "Please provide a valid difficulty mix." },
        { status: 400 }
      );
    }

    const questionCount =
      difficultyMix.easy + difficultyMix.medium + difficultyMix.hard;

    if (questionCount < 1 || questionCount > 100) {
      return NextResponse.json(
        { error: "Select between 1 and 100 questions." },
        { status: 400 }
      );
    }

    const { data: testId, error: createError } = await supabaseAdmin.rpc(
      "create_test_from_question_bank",
      {
        p_created_by_user_id: user.id,
        p_title: title,
        p_curriculum_id: curriculumId,
        p_class_level: classLevel,
        p_subject: subject,
        p_section_id: sectionId,
        p_question_count: questionCount,
        p_duration_minutes: durationMinutes,
        p_difficulty_mix: difficultyMix,
        p_instructions: instructions,
      }
    );

    if (createError || !testId) {
      console.error("Create assessment test error:", createError);

      return NextResponse.json(
        {
          error:
            createError?.message ||
            "Could not create the test from the available question bank.",
        },
        { status: 422 }
      );
    }

    const { data: test, error: testLookupError } = await supabaseAdmin
      .from("tests")
      .select("id, title, status, share_code, total_questions")
      .eq("id", testId)
      .single();

    if (testLookupError || !test) {
      console.error("Created test lookup error:", testLookupError);

      return NextResponse.json(
        { error: "Test was created, but its details could not be loaded." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Draft test created successfully.",
      test,
    });
  } catch (error) {
    console.error("Unexpected create assessment test error:", error);

    return NextResponse.json(
      { error: "Something went wrong while creating the test." },
      { status: 500 }
    );
  }
}