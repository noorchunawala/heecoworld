import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";
import { requireTeacherOwnedTest } from "@/lib/schoolAssessmentAccess";

type RouteContext = {
  params: Promise<{
    testId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { testId } = await params;

    const access = await requireTeacherOwnedTest(request, testId);

    if (!access.ok) {
      return access.response;
    }

    if (access.test.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft tests can be edited." },
        { status: 409 }
      );
    }

    const body = await request.json().catch(() => null);

    const questionText =
      typeof body?.questionText === "string" ? body.questionText.trim() : "";

    const optionA =
      typeof body?.optionA === "string" ? body.optionA.trim() : "";

    const optionB =
      typeof body?.optionB === "string" ? body.optionB.trim() : "";

    const optionC =
      typeof body?.optionC === "string" ? body.optionC.trim() : "";

    const optionD =
      typeof body?.optionD === "string" ? body.optionD.trim() : "";

    const correctOption =
      typeof body?.correctOption === "string" ? body.correctOption : "";

    const explanation =
      typeof body?.explanation === "string" ? body.explanation.trim() : "";

    const difficulty =
      typeof body?.difficulty === "string" ? body.difficulty : "medium";

    const marks = Number(body?.marks);

    if (
      !questionText ||
      !optionA ||
      !optionB ||
      !optionC ||
      !optionD ||
      !explanation
    ) {
      return NextResponse.json(
        {
          error:
            "Please complete the question, all four options, and explanation.",
        },
        { status: 400 }
      );
    }

    if (!["A", "B", "C", "D"].includes(correctOption)) {
      return NextResponse.json(
        { error: "Please select the correct option." },
        { status: 400 }
      );
    }

    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return NextResponse.json(
        { error: "Please select a valid difficulty level." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(marks) || marks <= 0 || marks > 100) {
      return NextResponse.json(
        { error: "Marks must be between 1 and 100." },
        { status: 400 }
      );
    }

    const { data: testSection, error: testSectionError } =
      await supabaseAdmin
        .from("test_sections")
        .select("curriculum_section_id")
        .eq("test_id", testId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (testSectionError || !testSection?.curriculum_section_id) {
      return NextResponse.json(
        { error: "Could not identify the syllabus topic for this draft." },
        { status: 422 }
      );
    }

    const { data: lastQuestion, error: lastQuestionError } =
      await supabaseAdmin
        .from("test_questions")
        .select("order_number")
        .eq("test_id", testId)
        .order("order_number", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (lastQuestionError) {
      return NextResponse.json(
        { error: "Could not determine the next question number." },
        { status: 500 }
      );
    }

    const nextOrderNumber = (lastQuestion?.order_number ?? 0) + 1;

    const questionSnapshot = {
      question_type: "mcq",
      difficulty,
      language: "en",
      question_text: questionText,
      options: {
        A: optionA,
        B: optionB,
        C: optionC,
        D: optionD,
      },
      correct_option: correctOption,
      correct_answer_text: null,
      explanation,
      inclusion_tags: [],
      is_teacher_custom: true,
    };

    const { data: createdQuestion, error: createQuestionError } =
      await supabaseAdmin
        .from("test_questions")
        .insert({
          test_id: testId,
          question_id: null,
          curriculum_section_id: testSection.curriculum_section_id,
          source_type: "teacher_custom",
          order_number: nextOrderNumber,
          question_snapshot: questionSnapshot,
          marks,
          negative_marks: 0,
        })
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
        .single();

    if (createQuestionError || !createdQuestion) {
      console.error(
        "Create school custom question error:",
        createQuestionError
      );

      return NextResponse.json(
        { error: "Could not add the custom question to this draft." },
        { status: 500 }
      );
    }

    const { data: allQuestions, error: totalsLookupError } =
      await supabaseAdmin
        .from("test_questions")
        .select("marks")
        .eq("test_id", testId);

    if (totalsLookupError || !allQuestions) {
      return NextResponse.json(
        {
          error:
            "Custom question was added, but the test totals could not be updated.",
        },
        { status: 500 }
      );
    }

    const totalQuestions = allQuestions.length;
    const totalMarks = allQuestions.reduce(
      (sum, item) => sum + Number(item.marks ?? 0),
      0
    );

    const { error: updateTestError } = await supabaseAdmin
      .from("tests")
      .update({
        total_questions: totalQuestions,
        total_marks: totalMarks,
      })
      .eq("id", testId)
      .eq("school_listing_id", access.schoolListingId)
      .eq("created_by_membership_id", access.membershipId);

    if (updateTestError) {
      console.error(
        "School custom-question totals update error:",
        updateTestError
      );

      return NextResponse.json(
        {
          error:
            "Custom question was added, but the test totals could not be updated.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Custom question added to draft.",
      testQuestion: createdQuestion,
      totalQuestions,
      totalMarks,
    });
  } catch (error) {
    console.error("Unexpected school custom question error:", error);

    return NextResponse.json(
      { error: "Something went wrong while adding the custom question." },
      { status: 500 }
    );
  }
}