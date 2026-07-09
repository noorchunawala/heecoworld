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
        { error: "Test ID is required." },
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
        instructions,
        difficulty_mix,
        show_result_immediately,
        show_explanations_immediately,
        created_at,
        curricula (
          id,
          code,
          display_name
        )
      `)
      .eq("id", testId)
      .eq("created_by_user_id", user.id)
      .single();

    if (testError || !test) {
      return NextResponse.json(
        { error: "Draft test not found or you do not have access to it." },
        { status: 404 }
      );
    }

    const { data: testSections, error: sectionsError } = await supabaseAdmin
      .from("test_sections")
      .select(`
        id,
        curriculum_section_id,
        curriculum_sections (
          id,
          section_code,
          topic_name_exact
        )
      `)
      .eq("test_id", testId);

    if (sectionsError) {
      console.error("Assessment test sections error:", sectionsError);

      return NextResponse.json(
        { error: "Could not load the selected syllabus topic." },
        { status: 500 }
      );
    }

    const { data: questions, error: questionsError } = await supabaseAdmin
      .from("test_questions")
      .select(`
        id,
        question_id,
        curriculum_section_id,
        source_type,
        order_number,
        question_snapshot,
        marks,
        negative_marks
      `)
      .eq("test_id", testId)
      .order("order_number", { ascending: true });

    if (questionsError) {
      console.error("Assessment draft questions error:", questionsError);

      return NextResponse.json(
        { error: "Could not load the draft test questions." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      test,
      sections: testSections ?? [],
      questions: questions ?? [],
    });
  } catch (error) {
    console.error("Unexpected assessment draft read error:", error);

    return NextResponse.json(
      { error: "Something went wrong while loading the draft test." },
      { status: 500 }
    );
  }
}
export async function PATCH(
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

    const { data: test, error: testError } = await supabaseAdmin
      .from("tests")
      .select(`
        id,
        title,
        status,
        share_code,
        total_questions,
        total_marks,
        duration_minutes
      `)
      .eq("id", testId)
      .eq("created_by_user_id", user.id)
      .single();

    if (testError || !test) {
      return NextResponse.json(
        { error: "Draft test not found or you do not have access to it." },
        { status: 404 }
      );
    }

    if (test.status === "published") {
      return NextResponse.json({
        message: "This test is already published.",
        test,
      });
    }

    if (test.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft tests can be published." },
        { status: 409 }
      );
    }

    const { data: questions, error: questionsError } = await supabaseAdmin
      .from("test_questions")
      .select(`
        id,
        order_number,
        question_snapshot,
        marks
      `)
      .eq("test_id", testId)
      .order("order_number", { ascending: true });

    if (questionsError) {
      console.error("Publish test question lookup error:", questionsError);

      return NextResponse.json(
        { error: "Could not validate the draft questions." },
        { status: 500 }
      );
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: "Add at least one question before publishing this test." },
        { status: 422 }
      );
    }

    const hasInvalidQuestion = questions.some((question, index) => {
      const snapshot = question.question_snapshot as {
        question_text?: string;
        question_type?: string;
        options?: {
          A?: string | null;
          B?: string | null;
          C?: string | null;
          D?: string | null;
        };
        correct_option?: string | null;
        explanation?: string | null;
      };

      const expectedOrder = index + 1;

      if (question.order_number !== expectedOrder) {
        return true;
      }

      if (!snapshot?.question_text?.trim() || !snapshot?.explanation?.trim()) {
        return true;
      }

      if (snapshot.question_type === "mcq") {
        return !(
          snapshot.options?.A?.trim() &&
          snapshot.options?.B?.trim() &&
          snapshot.options?.C?.trim() &&
          snapshot.options?.D?.trim() &&
          ["A", "B", "C", "D"].includes(
            snapshot.correct_option ?? ""
          )
        );
      }

      return false;
    });

    if (hasInvalidQuestion) {
      return NextResponse.json(
        {
          error:
            "This draft has an incomplete question or an invalid question order. Please review it before publishing.",
        },
        { status: 422 }
      );
    }

    const totalQuestions = questions.length;
    const totalMarks = questions.reduce(
      (sum, question) => sum + Number(question.marks ?? 0),
      0
    );

    const { data: publishedTest, error: publishError } = await supabaseAdmin
      .from("tests")
      .update({
        status: "published",
        total_questions: totalQuestions,
        total_marks: totalMarks,
        start_at: new Date().toISOString(),
      })
      .eq("id", testId)
      .select(`
        id,
        title,
        status,
        share_code,
        total_questions,
        total_marks,
        duration_minutes
      `)
      .single();

    if (publishError || !publishedTest) {
      console.error("Publish test error:", publishError);

      return NextResponse.json(
        { error: "Could not publish this test." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Test published successfully.",
      test: publishedTest,
    });
  } catch (error) {
    console.error("Unexpected publish test error:", error);

    return NextResponse.json(
      { error: "Something went wrong while publishing the test." },
      { status: 500 }
    );
  }
}