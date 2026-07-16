import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";
import { requireAttemptAccess } from "@/lib/learnerAssessmentAccess";

type RouteContext = {
  params: Promise<{
    attemptToken: string;
  }>;
};

type QuestionSnapshot = {
  question_text?: string;
  questionText?: string;
  question_type?: string;
  questionType?: string;
  option_a?: string | null;
  option_b?: string | null;
  option_c?: string | null;
  option_d?: string | null;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  options?: {
    A?: string | null;
    B?: string | null;
    C?: string | null;
    D?: string | null;
  };
  correct_option?: string | null;
  correctOption?: string | null;
  explanation?: string | null;
};

function getSnapshotText(
  snapshot: QuestionSnapshot,
  snakeCaseKey: keyof QuestionSnapshot,
  camelCaseKey?: keyof QuestionSnapshot
) {
  return (
    snapshot[snakeCaseKey] ??
    (camelCaseKey ? snapshot[camelCaseKey] : null) ??
    null
  );
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { attemptToken } = await params;

    if (!attemptToken) {
      return NextResponse.json(
        { error: "Attempt token is missing." },
        { status: 400 }
      );
    }


    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from("test_attempts")
      .select(`
        id,
        test_id,
        learner_profile_id,
        student_user_id,
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
        percentage,
        attempt_source,
guest_session_id
      `)
      .eq("attempt_token", attemptToken)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json(
        { error: "This test attempt could not be found." },
        { status: 404 }
      );
    }

   let userId: string | null = null;

const authorization = request.headers.get("authorization");

if (authorization?.startsWith("Bearer ")) {
  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  if (token) {
    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser(token);

    userId = user?.id ?? null;
  }
}

const requestGuestSessionId =
  request.cookies.get("scoolyx_guest_session")?.value ?? null;

const attemptAccess = await requireAttemptAccess({
  userId,
  learnerProfileId: attempt.learner_profile_id,
  studentUserId: attempt.student_user_id,
  attemptSource:
    attempt.attempt_source === "practice" ? "practice" : "school",
  guestSessionId: attempt.guest_session_id,
  requestGuestSessionId,
});

if (!attemptAccess.ok) {
  return attemptAccess.response;
}

    const { data: answers, error: answersError } = await supabaseAdmin
      .from("attempt_answers")
      .select(`
        test_question_id,
        selected_option,
        answer_text,
        is_correct,
        marks_awarded,
        answered_at
      `)
      .eq("attempt_id", attempt.id);

    if (answersError) {
      console.error("Attempt answer lookup error:", answersError);

      return NextResponse.json(
        { error: "Could not load saved answers for this test attempt." },
        { status: 500 }
      );
    }

    const isSubmitted =
      attempt.status === "submitted" || attempt.status === "auto_submitted";

    const isExpired =
      attempt.status === "in_progress" &&
      new Date(attempt.expires_at).getTime() <= Date.now();

    const safeAnswers = (answers ?? []).map((answer) => ({
      test_question_id: answer.test_question_id,
      selected_option: answer.selected_option,
      answer_text: answer.answer_text,
      answered_at: answer.answered_at,
    }));

    const baseResponse = {
      attempt: {
        id: attempt.id,
        testId: attempt.test_id,
        learnerProfileId: attempt.learner_profile_id,
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
        shouldAutoSubmit: isExpired,
      },
      answers: safeAnswers,
    };

    if (!isSubmitted) {
      return NextResponse.json(baseResponse);
    }

    const { data: test, error: testError } = await supabaseAdmin
      .from("tests")
      .select(`
        title,
        show_result_immediately,
        show_explanations_immediately
      `)
      .eq("id", attempt.test_id)
      .single();

    if (testError || !test) {
      console.error("Submitted attempt test lookup error:", testError);

      return NextResponse.json(
        { error: "Could not load this test's result settings." },
        { status: 500 }
      );
    }

    if (!test.show_result_immediately) {
      return NextResponse.json({
        ...baseResponse,
        result: null,
      });
    }

    const { data: testQuestions, error: testQuestionsError } =
      await supabaseAdmin
        .from("test_questions")
        .select(`
          id,
          order_number,
          marks,
          negative_marks,
          question_snapshot
        `)
        .eq("test_id", attempt.test_id)
        .order("order_number", { ascending: true });

    if (testQuestionsError) {
      console.error(
        "Submitted attempt test-question lookup error:",
        testQuestionsError
      );

      return NextResponse.json(
        { error: "Could not rebuild the submitted test result." },
        { status: 500 }
      );
    }

    const answerByQuestionId = new Map(
      (answers ?? []).map((answer) => [answer.test_question_id, answer])
    );

    const resultQuestions = (testQuestions ?? []).map((testQuestion) => {
      const snapshot = (testQuestion.question_snapshot ?? {}) as QuestionSnapshot;
      const savedAnswer = answerByQuestionId.get(testQuestion.id);

      const optionA = snapshot.options?.A ?? getSnapshotText(snapshot, "option_a", "optionA");
      const optionB = snapshot.options?.B ?? getSnapshotText(snapshot, "option_b", "optionB");
      const optionC = snapshot.options?.C ?? getSnapshotText(snapshot, "option_c", "optionC");
      const optionD = snapshot.options?.D ?? getSnapshotText(snapshot, "option_d", "optionD");

      const question = {
        id: testQuestion.id,
        orderNumber: testQuestion.order_number,
        questionType:
          getSnapshotText(snapshot, "question_type", "questionType") ?? "mcq",
        questionText:
          getSnapshotText(snapshot, "question_text", "questionText") ?? "",
        options: [
          { key: "A", text: optionA },
          { key: "B", text: optionB },
          { key: "C", text: optionC },
          { key: "D", text: optionD },
        ].filter(
          (option): option is { key: string; text: string } =>
            typeof option.text === "string" && option.text.trim().length > 0
        ),
        selectedOption: savedAnswer?.selected_option ?? null,
        answerText: savedAnswer?.answer_text ?? null,
        isCorrect: savedAnswer?.is_correct ?? false,
        marksAwarded: savedAnswer?.marks_awarded ?? 0,
        marks: testQuestion.marks,
        negativeMarks: testQuestion.negative_marks,
      };

      if (test.show_explanations_immediately) {
        return {
          ...question,
          correctOption:
            getSnapshotText(snapshot, "correct_option", "correctOption") ??
            null,
          explanation: snapshot.explanation ?? null,
        };
      }

      return question;
    });

    return NextResponse.json({
      ...baseResponse,
      result: {
        title: test.title,
        score: attempt.score,
        totalMarks: attempt.total_marks,
        percentage: attempt.percentage,
        showExplanationsImmediately: test.show_explanations_immediately,
        questions: resultQuestions,
      },
    });
  } catch (error) {
    console.error("Unexpected attempt lookup error:", error);

    return NextResponse.json(
      { error: "Something went wrong while loading this test attempt." },
      { status: 500 }
    );
  }
}
