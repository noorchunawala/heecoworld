import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";
import {
  requireAuthenticatedUser,
  requireOwnedLearnerAttempt,
} from "@/lib/learnerAssessmentAccess";

type RouteContext = {
  params: Promise<{
    attemptToken: string;
  }>;
};

type SubmittedAnswer = {
  testQuestionId: string;
  selectedOption: string;
};

type QuestionSnapshot = {
  question_type?: string;
  question_text?: string;
  options?: {
    A?: string | null;
    B?: string | null;
    C?: string | null;
    D?: string | null;
  };
  correct_option?: string | null;
  explanation?: string | null;
};

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { attemptToken } = await params;
    const body = await request.json();

    const submissionMode =
      body?.submissionMode === "auto" ? "auto" : "manual";

    const submittedAnswers: SubmittedAnswer[] = Array.isArray(body?.answers)
      ? body.answers.filter(
          (item: unknown): item is SubmittedAnswer =>
            Boolean(
              item &&
                typeof item === "object" &&
                typeof (item as SubmittedAnswer).testQuestionId === "string" &&
                ["A", "B", "C", "D"].includes(
                  (item as SubmittedAnswer).selectedOption
                )
            )
        )
      : [];

    const auth = await requireAuthenticatedUser(request);

    if (!auth.ok) {
      return auth.response;
    }

    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from("test_attempts")
      .select(`
        id,
        test_id,
        learner_profile_id,
        student_user_id,
        status,
        started_at,
        expires_at,
        submitted_at,
        score,
        total_marks,
        percentage,
        time_taken_seconds
      `)
      .eq("attempt_token", attemptToken)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json(
        { error: "This test attempt could not be found." },
        { status: 404 }
      );
    }

    const attemptAccess = await requireOwnedLearnerAttempt(
      auth.userId,
      attempt.learner_profile_id,
      attempt.student_user_id
    );

    if (!attemptAccess.ok) {
      return attemptAccess.response;
    }

    if (
      attempt.status === "submitted" ||
      attempt.status === "auto_submitted"
    ) {
      return NextResponse.json({
        message: "This test was already submitted.",
        alreadySubmitted: true,
        result: {
          status: attempt.status,
          submittedAt: attempt.submitted_at,
          score: attempt.score,
          totalMarks: attempt.total_marks,
          percentage: attempt.percentage,
          timeTakenSeconds: attempt.time_taken_seconds,
        },
      });
    }

    const { data: test, error: testError } = await supabaseAdmin
      .from("tests")
      .select(`
        id,
        title,
        show_result_immediately,
        show_explanations_immediately
      `)
      .eq("id", attempt.test_id)
      .single();

    if (testError || !test) {
      return NextResponse.json(
        { error: "Could not load the test for scoring." },
        { status: 500 }
      );
    }

    const { data: questions, error: questionsError } = await supabaseAdmin
      .from("test_questions")
      .select(`
        id,
        order_number,
        question_snapshot,
        marks,
        negative_marks
      `)
      .eq("test_id", attempt.test_id)
      .order("order_number", { ascending: true });

    if (questionsError || !questions) {
      console.error("Submit test questions error:", questionsError);

      return NextResponse.json(
        { error: "Could not score this test." },
        { status: 500 }
      );
    }

    const validQuestionIds = new Set(questions.map((question) => question.id));
    const answerMap = new Map<string, string>();

    submittedAnswers.forEach((answer) => {
      if (validQuestionIds.has(answer.testQuestionId)) {
        answerMap.set(answer.testQuestionId, answer.selectedOption);
      }
    });

    if (answerMap.size > 0) {
      const answerRows = Array.from(answerMap.entries()).map(
        ([testQuestionId, selectedOption]) => ({
          attempt_id: attempt.id,
          test_question_id: testQuestionId,
          selected_option: selectedOption,
          answered_at: new Date().toISOString(),
        })
      );

      const { error: upsertError } = await supabaseAdmin
        .from("attempt_answers")
        .upsert(answerRows, {
          onConflict: "attempt_id,test_question_id",
        });

      if (upsertError) {
        console.error("Final answer save error:", upsertError);

        return NextResponse.json(
          { error: "Could not save final answers before scoring." },
          { status: 500 }
        );
      }
    }

    const { data: savedAnswers, error: savedAnswersError } =
      await supabaseAdmin
        .from("attempt_answers")
        .select(`
          id,
          test_question_id,
          selected_option
        `)
        .eq("attempt_id", attempt.id);

    if (savedAnswersError) {
      console.error("Saved answer lookup error:", savedAnswersError);

      return NextResponse.json(
        { error: "Could not load answers for scoring." },
        { status: 500 }
      );
    }

    const savedAnswerMap = new Map(
      (savedAnswers ?? []).map((answer) => [
        answer.test_question_id,
        answer.selected_option,
      ])
    );

    const evaluatedQuestions = questions.map((question) => {
      const snapshot = question.question_snapshot as QuestionSnapshot;
      const selectedOption = savedAnswerMap.get(question.id) ?? null;
      const correctOption = snapshot.correct_option ?? null;
      const isCorrect =
        snapshot.question_type === "mcq" &&
        Boolean(selectedOption) &&
        selectedOption === correctOption;
      const marks = Number(question.marks ?? 0);
      const negativeMarks = Number(question.negative_marks ?? 0);
      const marksAwarded = isCorrect
        ? marks
        : selectedOption
          ? -negativeMarks
          : 0;

      return {
        testQuestionId: question.id,
        orderNumber: question.order_number,
        questionText: snapshot.question_text ?? "",
        options: snapshot.options ?? {},
        selectedOption,
        correctOption,
        explanation: snapshot.explanation ?? null,
        isCorrect,
        marks,
        marksAwarded,
      };
    });

    const evaluationRows = evaluatedQuestions
      .filter((question) => question.selectedOption)
      .map((question) => ({
        attempt_id: attempt.id,
        test_question_id: question.testQuestionId,
        selected_option: question.selectedOption,
        is_correct: question.isCorrect,
        marks_awarded: question.marksAwarded,
        answered_at: new Date().toISOString(),
      }));

    if (evaluationRows.length > 0) {
      const { error: evaluationSaveError } = await supabaseAdmin
        .from("attempt_answers")
        .upsert(evaluationRows, {
          onConflict: "attempt_id,test_question_id",
        });

      if (evaluationSaveError) {
        console.error("Answer evaluation save error:", evaluationSaveError);

        return NextResponse.json(
          { error: "Could not save the scored answers." },
          { status: 500 }
        );
      }
    }

    const totalMarks = evaluatedQuestions.reduce(
      (sum, question) => sum + question.marks,
      0
    );
    const rawScore = evaluatedQuestions.reduce(
      (sum, question) => sum + question.marksAwarded,
      0
    );
    const score = Math.max(0, rawScore);
    const percentage =
      totalMarks > 0
        ? Number(((score / totalMarks) * 100).toFixed(2))
        : 0;

    const now = new Date();
    const expiresAt = new Date(attempt.expires_at);
    const finalStatus =
      submissionMode === "auto" || now >= expiresAt
        ? "auto_submitted"
        : "submitted";
    const startedAtMilliseconds = new Date(attempt.started_at).getTime();
    const endedAtMilliseconds = Math.min(now.getTime(), expiresAt.getTime());
    const timeTakenSeconds = Math.max(
      0,
      Math.floor((endedAtMilliseconds - startedAtMilliseconds) / 1000)
    );

    const { error: updateAttemptError } = await supabaseAdmin
      .from("test_attempts")
      .update({
        status: finalStatus,
        submitted_at: now.toISOString(),
        time_taken_seconds: timeTakenSeconds,
        score,
        total_marks: totalMarks,
        percentage,
      })
      .eq("id", attempt.id)
      .eq("status", "in_progress");

    if (updateAttemptError) {
      console.error("Final attempt update error:", updateAttemptError);

      return NextResponse.json(
        { error: "Test was scored, but the final result could not be saved." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message:
        finalStatus === "auto_submitted"
          ? "Time ended. Your test was submitted automatically."
          : "Test submitted successfully.",
      result: {
        status: finalStatus,
        score,
        totalMarks,
        percentage,
        timeTakenSeconds,
      },
      visibility: {
        showResultImmediately: test.show_result_immediately,
        showExplanationsImmediately: test.show_explanations_immediately,
      },
      questions: test.show_result_immediately
        ? evaluatedQuestions.map((question) => ({
            testQuestionId: question.testQuestionId,
            orderNumber: question.orderNumber,
            questionText: question.questionText,
            options: question.options,
            selectedOption: question.selectedOption,
            isCorrect: question.isCorrect,
            marks: question.marks,
            marksAwarded: question.marksAwarded,
            correctOption: test.show_explanations_immediately
              ? question.correctOption
              : null,
            explanation: test.show_explanations_immediately
              ? question.explanation
              : null,
          }))
        : [],
    });
  } catch (error) {
    console.error("Unexpected test submit error:", error);

    return NextResponse.json(
      { error: "Something went wrong while submitting the test." },
      { status: 500 }
    );
  }
}
