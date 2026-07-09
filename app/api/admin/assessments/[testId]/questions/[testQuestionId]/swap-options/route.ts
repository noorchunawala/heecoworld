import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

type RouteContext = {
  params: Promise<{
    testId: string;
    testQuestionId: string;
  }>;
};

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

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const user = await getLoggedInUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { testId, testQuestionId } = await params;

    const { data: test, error: testError } = await supabaseAdmin
      .from("tests")
      .select("id, status")
      .eq("id", testId)
      .eq("created_by_user_id", user.id)
      .single();

    if (testError || !test) {
      return NextResponse.json(
        { error: "Draft test not found or you do not have access to it." },
        { status: 404 }
      );
    }

    if (test.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft tests can be edited." },
        { status: 409 }
      );
    }

    const { data: currentQuestion, error: currentQuestionError } =
      await supabaseAdmin
        .from("test_questions")
        .select(`
          id,
          question_id,
          curriculum_section_id,
          question_snapshot
        `)
        .eq("id", testQuestionId)
        .eq("test_id", testId)
        .single();

    if (currentQuestionError || !currentQuestion) {
      return NextResponse.json(
        { error: "Question not found in this draft test." },
        { status: 404 }
      );
    }

    const currentSnapshot = currentQuestion.question_snapshot as {
      difficulty?: string;
    };

    const currentDifficulty = currentSnapshot?.difficulty;

    if (
      !currentQuestion.curriculum_section_id ||
      !currentDifficulty ||
      !["easy", "medium", "hard"].includes(currentDifficulty)
    ) {
      return NextResponse.json(
        { error: "This question does not have enough syllabus data to swap." },
        { status: 422 }
      );
    }

    const { data: usedQuestions, error: usedQuestionsError } =
      await supabaseAdmin
        .from("test_questions")
        .select("question_id")
        .eq("test_id", testId)
        .not("question_id", "is", null);

    if (usedQuestionsError) {
      console.error("Used draft question lookup error:", usedQuestionsError);

      return NextResponse.json(
        { error: "Could not identify questions already used in this test." },
        { status: 500 }
      );
    }

    const usedQuestionIds = new Set(
      (usedQuestions ?? [])
        .map((item) => item.question_id)
        .filter((id): id is string => Boolean(id))
    );

    const { data: allCandidates, error: candidatesError } =
      await supabaseAdmin
        .from("question_bank")
        .select(`
          id,
          question_type,
          difficulty,
          question_text,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_option,
          correct_answer_text,
          explanation,
          marks,
          negative_marks,
          inclusion_tags
        `)
        .eq("curriculum_section_id", currentQuestion.curriculum_section_id)
        .eq("difficulty", currentDifficulty)
        .eq("publication_status", "published")
        .eq("validation_status", "passed")
        .eq("visibility_scope", "global")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    if (candidatesError) {
      console.error("Swap candidate lookup error:", candidatesError);

      return NextResponse.json(
        { error: "Could not load replacement questions." },
        { status: 500 }
      );
    }

    const candidates = (allCandidates ?? [])
      .filter((candidate) => !usedQuestionIds.has(candidate.id))
      .slice(0, 10);

    return NextResponse.json({
      currentDifficulty,
      candidates,
    });
  } catch (error) {
    console.error("Unexpected swap-options error:", error);

    return NextResponse.json(
      { error: "Something went wrong while loading replacement questions." },
      { status: 500 }
    );
  }
}