import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";
import {
  requireSchoolAssessmentResultsAccess,
} from "@/lib/schoolAssessmentResultsAccess";

type RouteContext = {
  params: Promise<{
    testId: string;
    attemptId: string;
  }>;
};

type QuestionSnapshot = {
  question_type?: string;
  questionType?: string;
  question_text?: string;
  questionText?: string;
  options?: {
    A?: string | null;
    B?: string | null;
    C?: string | null;
    D?: string | null;
  };
  option_a?: string | null;
  option_b?: string | null;
  option_c?: string | null;
  option_d?: string | null;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  correct_option?: string | null;
  correctOption?: string | null;
  explanation?: string | null;
};

function firstRelated<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function valueFromSnapshot(
  snapshot: QuestionSnapshot,
  snakeCaseKey: keyof QuestionSnapshot,
  camelCaseKey?: keyof QuestionSnapshot,
) {
  return (
    snapshot[snakeCaseKey] ??
    (camelCaseKey ? snapshot[camelCaseKey] : null) ??
    null
  );
}

function toNumber(value: unknown) {
  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : 0;
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { testId, attemptId } = await params;

    if (!testId || !attemptId) {
      return NextResponse.json(
        { error: "Assessment and attempt IDs are required." },
        { status: 400 },
      );
    }

    const access = await requireSchoolAssessmentResultsAccess(request, testId);

    if (!access.ok) {
      return access.response;
    }

    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from("test_attempts")
      .select(`
        id,
        test_id,
        learner_profile_id,
        student_name,
        class_or_grade,
        status,
        started_at,
        expires_at,
        submitted_at,
        time_taken_seconds,
        score,
        total_marks,
        percentage,
        learner_profiles (
          id,
          full_name,
          relationship,
          grade,
          section
        )
      `)
      .eq("id", attemptId)
      .eq("test_id", testId)
      .maybeSingle();

    if (attemptError || !attempt) {
      return NextResponse.json(
        { error: "This learner attempt could not be found." },
        { status: 404 },
      );
    }

    if (
      attempt.status !== "submitted" &&
      attempt.status !== "auto_submitted"
    ) {
      return NextResponse.json(
        {
          error:
            "This learner has not submitted the assessment yet, so answer review is unavailable.",
        },
        { status: 409 },
      );
    }

    const { data: test, error: testError } = await supabaseAdmin
      .from("tests")
      .select(`
        id,
        title,
        class_level,
        subject,
        total_marks,
        curricula (
          display_name
        )
      `)
      .eq("id", testId)
      .eq("school_listing_id", access.schoolListingId)
      .single();

    if (testError || !test) {
      console.error("Assessment result-review test lookup error:", testError);

      return NextResponse.json(
        { error: "Could not load the assessment." },
        { status: 404 },
      );
    }

    const { data: testQuestions, error: testQuestionsError } =
      await supabaseAdmin
        .from("test_questions")
        .select(`
          id,
          order_number,
          question_snapshot,
          marks,
          negative_marks
        `)
        .eq("test_id", testId)
        .order("order_number", { ascending: true });

    if (testQuestionsError) {
      console.error(
        "Assessment result-review question lookup error:",
        testQuestionsError,
      );

      return NextResponse.json(
        { error: "Could not load the assessment questions." },
        { status: 500 },
      );
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
      .eq("attempt_id", attemptId);

    if (answersError) {
      console.error("Assessment result-review answer lookup error:", answersError);

      return NextResponse.json(
        { error: "Could not load this learner's answers." },
        { status: 500 },
      );
    }

    const answersByQuestionId = new Map(
      (answers ?? []).map((answer) => [answer.test_question_id, answer]),
    );

    const questions = (testQuestions ?? []).map((question) => {
      const snapshot = (question.question_snapshot ?? {}) as QuestionSnapshot;
      const savedAnswer = answersByQuestionId.get(question.id);

      const options = {
        A:
          snapshot.options?.A ??
          valueFromSnapshot(snapshot, "option_a", "optionA"),
        B:
          snapshot.options?.B ??
          valueFromSnapshot(snapshot, "option_b", "optionB"),
        C:
          snapshot.options?.C ??
          valueFromSnapshot(snapshot, "option_c", "optionC"),
        D:
          snapshot.options?.D ??
          valueFromSnapshot(snapshot, "option_d", "optionD"),
      };

      return {
        id: question.id,
        orderNumber: question.order_number,
        questionType:
          valueFromSnapshot(snapshot, "question_type", "questionType") ??
          "mcq",
        questionText:
          valueFromSnapshot(snapshot, "question_text", "questionText") ?? "",
        options,
        selectedOption: savedAnswer?.selected_option ?? null,
        answerText: savedAnswer?.answer_text ?? null,
        isCorrect: savedAnswer?.is_correct ?? false,
        marks: toNumber(question.marks),
        negativeMarks: toNumber(question.negative_marks),
        marksAwarded: toNumber(savedAnswer?.marks_awarded),
        correctOption:
          valueFromSnapshot(snapshot, "correct_option", "correctOption") ??
          null,
        explanation: snapshot.explanation ?? null,
      };
    });

    const learner = firstRelated(
      attempt.learner_profiles as
        | {
            id: string;
            full_name: string;
            relationship: "self" | "child";
            grade: string | null;
            section: string | null;
          }
        | {
            id: string;
            full_name: string;
            relationship: "self" | "child";
            grade: string | null;
            section: string | null;
          }[]
        | null,
    );

    const curriculum = firstRelated(
      test.curricula as
        | { display_name: string }
        | { display_name: string }[]
        | null,
    );

    return NextResponse.json({
      role: access.role,
      test: {
        id: test.id,
        title: test.title,
        curriculumName: curriculum?.display_name ?? null,
        classLevel: test.class_level,
        subject: test.subject,
      },
      attempt: {
        id: attempt.id,
        learnerId: attempt.learner_profile_id,
        learnerName: learner?.full_name || attempt.student_name || "Learner",
        learnerRelationship: learner?.relationship ?? null,
        classOrGrade:
          learner?.grade || attempt.class_or_grade || null,
        section: learner?.section ?? null,
        status: attempt.status,
        startedAt: attempt.started_at,
        submittedAt: attempt.submitted_at,
        timeTakenSeconds: toNumber(attempt.time_taken_seconds),
        score: toNumber(attempt.score),
        totalMarks: toNumber(attempt.total_marks),
        percentage: toNumber(attempt.percentage),
      },
      questions,
    });
  } catch (error) {
    console.error("Unexpected assessment result-review error:", error);

    return NextResponse.json(
      { error: "Something went wrong while loading the answer review." },
      { status: 500 },
    );
  }
}
