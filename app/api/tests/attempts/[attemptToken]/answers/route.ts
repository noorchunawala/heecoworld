import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";
import {
  requireAuthenticatedUser,
  requireOwnedLearnerAttempt,
} from "@/lib/learnerAssessmentAccess";

type RouteContext = {
  params: Promise<{
    attemptToken: string;
  }>;
};

export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { attemptToken } = await params;
    const body = await request.json();

    const testQuestionId =
      typeof body.testQuestionId === "string" ? body.testQuestionId : "";

    const selectedOption =
      typeof body.selectedOption === "string" ? body.selectedOption : "";

    if (!testQuestionId) {
      return NextResponse.json(
        { error: "Question ID is required." },
        { status: 400 }
      );
    }

    if (!["A", "B", "C", "D"].includes(selectedOption)) {
      return NextResponse.json(
        { error: "Please select a valid answer option." },
        { status: 400 }
      );
    }

    const auth = await requireAuthenticatedUser(request);

    if (!auth.ok) {
      return auth.response;
    }

    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from("test_attempts")
      .select(`
        id,
        test_id,
        learner_profile_id,
        student_user_id,
        status,
        expires_at
      `)
      .eq("attempt_token", attemptToken)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json(
        { error: "This test attempt could not be found." },
        { status: 404 }
      );
    }

    const attemptAccess = await requireOwnedLearnerAttempt(
      auth.userId,
      attempt.learner_profile_id,
      attempt.student_user_id
    );

    if (!attemptAccess.ok) {
      return attemptAccess.response;
    }

    if (attempt.status !== "in_progress") {
      return NextResponse.json(
        { error: "This test has already been submitted." },
        { status: 409 }
      );
    }

    if (new Date(attempt.expires_at).getTime() <= Date.now()) {
      return NextResponse.json(
        {
          error: "Time has ended for this test.",
          shouldAutoSubmit: true,
        },
        { status: 410 }
      );
    }

    const { data: testQuestion, error: testQuestionError } =
      await supabaseAdmin
        .from("test_questions")
        .select(`
          id,
          question_snapshot
        `)
        .eq("id", testQuestionId)
        .eq("test_id", attempt.test_id)
        .single();

    if (testQuestionError || !testQuestion) {
      return NextResponse.json(
        { error: "This question does not belong to the current test." },
        { status: 404 }
      );
    }

    const snapshot = testQuestion.question_snapshot as {
      question_type?: string;
    };

    if (snapshot.question_type !== "mcq") {
      return NextResponse.json(
        { error: "Only MCQ answer saving is available in V1." },
        { status: 422 }
      );
    }

    const { error: saveError } = await supabaseAdmin
      .from("attempt_answers")
      .upsert(
        {
          attempt_id: attempt.id,
          test_question_id: testQuestionId,
          selected_option: selectedOption,
          answered_at: new Date().toISOString(),
        },
        {
          onConflict: "attempt_id,test_question_id",
        }
      );

    if (saveError) {
      console.error("Save test answer error:", saveError);

      return NextResponse.json(
        { error: "Could not save this answer." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Answer saved.",
      testQuestionId,
      selectedOption,
    });
  } catch (error) {
    console.error("Unexpected save test answer error:", error);

    return NextResponse.json(
      { error: "Something went wrong while saving the answer." },
      { status: 500 }
    );
  }
}
