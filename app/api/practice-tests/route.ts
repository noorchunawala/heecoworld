import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";
import {
  requireAuthenticatedUser,
  requireOwnedActiveLearner,
} from "@/lib/learnerAssessmentAccess";

export async function GET(request: NextRequest) {
  try {
    const learnerId = new URL(request.url).searchParams.get("learnerId")?.trim();

    if (!learnerId) {
      return NextResponse.json(
        { error: "Learner is required." },
        { status: 400 }
      );
    }

    const auth = await requireAuthenticatedUser(request);
    if (!auth.ok) return auth.response;

    const learnerAccess = await requireOwnedActiveLearner(auth.userId, learnerId);
    if (!learnerAccess.ok) return learnerAccess.response;

    const learner = learnerAccess.learner;

    const { data: tests, error } = await supabaseAdmin
      .from("tests")
      .select(`
        id,
        title,
        class_level,
        subject,
        duration_minutes,
        total_questions,
        total_marks,
        created_at,
        curricula ( id, display_name ),
        test_attempts (
          id,
          status,
          score,
          total_marks,
          percentage,
          submitted_at,
          learner_profile_id
        )
      `)
      .eq("created_by_user_id", auth.userId)
      .eq("access_mode", "practice")
      .eq("status", "published")
      .eq("curriculum_id", learner.curriculum_id)
      .eq("curriculum_level_id", learner.curriculum_level_id)
      .order("created_at", { ascending: false });
if (error) {
  console.error("Practice tests list error:", error);

  return NextResponse.json(
    {
      error: "Could not load practice tests.",
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    },
    { status: 500 }
  );
}

    const assessments = (tests || []).map((test: any) => {
      const curriculum = test.curricula as any;

      const attempt =
        (test.test_attempts || []).find(
          (item: any) => item.learner_profile_id === learner.id
        ) || null;

      return {
        id: test.id,
        title: test.title,
        teacherName: "Practice Test",
        curriculumName: Array.isArray(curriculum)
          ? curriculum[0]?.display_name ?? null
          : curriculum?.display_name ?? null,
        classLevel: test.class_level,
        subject: test.subject,
        topic:null,
        durationMinutes: test.duration_minutes,
        totalQuestions: test.total_questions,
        totalMarks: test.total_marks,
        publishedAt: test.created_at,
        availability: "available",
        startedCount: attempt ? 1 : 0,
        completedCount:
          attempt?.status === "submitted" || attempt?.status === "auto_submitted"
            ? 1
            : 0,
        learnerAttempt: attempt
          ? {
              status: attempt.status,
              score: attempt.score,
              totalMarks: attempt.total_marks,
              percentage: attempt.percentage,
              submittedAt: attempt.submitted_at,
              isCompleted:
                attempt.status === "submitted" ||
                attempt.status === "auto_submitted",
            }
          : null,
      };
    });

    return NextResponse.json({
      learner: {
        id: learner.id,
        fullName: learner.full_name,
      },
      assessments,
    });
  } catch (error) {
    console.error("Unexpected practice tests list error:", error);
    return NextResponse.json(
      { error: "Something went wrong while loading practice tests." },
      { status: 500 }
    );
  }
}