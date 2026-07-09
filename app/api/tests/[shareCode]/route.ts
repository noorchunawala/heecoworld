import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

type RouteContext = {
  params: Promise<{
    shareCode: string;
  }>;
};

type QuestionSnapshot = {
  question_type?: string;
  difficulty?: string;
  language?: string;
  question_text?: string;
  options?: {
    A?: string | null;
    B?: string | null;
    C?: string | null;
    D?: string | null;
  };
};

function toPublicQuestion(question: {
  id: string;
  order_number: number;
  question_snapshot: QuestionSnapshot;
  marks: number;
}) {
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

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { shareCode } = await params;

    if (!shareCode) {
      return NextResponse.json(
        { error: "Test link is incomplete." },
        { status: 400 }
      );
    }

    const { data: test, error: testError } = await supabaseAdmin
      .from("tests")
      .select(`
        id,
        title,
        class_level,
        subject,
        duration_minutes,
        total_questions,
        total_marks,
        status,
        access_mode,
        share_code,
        start_at,
        end_at,
        instructions,
        show_result_immediately,
        show_explanations_immediately,
        curricula (
          id,
          code,
          display_name
        )
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
      return NextResponse.json({
        availability: "not_started",
        test: {
          title: test.title,
          startAt: test.start_at,
        },
      });
    }

    if (test.end_at && new Date(test.end_at) <= now) {
      return NextResponse.json({
        availability: "closed",
        test: {
          title: test.title,
          endAt: test.end_at,
        },
      });
    }

    const { data: questions, error: questionsError } = await supabaseAdmin
      .from("test_questions")
      .select(`
        id,
        order_number,
        question_snapshot,
        marks
      `)
      .eq("test_id", test.id)
      .order("order_number", { ascending: true });

    if (questionsError) {
      console.error("Public test question load error:", questionsError);

      return NextResponse.json(
        { error: "Could not load this test." },
        { status: 500 }
      );
    }

    const curriculum = Array.isArray(test.curricula)
      ? test.curricula[0] ?? null
      : test.curricula;

    return NextResponse.json({
      availability: "available",
      test: {
        id: test.id,
        title: test.title,
        curriculumName: curriculum?.display_name ?? null,
        classLevel: test.class_level,
        subject: test.subject,
        durationMinutes: test.duration_minutes,
        totalQuestions: test.total_questions,
        totalMarks: test.total_marks,
        instructions: test.instructions,
      },
      questions: (questions ?? []).map(toPublicQuestion),
    });
  } catch (error) {
    console.error("Unexpected public test read error:", error);

    return NextResponse.json(
      { error: "Something went wrong while loading this test." },
      { status: 500 }
    );
  }
}