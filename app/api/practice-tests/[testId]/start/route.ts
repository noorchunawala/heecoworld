import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";
import {
  requireAuthenticatedUser,
  requireOwnedActiveLearner,
} from "@/lib/learnerAssessmentAccess";

type RouteContext = {
  params: Promise<{ testId: string }>;
};

function toAttemptResponse(attempt: any) {
  const isCompleted =
    attempt.status === "submitted" || attempt.status === "auto_submitted";

  return {
    id: attempt.id,
    token: attempt.attempt_token,
    status: attempt.status,
    startedAt: attempt.started_at,
    expiresAt: attempt.expires_at,
    submittedAt: attempt.submitted_at,
    timeTakenSeconds: attempt.time_taken_seconds,
    score: attempt.score,
    totalMarks: attempt.total_marks,
    percentage: attempt.percentage,
    isCompleted,
  };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { testId } = await params;
    const body = await request.json().catch(() => ({}));

    const learnerId =
      typeof body?.learnerId === "string" ? body.learnerId.trim() : "";

    if (!testId || !learnerId) {
      return NextResponse.json(
        { error: "Practice test and learner profile are required." },
        { status: 400 }
      );
    }

    const auth = await requireAuthenticatedUser(request);
    if (!auth.ok) return auth.response;

    const learnerAccess = await requireOwnedActiveLearner(
      auth.userId,
      learnerId
    );

    if (!learnerAccess.ok) return learnerAccess.response;

    const learner = learnerAccess.learner;

    const { data: test, error: testError } = await supabaseAdmin
      .from("tests")
      .select("id, duration_minutes")
      .eq("id", testId)
      .eq("created_by_user_id", auth.userId)
      .eq("access_mode", "practice")
      .eq("status", "published")
      .eq("curriculum_id", learner.curriculum_id)
      .eq("curriculum_level_id", learner.curriculum_level_id)
      .maybeSingle();

    if (testError) {
      console.error("Practice test start lookup error:", testError);

      return NextResponse.json(
        { error: "Could not prepare this practice test." },
        { status: 500 }
      );
    }

    if (!test) {
      return NextResponse.json(
        { error: "This practice test is not available for the selected learner." },
        { status: 404 }
      );
    }

    const { data: existingAttempt, error: existingAttemptError } =
      await supabaseAdmin
        .from("test_attempts")
        .select(
          "id, attempt_token, status, started_at, expires_at, submitted_at, time_taken_seconds, score, total_marks, percentage"
        )
        .eq("test_id", test.id)
        .eq("learner_profile_id", learner.id)
        .maybeSingle();

    if (existingAttemptError) {
      console.error("Practice existing attempt lookup error:", existingAttemptError);

      return NextResponse.json(
        { error: "Could not check existing practice attempt." },
        { status: 500 }
      );
    }

    if (existingAttempt) {
      return NextResponse.json({
        message:
          existingAttempt.status === "in_progress"
            ? "Resuming the existing practice test."
            : "This practice test was already completed.",
        mode:
          existingAttempt.status === "in_progress" ? "resume" : "completed",
        attempt: toAttemptResponse(existingAttempt),
      });
    }

    const startedAt = new Date();
    const expiresAt = new Date(
      startedAt.getTime() + Number(test.duration_minutes) * 60 * 1000
    );

    const { data: newAttempt, error: newAttemptError } = await supabaseAdmin
      .from("test_attempts")
      .insert({
        test_id: test.id,
        learner_profile_id: learner.id,
        student_user_id: auth.userId,
        student_name: learner.full_name,
        class_or_grade: learner.grade,
        attempt_number: 1,
        status: "in_progress",
        started_at: startedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select(
        "id, attempt_token, status, started_at, expires_at, submitted_at, time_taken_seconds, score, total_marks, percentage"
      )
      .single();

    if (newAttemptError || !newAttempt) {
      console.error("Practice start insert error:", newAttemptError);

      return NextResponse.json(
        { error: "Could not start this practice test." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Practice test started successfully.",
      mode: "started",
      attempt: toAttemptResponse(newAttempt),
    });
  } catch (error) {
    console.error("Unexpected practice test start error:", error);

    return NextResponse.json(
      { error: "Something went wrong while starting this practice test." },
      { status: 500 }
    );
  }
}