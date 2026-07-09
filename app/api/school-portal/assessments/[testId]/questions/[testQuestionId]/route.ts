import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";
import { requireTeacherOwnedTest } from "@/lib/schoolAssessmentAccess";

type RouteContext = {
  params: Promise<{
    testId: string;
    testQuestionId: string;
  }>;
};

function buildQuestionSnapshot(question: {
  id: string;
  question_type: string;
  difficulty: string;
  question_text: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_option: string | null;
  correct_answer_text: string | null;
  explanation: string;
  inclusion_tags: unknown;
}) {
  return {
    question_bank_id: question.id,
    question_type: question.question_type,
    difficulty: question.difficulty,
    language: "en",
    question_text: question.question_text,
    options: {
      A: question.option_a,
      B: question.option_b,
      C: question.option_c,
      D: question.option_d,
    },
    correct_option: question.correct_option,
    correct_answer_text: question.correct_answer_text,
    explanation: question.explanation,
    inclusion_tags: question.inclusion_tags,
  };
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { testId, testQuestionId } = await params;

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

    const { data: question, error: questionError } = await supabaseAdmin
      .from("test_questions")
      .select("id, order_number")
      .eq("id", testQuestionId)
      .eq("test_id", testId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: "Question not found in this draft test." },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from("test_questions")
      .delete()
      .eq("id", testQuestionId)
      .eq("test_id", testId);

    if (deleteError) {
      console.error("Delete school draft question error:", deleteError);

      return NextResponse.json(
        { error: "Could not remove this question." },
        { status: 500 }
      );
    }

    const { data: remainingQuestions, error: remainingError } =
      await supabaseAdmin
        .from("test_questions")
        .select("id, marks, order_number")
        .eq("test_id", testId)
        .order("order_number", { ascending: true });

    if (remainingError || !remainingQuestions) {
      console.error("School remaining question lookup error:", remainingError);

      return NextResponse.json(
        {
          error:
            "Question was removed, but the remaining questions could not be loaded.",
        },
        { status: 500 }
      );
    }

    for (let index = 0; index < remainingQuestions.length; index += 1) {
      const item = remainingQuestions[index];
      const newOrderNumber = index + 1;

      if (item.order_number === newOrderNumber) {
        continue;
      }

      const { error: reorderError } = await supabaseAdmin
        .from("test_questions")
        .update({ order_number: newOrderNumber })
        .eq("id", item.id)
        .eq("test_id", testId);

      if (reorderError) {
        console.error("School draft question renumber error:", reorderError);

        return NextResponse.json(
          {
            error:
              "Question was removed, but the remaining question order could not be updated.",
          },
          { status: 500 }
        );
      }
    }

    const totalQuestions = remainingQuestions.length;
    const totalMarks = remainingQuestions.reduce(
      (sum, item) => sum + Number(item.marks ?? 0),
      0
    );

    const { error: totalsError } = await supabaseAdmin
      .from("tests")
      .update({
        total_questions: totalQuestions,
        total_marks: totalMarks,
      })
      .eq("id", testId)
      .eq("school_listing_id", access.schoolListingId)
      .eq("created_by_membership_id", access.membershipId);

    if (totalsError) {
      console.error("School draft totals update error:", totalsError);

      return NextResponse.json(
        {
          error:
            "Question was removed, but the test totals could not be updated.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Question removed from draft.",
      totalQuestions,
      totalMarks,
    });
  } catch (error) {
    console.error("Unexpected school delete draft question error:", error);

    return NextResponse.json(
      { error: "Something went wrong while removing the question." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { testId, testQuestionId } = await params;

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

    if (body?.action === "reorder") {
      const direction =
        body.direction === "up" || body.direction === "down"
          ? body.direction
          : null;

      if (!direction) {
        return NextResponse.json(
          { error: "A valid reorder direction is required." },
          { status: 400 }
        );
      }

      const { data: orderedQuestions, error: orderedQuestionsError } =
        await supabaseAdmin
          .from("test_questions")
          .select("id, order_number")
          .eq("test_id", testId)
          .order("order_number", { ascending: true });

      if (orderedQuestionsError || !orderedQuestions) {
        console.error(
          "School draft reorder question lookup error:",
          orderedQuestionsError
        );

        return NextResponse.json(
          { error: "Could not load the current question order." },
          { status: 500 }
        );
      }

      const currentIndex = orderedQuestions.findIndex(
        (item) => item.id === testQuestionId
      );

      if (currentIndex === -1) {
        return NextResponse.json(
          { error: "Question not found in this draft test." },
          { status: 404 }
        );
      }

      const targetIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= orderedQuestions.length) {
        return NextResponse.json(
          {
            error:
              direction === "up"
                ? "This question is already first."
                : "This question is already last.",
          },
          { status: 422 }
        );
      }

      const currentQuestion = orderedQuestions[currentIndex];
      const targetQuestion = orderedQuestions[targetIndex];

      const currentOrder = Number(currentQuestion.order_number);
      const targetOrder = Number(targetQuestion.order_number);

      const highestOrder = orderedQuestions.reduce(
        (highest, item) => Math.max(highest, Number(item.order_number) || 0),
        0
      );

      const temporaryOrder = highestOrder + 10000;

      const { error: temporaryMoveError } = await supabaseAdmin
        .from("test_questions")
        .update({ order_number: temporaryOrder })
        .eq("id", currentQuestion.id)
        .eq("test_id", testId);

      if (temporaryMoveError) {
        return NextResponse.json(
          { error: "Could not prepare this question for reordering." },
          { status: 500 }
        );
      }

      const { error: targetMoveError } = await supabaseAdmin
        .from("test_questions")
        .update({ order_number: currentOrder })
        .eq("id", targetQuestion.id)
        .eq("test_id", testId);

      if (targetMoveError) {
        await supabaseAdmin
          .from("test_questions")
          .update({ order_number: currentOrder })
          .eq("id", currentQuestion.id)
          .eq("test_id", testId);

        return NextResponse.json(
          { error: "Could not reorder this question." },
          { status: 500 }
        );
      }

      const { error: finalMoveError } = await supabaseAdmin
        .from("test_questions")
        .update({ order_number: targetOrder })
        .eq("id", currentQuestion.id)
        .eq("test_id", testId);

      if (finalMoveError) {
        await supabaseAdmin
          .from("test_questions")
          .update({ order_number: targetOrder })
          .eq("id", targetQuestion.id)
          .eq("test_id", testId);

        await supabaseAdmin
          .from("test_questions")
          .update({ order_number: currentOrder })
          .eq("id", currentQuestion.id)
          .eq("test_id", testId);

        return NextResponse.json(
          { error: "Could not finish reordering this question." },
          { status: 500 }
        );
      }

      const updatedQuestionOrder = orderedQuestions
        .map((item) => {
          if (item.id === currentQuestion.id) {
            return {
              ...item,
              order_number: targetOrder,
            };
          }

          if (item.id === targetQuestion.id) {
            return {
              ...item,
              order_number: currentOrder,
            };
          }

          return item;
        })
        .sort((a, b) => a.order_number - b.order_number);

      return NextResponse.json({
        message: "Question order updated.",
        questions: updatedQuestionOrder,
      });
    }

    const replacementQuestionId =
      typeof body?.replacementQuestionId === "string"
        ? body.replacementQuestionId
        : "";

    if (!replacementQuestionId) {
      return NextResponse.json(
        { error: "A replacement question is required." },
        { status: 400 }
      );
    }

    const { data: currentQuestion, error: currentQuestionError } =
      await supabaseAdmin
        .from("test_questions")
        .select(`
          id,
          curriculum_section_id,
          question_snapshot
        `)
        .eq("id", testQuestionId)
        .eq("test_id", testId)
        .single();

    if (currentQuestionError || !currentQuestion) {
      return NextResponse.json(
        { error: "Question not found in this draft test." },
        { status: 404 }
      );
    }

    const currentSnapshot = currentQuestion.question_snapshot as {
      difficulty?: string;
    };

    const currentDifficulty = currentSnapshot?.difficulty;

    if (
      !currentQuestion.curriculum_section_id ||
      !currentDifficulty ||
      !["easy", "medium", "hard"].includes(currentDifficulty)
    ) {
      return NextResponse.json(
        { error: "This question cannot be swapped safely." },
        { status: 422 }
      );
    }

    const { data: alreadyUsed, error: alreadyUsedError } =
      await supabaseAdmin
        .from("test_questions")
        .select("id")
        .eq("test_id", testId)
        .eq("question_id", replacementQuestionId)
        .limit(1);

    if (alreadyUsedError) {
      return NextResponse.json(
        { error: "Could not validate the replacement question." },
        { status: 500 }
      );
    }

    if ((alreadyUsed ?? []).length > 0) {
      return NextResponse.json(
        { error: "That question is already used in this draft." },
        { status: 409 }
      );
    }

    const { data: replacement, error: replacementError } =
      await supabaseAdmin
        .from("question_bank")
        .select(`
          id,
          curriculum_section_id,
          question_type,
          difficulty,
          question_text,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_option,
          correct_answer_text,
          explanation,
          inclusion_tags,
          publication_status,
          validation_status,
          visibility_scope,
          is_active
        `)
        .eq("id", replacementQuestionId)
        .single();

    if (replacementError || !replacement) {
      return NextResponse.json(
        { error: "Replacement question was not found." },
        { status: 404 }
      );
    }

    const isValidReplacement =
      replacement.curriculum_section_id ===
        currentQuestion.curriculum_section_id &&
      replacement.difficulty === currentDifficulty &&
      replacement.publication_status === "published" &&
      replacement.validation_status === "passed" &&
      replacement.visibility_scope === "global" &&
      replacement.is_active;

    if (!isValidReplacement) {
      return NextResponse.json(
        {
          error:
            "Replacement question does not match the syllabus topic or difficulty requirements.",
        },
        { status: 422 }
      );
    }

    const { data: updatedQuestion, error: updateError } =
      await supabaseAdmin
        .from("test_questions")
        .update({
          question_id: replacement.id,
          source_type: "question_bank",
          question_snapshot: buildQuestionSnapshot(replacement),
        })
        .eq("id", testQuestionId)
        .eq("test_id", testId)
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

    if (updateError || !updatedQuestion) {
      console.error("School swap draft question error:", updateError);

      return NextResponse.json(
        { error: "Could not swap this question." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Question swapped successfully.",
      testQuestion: updatedQuestion,
    });
  } catch (error) {
    console.error("Unexpected school draft question update error:", error);

    return NextResponse.json(
      { error: "Something went wrong while updating this draft question." },
      { status: 500 }
    );
  }
}