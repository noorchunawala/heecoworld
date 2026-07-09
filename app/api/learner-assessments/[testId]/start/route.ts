import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";
import {
  requireAuthenticatedUser,
  requireOwnedActiveLearner,
} from "@/lib/learnerAssessmentAccess";

type RouteContext = { params: Promise<{ testId: string }> };

type AttemptRow = {
  id: string;
  attempt_token: string;
  status: "in_progress" | "submitted" | "auto_submitted";
  started_at: string;
  expires_at: string;
  submitted_at: string | null;
  time_taken_seconds: number | null;
  score: number | null;
  total_marks: number | null;
  percentage: number | null;
};

function toAttemptResponse(attempt: AttemptRow) {
  const isCompleted = attempt.status === "submitted" || attempt.status === "auto_submitted";
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
    const learnerId = typeof body?.learnerId === "string" ? body.learnerId.trim() : "";
    const assessmentCode = typeof body?.assessmentCode === "string" ? body.assessmentCode.trim().toUpperCase() : "";

    if (!testId || !learnerId) {
      return NextResponse.json({ error: "Test and learner profile are required." }, { status: 400 });
    }

    const auth = await requireAuthenticatedUser(request);
    if (!auth.ok) return auth.response;

    const learnerAccess = await requireOwnedActiveLearner(auth.userId, learnerId);
    if (!learnerAccess.ok) return learnerAccess.response;
    const learner = learnerAccess.learner;

    const { data: test, error: testError } = await supabaseAdmin
      .from("tests")
      .select("id, share_code, duration_minutes, start_at, end_at")
      .eq("id", testId)
      .eq("school_listing_id", learner.school_listing_id)
      .eq("curriculum_id", learner.curriculum_id)
      .eq("curriculum_level_id", learner.curriculum_level_id)
      .eq("status", "published")
      .eq("access_mode", "private_class")
      .maybeSingle();

    if (testError) {
      console.error("Learner assessment start test lookup error:", testError);
      return NextResponse.json({ error: "Could not prepare this assessment." }, { status: 500 });
    }
    if (!test) {
      return NextResponse.json({ error: "This assessment is not available for the selected learner." }, { status: 404 });
    }

    const { data: existingAttempt, error: existingAttemptError } = await supabaseAdmin
      .from("test_attempts")
      .select(`id, attempt_token, status, started_at, expires_at, submitted_at, time_taken_seconds, score, total_marks, percentage`)
      .eq("test_id", test.id)
      .eq("learner_profile_id", learner.id)
      .maybeSingle();

    if (existingAttemptError) {
      console.error("Learner assessment existing-attempt lookup error:", existingAttemptError);
      return NextResponse.json({ error: "Could not check the existing assessment attempt." }, { status: 500 });
    }
    if (existingAttempt) {
      const attempt = existingAttempt as AttemptRow;
      const mode = attempt.status === "in_progress" ? "resume" : "completed";
      return NextResponse.json({
        message: mode === "resume" ? "Resuming the existing assessment attempt." : "This assessment was already completed.",
        mode,
        attempt: toAttemptResponse(attempt),
      });
    }

    const now = new Date();
    if (test.start_at && new Date(test.start_at) > now) {
      return NextResponse.json({ error: "This assessment has not started yet." }, { status: 409 });
    }
    if (test.end_at && new Date(test.end_at) <= now) {
      return NextResponse.json({ error: "This assessment is closed." }, { status: 410 });
    }
    if (!assessmentCode || test.share_code !== assessmentCode) {
      return NextResponse.json({ error: "Enter the valid assessment code shared by the teacher." }, { status: 403 });
    }

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + test.duration_minutes * 60 * 1000);
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
      .select(`id, attempt_token, status, started_at, expires_at, submitted_at, time_taken_seconds, score, total_marks, percentage`)
      .single();

    if (newAttemptError || !newAttempt) {
      if (newAttemptError?.code === "23505") {
        const { data: concurrentAttempt } = await supabaseAdmin
          .from("test_attempts")
          .select(`id, attempt_token, status, started_at, expires_at, submitted_at, time_taken_seconds, score, total_marks, percentage`)
          .eq("test_id", test.id)
          .eq("learner_profile_id", learner.id)
          .maybeSingle();
        if (concurrentAttempt) {
          const attempt = concurrentAttempt as AttemptRow;
          return NextResponse.json({
            message: attempt.status === "in_progress" ? "Resuming the existing assessment attempt." : "This assessment was already completed.",
            mode: attempt.status === "in_progress" ? "resume" : "completed",
            attempt: toAttemptResponse(attempt),
          });
        }
      }
      console.error("Learner assessment start insert error:", newAttemptError);
      return NextResponse.json({ error: "Could not start this assessment." }, { status: 500 });
    }

    return NextResponse.json({
      message: "Assessment started successfully.",
      mode: "started",
      attempt: toAttemptResponse(newAttempt as AttemptRow),
    });
  } catch (error) {
    console.error("Unexpected learner assessment start error:", error);
    return NextResponse.json({ error: "Something went wrong while starting this assessment." }, { status: 500 });
  }
}
