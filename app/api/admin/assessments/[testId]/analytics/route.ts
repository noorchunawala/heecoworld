import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

type RouteContext = {
  params: Promise<{
    testId: string;
  }>;
};

type OptionKey = "A" | "B" | "C" | "D";

type QuestionSnapshot = {
  question_text?: string;
  correct_option?: OptionKey | null;
  difficulty?: string | null;
  options?: {
    A?: string | null;
    B?: string | null;
    C?: string | null;
    D?: string | null;
  };
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

function emptyOptionCounts() {
  return {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  };
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
        total_questions,
        total_marks
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

    const { data: submittedAttempts, error: attemptsError } =
      await supabaseAdmin
        .from("test_attempts")
        .select("id")
        .eq("test_id", testId)
        .in("status", ["submitted", "auto_submitted"]);

    if (attemptsError) {
      console.error("Analytics attempt lookup error:", attemptsError);

      return NextResponse.json(
        { error: "Could not load submitted attempts for analytics." },
        { status: 500 }
      );
    }

    const submittedAttemptIds = (submittedAttempts ?? []).map(
      (attempt) => attempt.id
    );

    const { data: testQuestions, error: questionsError } = await supabaseAdmin
      .from("test_questions")
      .select(`
        id,
        order_number,
        marks,
        question_snapshot
      `)
      .eq("test_id", testId)
      .order("order_number", { ascending: true });

    if (questionsError) {
      console.error("Analytics question lookup error:", questionsError);

      return NextResponse.json(
        { error: "Could not load questions for analytics." },
        { status: 500 }
      );
    }

    if (submittedAttemptIds.length === 0) {
      return NextResponse.json({
        test: {
          id: test.id,
          title: test.title,
          totalQuestions: test.total_questions,
          totalMarks: test.total_marks,
        },
        summary: {
          submittedAttempts: 0,
          questionsAnalysed: testQuestions?.length ?? 0,
          averageCorrectRate: 0,
          hardestQuestion: null,
        },
        questions: (testQuestions ?? []).map((question) => {
          const snapshot = (question.question_snapshot ??
            {}) as QuestionSnapshot;

          return {
            testQuestionId: question.id,
            orderNumber: question.order_number,
            questionText: snapshot.question_text ?? "",
            difficulty: snapshot.difficulty ?? null,
            marks: question.marks,
            correctOption: snapshot.correct_option ?? null,
            options: snapshot.options ?? {},
            submittedAttempts: 0,
            answeredCount: 0,
            unansweredCount: 0,
            correctCount: 0,
            wrongCount: 0,
            correctRate: 0,
            optionCounts: emptyOptionCounts(),
            mostSelectedWrongOption: null,
          };
        }),
      });
    }

    const { data: answers, error: answersError } = await supabaseAdmin
      .from("attempt_answers")
      .select(`
        attempt_id,
        test_question_id,
        selected_option,
        is_correct,
        marks_awarded
      `)
      .in("attempt_id", submittedAttemptIds);

    if (answersError) {
      console.error("Analytics answer lookup error:", answersError);

      return NextResponse.json(
        { error: "Could not load submitted answers for analytics." },
        { status: 500 }
      );
    }

    const answersByQuestionId = new Map<
      string,
      {
        selected_option: string | null;
        is_correct: boolean | null;
      }[]
    >();

    for (const answer of answers ?? []) {
      const existing = answersByQuestionId.get(answer.test_question_id) ?? [];

      existing.push({
        selected_option: answer.selected_option,
        is_correct: answer.is_correct,
      });

      answersByQuestionId.set(answer.test_question_id, existing);
    }

    const analyticsQuestions = (testQuestions ?? []).map((question) => {
      const snapshot = (question.question_snapshot ?? {}) as QuestionSnapshot;
      const questionAnswers = answersByQuestionId.get(question.id) ?? [];

      const optionCounts = emptyOptionCounts();

      let correctCount = 0;
      let answeredCount = 0;

      for (const answer of questionAnswers) {
        const selectedOption = answer.selected_option;

        if (
          selectedOption === "A" ||
          selectedOption === "B" ||
          selectedOption === "C" ||
          selectedOption === "D"
        ) {
          optionCounts[selectedOption] += 1;
          answeredCount += 1;
        }

        if (answer.is_correct) {
          correctCount += 1;
        }
      }

      const wrongCount = answeredCount - correctCount;
      const unansweredCount = submittedAttemptIds.length - answeredCount;

      const correctRate =
        submittedAttemptIds.length > 0
          ? Math.round((correctCount / submittedAttemptIds.length) * 100)
          : 0;

      const wrongOptionEntries = (
        Object.entries(optionCounts) as [OptionKey, number][]
      ).filter(([optionKey]) => optionKey !== snapshot.correct_option);

      const mostSelectedWrongOption = wrongOptionEntries
        .sort((a, b) => b[1] - a[1])
        .find(([, count]) => count > 0);

      return {
        testQuestionId: question.id,
        orderNumber: question.order_number,
        questionText: snapshot.question_text ?? "",
        difficulty: snapshot.difficulty ?? null,
        marks: question.marks,
        correctOption: snapshot.correct_option ?? null,
        options: snapshot.options ?? {},
        submittedAttempts: submittedAttemptIds.length,
        answeredCount,
        unansweredCount,
        correctCount,
        wrongCount,
        correctRate,
        optionCounts,
        mostSelectedWrongOption: mostSelectedWrongOption
          ? {
              option: mostSelectedWrongOption[0],
              count: mostSelectedWrongOption[1],
            }
          : null,
      };
    });

    const averageCorrectRate =
      analyticsQuestions.length > 0
        ? Math.round(
            analyticsQuestions.reduce(
              (sum, question) => sum + question.correctRate,
              0
            ) / analyticsQuestions.length
          )
        : 0;

    const hardestQuestion =
      analyticsQuestions.length > 0
        ? [...analyticsQuestions].sort(
            (a, b) => a.correctRate - b.correctRate
          )[0]
        : null;

    return NextResponse.json({
      test: {
        id: test.id,
        title: test.title,
        totalQuestions: test.total_questions,
        totalMarks: test.total_marks,
      },
      summary: {
        submittedAttempts: submittedAttemptIds.length,
        questionsAnalysed: analyticsQuestions.length,
        averageCorrectRate,
        hardestQuestion: hardestQuestion
          ? {
              testQuestionId: hardestQuestion.testQuestionId,
              orderNumber: hardestQuestion.orderNumber,
              correctRate: hardestQuestion.correctRate,
            }
          : null,
      },
      questions: analyticsQuestions,
    });
  } catch (error) {
    console.error("Unexpected analytics error:", error);

    return NextResponse.json(
      { error: "Something went wrong while loading analytics." },
      { status: 500 }
    );
  }
}