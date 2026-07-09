import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";
import {
  requireAuthenticatedUser,
  requireOwnedActiveLearner,
} from "@/lib/learnerAssessmentAccess";

type RouteContext = { params: Promise<{ testId: string }> };

type QuestionSnapshot = {
  question_type?: string;
  difficulty?: string;
  question_text?: string;
  options?: { A?: string | null; B?: string | null; C?: string | null; D?: string | null };
};

type CurriculumRow = { id: string; code: string; display_name: string };

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

function getSingle<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function toLearnerQuestion(question: { id: string; order_number: number; question_snapshot: QuestionSnapshot | null; marks: number }) {
  const snapshot = question.question_snapshot ?? {};
  return {
    id: question.id,
    orderNumber: question.order_number,
    questionType: snapshot.question_type ?? "mcq",
    difficulty: snapshot.difficulty ?? null,
    questionText: snapshot.question_text ?? "",
    options: {
      A: snapshot.options?.A ?? null,
      B: snapshot.options?.B ?? null,
      C: snapshot.options?.C ?? null,
      D: snapshot.options?.D ?? null,
    },
    marks: question.marks,
  };
}

function toAttempt(attempt: AttemptRow) {
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
  };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { testId } = await params;
    const url = new URL(request.url);
    const learnerId = url.searchParams.get("learnerId")?.trim();
    const assessmentCode = url.searchParams.get("assessmentCode")?.trim().toUpperCase() ?? "";

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
      .select(`
        id, title, share_code, class_level, subject, duration_minutes,
        total_questions, total_marks, status, access_mode, start_at, end_at,
        instructions, created_by_membership_id,
        curricula ( id, code, display_name )
      `)
      .eq("id", testId)
      .eq("school_listing_id", learner.school_listing_id)
      .eq("curriculum_id", learner.curriculum_id)
      .eq("curriculum_level_id", learner.curriculum_level_id)
      .in("status", ["published", "closed"])
      .eq("access_mode", "private_class")
      .maybeSingle();

    if (testError) {
      console.error("Learner assessment test lookup error:", testError);
      return NextResponse.json({ error: "Could not load this assessment." }, { status: 500 });
    }
    if (!test) {
      return NextResponse.json({ error: "This assessment is not available for the selected learner." }, { status: 404 });
    }

    const [attemptResult, topicResult] = await Promise.all([
      supabaseAdmin
        .from("test_attempts")
        .select(`id, attempt_token, status, started_at, expires_at, submitted_at, time_taken_seconds, score, total_marks, percentage`)
        .eq("test_id", test.id)
        .eq("learner_profile_id", learner.id)
        .maybeSingle(),
      supabaseAdmin
        .from("test_sections")
        .select(`curriculum_sections ( section_code, topic_name_exact )`)
        .eq("test_id", test.id)
        .limit(1)
        .maybeSingle(),
    ]);

    if (attemptResult.error || topicResult.error) {
      console.error("Learner assessment detail supporting lookup error:", { attempt: attemptResult.error, topic: topicResult.error });
      return NextResponse.json({ error: "Could not load assessment progress." }, { status: 500 });
    }

    let teacherName = "Your teacher";
    if (test.created_by_membership_id) {
      const { data: membership } = await supabaseAdmin
        .from("school_memberships")
        .select("user_id, full_name")
        .eq("id", test.created_by_membership_id)
        .maybeSingle();
      if (membership?.user_id) {
        const { data: profile } = await supabaseAdmin
          .from("user_profiles")
          .select("full_name")
          .eq("id", membership.user_id)
          .maybeSingle();
        teacherName = profile?.full_name?.trim() || membership.full_name?.trim() || teacherName;
      } else if (membership?.full_name?.trim()) {
        teacherName = membership.full_name.trim();
      }
    }

    const curriculum = getSingle(test.curricula as CurriculumRow | CurriculumRow[] | null);
    const topicSection = getSingle(
      (topicResult.data as {
        curriculum_sections:
          | { section_code: string | null; topic_name_exact: string }
          | { section_code: string | null; topic_name_exact: string }[]
          | null;
      } | null)?.curriculum_sections ?? null
    );

    const summary = {
      id: test.id,
      title: test.title,
      teacherName,
      curriculumName: curriculum?.display_name ?? null,
      classLevel: test.class_level,
      subject: test.subject,
      topic: topicSection
        ? [topicSection.section_code, topicSection.topic_name_exact].filter(Boolean).join(" — ")
        : null,
      durationMinutes: test.duration_minutes,
      totalQuestions: test.total_questions,
      totalMarks: test.total_marks,
      instructions: test.instructions,
    };

    const attempt = attemptResult.data as AttemptRow | null;
    const hasExistingAttempt = Boolean(attempt);
    const isValidCode = Boolean(assessmentCode) && test.share_code === assessmentCode;
    const now = new Date();

    if (!hasExistingAttempt) {
      if (test.status !== "published" || (test.end_at && new Date(test.end_at) <= now)) {
        return NextResponse.json({ availability: "closed", test: summary });
      }
      if (test.start_at && new Date(test.start_at) > now) {
        return NextResponse.json({ availability: "not_started", test: { ...summary, startAt: test.start_at } });
      }
    }

    const canReadQuestions = isValidCode || attempt?.status === "in_progress";
    if (!canReadQuestions && !attempt) {
      return NextResponse.json({
        availability: "available",
        codeRequired: true,
        learner: { id: learner.id, fullName: learner.full_name, grade: learner.grade },
        test: summary,
        learnerAttempt: null,
        questions: [],
      });
    }

    let questions: unknown[] = [];
    if (canReadQuestions) {
      const { data, error } = await supabaseAdmin
        .from("test_questions")
        .select("id, order_number, question_snapshot, marks")
        .eq("test_id", test.id)
        .order("order_number", { ascending: true });
      if (error) {
        console.error("Learner assessment question lookup error:", error);
        return NextResponse.json({ error: "Could not load this assessment." }, { status: 500 });
      }
      questions = (data ?? []).map((question) =>
        toLearnerQuestion(question as { id: string; order_number: number; question_snapshot: QuestionSnapshot | null; marks: number })
      );
    }

    return NextResponse.json({
      availability: "available",
      codeRequired: !canReadQuestions && !attempt,
      learner: { id: learner.id, fullName: learner.full_name, grade: learner.grade },
      test: summary,
      learnerAttempt: attempt ? toAttempt(attempt) : null,
      questions,
    });
  } catch (error) {
    console.error("Unexpected learner assessment read error:", error);
    return NextResponse.json({ error: "Something went wrong while loading this assessment." }, { status: 500 });
  }
}
