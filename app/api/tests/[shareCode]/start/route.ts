import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

type RouteContext = {
  params: Promise<{
    shareCode: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { shareCode } = await params;
    const body = await request.json();

    const studentName =
      typeof body.studentName === "string" ? body.studentName.trim() : "";

    const classOrGrade =
      typeof body.classOrGrade === "string"
        ? body.classOrGrade.trim()
        : null;

    if (!studentName) {
      return NextResponse.json(
        { error: "Please enter the student's name." },
        { status: 400 }
      );
    }

    const { data: test, error: testError } = await supabaseAdmin
      .from("tests")
      .select(`
        id,
        title,
        duration_minutes,
        status,
        access_mode,
        start_at,
        end_at
      `)
      .eq("share_code", shareCode)
      .eq("status", "published")
      .eq("access_mode", "public_link")
      .single();

    if (testError || !test) {
      return NextResponse.json(
        { error: "This test is unavailable or the link is invalid." },
        { status: 404 }
      );
    }

    const now = new Date();

    if (test.start_at && new Date(test.start_at) > now) {
      return NextResponse.json(
        { error: "This test has not started yet." },
        { status: 409 }
      );
    }

    if (test.end_at && new Date(test.end_at) <= now) {
      return NextResponse.json(
        { error: "This test is closed." },
        { status: 410 }
      );
    }

    const { count, error: countError } = await supabaseAdmin
      .from("test_attempts")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("test_id", test.id)
      .eq("student_name", studentName);

    if (countError) {
      console.error("Attempt count error:", countError);

      return NextResponse.json(
        { error: "Could not create the test attempt." },
        { status: 500 }
      );
    }

    const startedAt = new Date();
    const expiresAt = new Date(
      startedAt.getTime() + test.duration_minutes * 60 * 1000
    );

    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from("test_attempts")
      .insert({
        test_id: test.id,
        student_name: studentName,
        class_or_grade: classOrGrade,
        attempt_number: (count ?? 0) + 1,
        status: "in_progress",
        started_at: startedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select(`
        id,
        attempt_token,
        student_name,
        class_or_grade,
        attempt_number,
        status,
        started_at,
        expires_at
      `)
      .single();

    if (attemptError || !attempt) {
      console.error("Start test attempt error:", attemptError);

      return NextResponse.json(
        { error: "Could not start this test." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Test started successfully.",
      attempt: {
        id: attempt.id,
        token: attempt.attempt_token,
        studentName: attempt.student_name,
        classOrGrade: attempt.class_or_grade,
        attemptNumber: attempt.attempt_number,
        status: attempt.status,
        startedAt: attempt.started_at,
        expiresAt: attempt.expires_at,
      },
    });
  } catch (error) {
    console.error("Unexpected start test attempt error:", error);

    return NextResponse.json(
      { error: "Something went wrong while starting the test." },
      { status: 500 }
    );
  }
}