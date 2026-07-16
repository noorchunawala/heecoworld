import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";
import { requireOwnedActiveLearner } from "@/lib/learnerAssessmentAccess";

type RouteContext = {
  params: Promise<{ testId: string }>;
};

async function getOptionalUserId(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return null;
  }

  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);

  return user?.id ?? null;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { testId } = await params;
    const learnerId =
      new URL(request.url).searchParams.get("learnerId")?.trim() ?? "";

    if (!testId) {
      return NextResponse.json(
        { error: "Practice test is required." },
        { status: 400 }
      );
    }

    const userId = await getOptionalUserId(request);

    let learner:
      | {
          id: string;
          full_name: string;
          grade: string | null;
          curriculum_id: string | null;
          curriculum_level_id: string | null;
        }
      | null = null;

    /*
     * Logged-in learner flow
     */
    if (userId && learnerId) {
      const learnerAccess = await requireOwnedActiveLearner(
        userId,
        learnerId
      );

      if (!learnerAccess.ok) {
        return learnerAccess.response;
      }

      learner = learnerAccess.learner;
    }

    let testQuery = supabaseAdmin
      .from("tests")
      .select(`
        id,
        title,
        class_level,
        subject,
        duration_minutes,
        total_questions,
        total_marks,
        instructions,
        curriculum_id,
        curriculum_level_id,
        access_mode,
        curricula ( id, display_name )
      `)
      .eq("id", testId)
      .eq("access_mode", "practice")
      .eq("status", "published");

    /*
     * Preserve the existing authenticated learner restrictions.
     */
    if (userId && learner) {
      testQuery = testQuery
        .eq("created_by_user_id", userId)
        .eq("curriculum_id", learner.curriculum_id)
        .eq("curriculum_level_id", learner.curriculum_level_id);
    }

    const { data: test, error: testError } =
      await testQuery.maybeSingle();

    if (testError) {
      console.error("Practice test lookup error:", testError);

      return NextResponse.json(
        { error: "Could not load practice test." },
        { status: 500 }
      );
    }

    if (!test) {
      return NextResponse.json(
        { error: "Practice test not found." },
        { status: 404 }
      );
    }

    const { data: questions, error: questionsError } =
      await supabaseAdmin
        .from("test_questions")
        .select("id, order_number, question_snapshot, marks")
        .eq("test_id", test.id)
        .order("order_number", { ascending: true });

    if (questionsError) {
      console.error("Practice questions lookup error:", questionsError);

      return NextResponse.json(
        { error: "Could not load practice questions." },
        { status: 500 }
      );
    }

    let attempt = null;

    /*
     * Logged-in learner attempt
     */
    if (learner) {
      const { data, error } = await supabaseAdmin
        .from("test_attempts")
        .select(`
          id,
          attempt_token,
          status,
          started_at,
          expires_at,
          submitted_at,
          time_taken_seconds,
          score,
          total_marks,
          percentage
        `)
        .eq("test_id", test.id)
        .eq("learner_profile_id", learner.id)
        .maybeSingle();

      if (error) {
        console.error("Learner practice attempt lookup error:", error);

        return NextResponse.json(
          { error: "Could not load the existing practice attempt." },
          { status: 500 }
        );
      }

      attempt = data;
    } else {
      /*
       * Guest practice attempt
       */
      const guestSessionId =
        request.cookies.get("scoolyx_guest_session")?.value ?? null;

      if (guestSessionId) {
        const { data, error } = await supabaseAdmin
          .from("test_attempts")
          .select(`
            id,
            attempt_token,
            status,
            started_at,
            expires_at,
            submitted_at,
            time_taken_seconds,
            score,
            total_marks,
            percentage
          `)
          .eq("test_id", test.id)
          .eq("attempt_source", "practice")
          .eq("guest_session_id", guestSessionId)
          .maybeSingle();

        if (error) {
          console.error("Guest practice attempt lookup error:", error);

          return NextResponse.json(
            { error: "Could not load the existing practice attempt." },
            { status: 500 }
          );
        }

        attempt = data;
      }
    }

    const curriculum = test.curricula as any;

    return NextResponse.json({
      availability: "available",

      test: {
        id: test.id,
        title: test.title,
        teacherName: "Practice Test",
        curriculumName: Array.isArray(curriculum)
          ? curriculum[0]?.display_name ?? null
          : curriculum?.display_name ?? null,
        classLevel: test.class_level,
        subject: test.subject,
        topic: null,
        durationMinutes: test.duration_minutes,
        totalQuestions: test.total_questions,
        totalMarks: test.total_marks,
        instructions: test.instructions,
      },

      learner: learner
        ? {
            id: learner.id,
            fullName: learner.full_name,
            grade: learner.grade,
          }
        : {
            id: "",
            fullName: "Learner",
            grade: test.class_level,
          },

      questions: (questions ?? []).map((item: any) => {
        const snapshot = item.question_snapshot ?? {};

        return {
          id: item.id,
          orderNumber: item.order_number,
          questionType: snapshot.question_type,
          difficulty: snapshot.difficulty,
          questionText: snapshot.question_text,
          options: snapshot.options ?? {},
          marks: item.marks ?? 1,
        };
      }),

      learnerAttempt: attempt
        ? {
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
            isCompleted:
              attempt.status === "submitted" ||
              attempt.status === "auto_submitted",
          }
        : null,
    });
  } catch (error) {
    console.error("Unexpected practice test load error:", error);

    return NextResponse.json(
      { error: "Something went wrong while loading practice test." },
      { status: 500 }
    );
  }
}