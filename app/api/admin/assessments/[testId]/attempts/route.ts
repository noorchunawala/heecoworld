import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

type RouteContext = {
  params: Promise<{
    testId: string;
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

    const { testId } = await params;

    if (!testId) {
      return NextResponse.json(
        { error: "Test ID is missing." },
        { status: 400 }
      );
    }

    const { data: test, error: testError } = await supabaseAdmin
      .from("tests")
      .select(`
        id,
        title,
        status,
        total_questions,
        total_marks,
        duration_minutes,
        created_at
      `)
      .eq("id", testId)
      .eq("created_by_user_id", user.id)
      .single();

    if (testError || !test) {
      return NextResponse.json(
        { error: "Test not found or you do not have access to it." },
        { status: 404 }
      );
    }

    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from("test_attempts")
      .select(`
        id,
        student_name,
        class_or_grade,
        attempt_number,
        status,
        started_at,
        expires_at,
        submitted_at,
        time_taken_seconds,
        score,
        total_marks,
        percentage
      `)
      .eq("test_id", testId)
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .order("started_at", { ascending: false });

    if (attemptsError) {
      console.error("Teacher attempt list error:", attemptsError);

      return NextResponse.json(
        { error: "Could not load student attempts for this test." },
        { status: 500 }
      );
    }

    const submittedAttempts = (attempts ?? []).filter(
      (attempt) =>
        attempt.status === "submitted" || attempt.status === "auto_submitted"
    );

    const totalSubmitted = submittedAttempts.length;

    const averagePercentage =
      totalSubmitted > 0
        ? Math.round(
            submittedAttempts.reduce(
              (sum, attempt) => sum + Number(attempt.percentage ?? 0),
              0
            ) / totalSubmitted
          )
        : 0;

    const highestPercentage =
      totalSubmitted > 0
        ? Math.max(
            ...submittedAttempts.map((attempt) =>
              Number(attempt.percentage ?? 0)
            )
          )
        : 0;

    return NextResponse.json({
      test: {
        id: test.id,
        title: test.title,
        status: test.status,
        totalQuestions: test.total_questions,
        totalMarks: test.total_marks,
        durationMinutes: test.duration_minutes,
        createdAt: test.created_at,
      },
      summary: {
        totalAttempts: (attempts ?? []).length,
        submittedAttempts: totalSubmitted,
        inProgressAttempts: (attempts ?? []).filter(
          (attempt) => attempt.status === "in_progress"
        ).length,
        averagePercentage,
        highestPercentage,
      },
      attempts: (attempts ?? []).map((attempt) => ({
        id: attempt.id,
        studentName: attempt.student_name,
        classOrGrade: attempt.class_or_grade,
        attemptNumber: attempt.attempt_number,
        status: attempt.status,
        startedAt: attempt.started_at,
        expiresAt: attempt.expires_at,
        submittedAt: attempt.submitted_at,
        timeTakenSeconds: attempt.time_taken_seconds,
        score: attempt.score,
        totalMarks: attempt.total_marks,
        percentage: attempt.percentage,
      })),
    });
  } catch (error) {
    console.error("Unexpected teacher attempt list error:", error);

    return NextResponse.json(
      { error: "Something went wrong while loading test attempts." },
      { status: 500 }
    );
  }
}