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

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.replace("Bearer ", "").trim();

  return token || null;
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);

    const schoolId =
      typeof body?.schoolId === "string" ? body.schoolId.trim() : "";

    const title =
      typeof body?.title === "string" ? body.title.trim() : "";

    const curriculumId =
      typeof body?.curriculumId === "string" ? body.curriculumId : "";

    const classLevel =
      typeof body?.classLevel === "string" ? body.classLevel.trim() : "";

    const subject =
      typeof body?.subject === "string" ? body.subject.trim() : "";

    const sectionId =
      typeof body?.sectionId === "string" ? body.sectionId : "";
      const chapterId =
  typeof body?.chapterId === "string" ? body.chapterId : "";

    const durationMinutes = Number(body?.durationMinutes);

    const instructions =
      typeof body?.instructions === "string"
        ? body.instructions.trim() || null
        : null;

    const difficultyMix = body?.difficultyMix;

    if (
      !schoolId ||
      !title ||
      !curriculumId ||
      !classLevel ||
      !subject ||
       (!sectionId && !chapterId)
    ) {
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

    /*
      Resolve membership from the logged-in user.
      Do not trust a membership ID sent by the browser.
    */
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("school_memberships")
      .select("id, school_listing_id")
      .eq("user_id", user.id)
      .eq("school_listing_id", schoolId)
      .eq("role", "teacher")
      .eq("status", "active")
      .maybeSingle();

    if (membershipError) {
      return NextResponse.json(
        { error: membershipError.message },
        { status: 500 }
      );
    }

    if (!membership) {
      return NextResponse.json(
        {
          error:
            "You do not have active teacher access for this school.",
        },
        { status: 403 }
      );
    }

    const { data: testId, error: createError } = await supabaseAdmin.rpc(
      "create_school_test_from_question_bank",
      {
        p_created_by_user_id: user.id,
        p_school_listing_id: schoolId,
        p_created_by_membership_id: membership.id,
        p_title: title,
        p_curriculum_id: curriculumId,
        p_class_level: classLevel,
        p_subject: subject,
        p_section_id: sectionId || null,
p_chapter_id: chapterId || null,
        p_question_count: questionCount,
        p_duration_minutes: durationMinutes,
        p_difficulty_mix: difficultyMix,
        p_instructions: instructions,
      }
    );

    if (createError || !testId) {
      console.error("Create school test error:", createError);

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
      .select(
        "id, title, status, share_code, total_questions, school_listing_id, created_by_membership_id"
      )
      .eq("id", testId)
      .single();

    if (testLookupError || !test) {
      console.error("Created school test lookup error:", testLookupError);

      return NextResponse.json(
        { error: "Test was created, but its details could not be loaded." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Draft school test created successfully.",
      test,
    });
  } catch (error) {
    console.error("Unexpected school test creation error:", error);

    return NextResponse.json(
      { error: "Something went wrong while creating the school test." },
      { status: 500 }
    );
  }
}