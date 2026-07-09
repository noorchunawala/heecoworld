import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";
import { requireSchoolAssessmentResultsAccess } from "@/lib/schoolAssessmentResultsAccess";

type RouteContext = {
  params: Promise<{
    testId: string;
  }>;
};

type QuestionSnapshot = {
  question_text?: string;
  questionText?: string;
  question_type?: string;
  difficulty?: string;
};

type AttemptAnswer = {
  attempt_id: string;
  test_question_id: string;
  selected_option: string | null;
  is_correct: boolean | null;
  marks_awarded: number | string | null;
};

function firstRelated<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function isCompletedAttempt(status: string) {
  return status === "submitted" || status === "auto_submitted";
}

function toNumber(value: unknown) {
  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : null;
}

function roundOne(value: number) {
  return Number(value.toFixed(1));
}

function getQuestionText(snapshot: QuestionSnapshot | null | undefined) {
  return (
    snapshot?.question_text ||
    snapshot?.questionText ||
    "Question text unavailable"
  );
}

function scoreBucketLabel(percentage: number | null) {
  if (percentage === null) return null;
  if (percentage < 40) return "0-39%";
  if (percentage < 60) return "40-59%";
  if (percentage < 80) return "60-79%";
  return "80-100%";
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { testId } = await params;

    if (!testId) {
      return NextResponse.json(
        { error: "Assessment ID is required." },
        { status: 400 },
      );
    }

    const access = await requireSchoolAssessmentResultsAccess(request, testId);

    if (!access.ok) {
      return access.response;
    }

    const { data: test, error: testError } = await supabaseAdmin
      .from("tests")
      .select(`
        id,
        title,
        status,
        class_level,
        subject,
        duration_minutes,
        total_questions,
        total_marks,
        created_at,
        created_by_membership_id,
        curricula (
          id,
          code,
          display_name
        )
      `)
      .eq("id", testId)
      .eq("school_listing_id", access.schoolListingId)
      .single();

    if (testError || !test) {
      console.error("Assessment result test lookup error:", testError);

      return NextResponse.json(
        { error: "Could not load this assessment." },
        { status: 404 },
      );
    }

    let creator: { name: string; email: string | null } | null = null;

    if (test.created_by_membership_id) {
      const { data: membership, error: creatorError } = await supabaseAdmin
        .from("school_memberships")
        .select("full_name, email")
        .eq("id", test.created_by_membership_id)
        .maybeSingle();

      if (creatorError) {
        console.error("Assessment result creator lookup error:", creatorError);
      } else if (membership) {
        creator = {
          name: membership.full_name?.trim() || membership.email || "Teacher",
          email: membership.email ?? null,
        };
      }
    }

    const { data: testSections, error: sectionsError } = await supabaseAdmin
      .from("test_sections")
      .select(`
        curriculum_sections (
          section_code,
          topic_name_exact
        )
      `)
      .eq("test_id", testId);

    if (sectionsError) {
      console.error("Assessment result section lookup error:", sectionsError);

      return NextResponse.json(
        { error: "Could not load the assessment syllabus details." },
        { status: 500 },
      );
    }

    const topics = (testSections ?? [])
      .map((item) =>
        firstRelated(
          item.curriculum_sections as
            | { section_code: string | null; topic_name_exact: string }
            | { section_code: string | null; topic_name_exact: string }[]
            | null,
        ),
      )
      .filter(
        (
          topic,
        ): topic is {
          section_code: string | null;
          topic_name_exact: string;
        } => Boolean(topic?.topic_name_exact),
      )
      .map((topic) => ({
        sectionCode: topic.section_code,
        name: topic.topic_name_exact,
      }));

    const { data: rawAttempts, error: attemptsError } = await supabaseAdmin
      .from("test_attempts")
      .select(`
        id,
        learner_profile_id,
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
        created_at,
        learner_profiles (
          id,
          full_name,
          relationship,
          grade,
          section
        )
      `)
      .eq("test_id", testId)
      .order("created_at", { ascending: false });

    if (attemptsError) {
      console.error("Assessment result attempt lookup error:", attemptsError);

      return NextResponse.json(
        { error: "Could not load learner attempts for this assessment." },
        { status: 500 },
      );
    }

    const attempts = (rawAttempts ?? []).map((attempt) => {
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

      const completed = isCompletedAttempt(attempt.status);

      return {
        id: attempt.id,
        learnerId: attempt.learner_profile_id,
        learnerName: learner?.full_name || attempt.student_name || "Learner",
        learnerRelationship: learner?.relationship ?? null,
        classOrGrade: learner?.grade || attempt.class_or_grade || null,
        section: learner?.section ?? null,
        attemptNumber: attempt.attempt_number,
        status: attempt.status,
        startedAt: attempt.started_at,
        expiresAt: attempt.expires_at,
        submittedAt: attempt.submitted_at,
        timeTakenSeconds: toNumber(attempt.time_taken_seconds),
        score: toNumber(attempt.score),
        totalMarks: toNumber(attempt.total_marks),
        percentage: toNumber(attempt.percentage),
        isCompleted: completed,
      };
    });

    const completedAttempts = attempts.filter((attempt) => attempt.isCompleted);
    const completedAttemptIds = completedAttempts.map((attempt) => attempt.id);
    const scoredAttempts = completedAttempts.filter(
      (attempt) => attempt.percentage !== null,
    );

    const averagePercentage =
      scoredAttempts.length > 0
        ? roundOne(
            scoredAttempts.reduce(
              (total, attempt) => total + (attempt.percentage ?? 0),
              0,
            ) / scoredAttempts.length,
          )
        : null;

    const averageScore =
      scoredAttempts.length > 0
        ? roundOne(
            scoredAttempts.reduce(
              (total, attempt) => total + (attempt.score ?? 0),
              0,
            ) / scoredAttempts.length,
          )
        : null;

    const timedAttempts = completedAttempts.filter(
      (attempt) => attempt.timeTakenSeconds !== null,
    );

    const averageTimeTakenSeconds =
      timedAttempts.length > 0
        ? Math.round(
            timedAttempts.reduce(
              (total, attempt) => total + (attempt.timeTakenSeconds ?? 0),
              0,
            ) / timedAttempts.length,
          )
        : null;

    const scoreBuckets = [
      { label: "0-39%", count: 0 },
      { label: "40-59%", count: 0 },
      { label: "60-79%", count: 0 },
      { label: "80-100%", count: 0 },
    ];

    scoredAttempts.forEach((attempt) => {
      const label = scoreBucketLabel(attempt.percentage);
      const bucket = scoreBuckets.find((item) => item.label === label);
      if (bucket) bucket.count += 1;
    });

    const statusBreakdown = [
      {
        label: "In progress",
        status: "in_progress",
        count: attempts.filter((attempt) => attempt.status === "in_progress").length,
      },
      {
        label: "Submitted",
        status: "submitted",
        count: attempts.filter((attempt) => attempt.status === "submitted").length,
      },
      {
        label: "Auto-submitted",
        status: "auto_submitted",
        count: attempts.filter((attempt) => attempt.status === "auto_submitted").length,
      },
    ];

    const [{ data: testQuestions, error: testQuestionsError }, answersResult] =
      await Promise.all([
        supabaseAdmin
          .from("test_questions")
          .select("id, order_number, marks, question_snapshot")
          .eq("test_id", testId)
          .order("order_number", { ascending: true }),
        completedAttemptIds.length > 0
          ? supabaseAdmin
              .from("attempt_answers")
              .select(
                "attempt_id, test_question_id, selected_option, is_correct, marks_awarded",
              )
              .in("attempt_id", completedAttemptIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

    if (testQuestionsError) {
      console.error(
        "Assessment result question analytics lookup error:",
        testQuestionsError,
      );

      return NextResponse.json(
        { error: "Could not load question analytics for this assessment." },
        { status: 500 },
      );
    }

    if (answersResult.error) {
      console.error(
        "Assessment result answer analytics lookup error:",
        answersResult.error,
      );

      return NextResponse.json(
        { error: "Could not load answer analytics for this assessment." },
        { status: 500 },
      );
    }

    const answers = (answersResult.data ?? []) as AttemptAnswer[];
    const answersByQuestion = new Map<string, AttemptAnswer[]>();

    answers.forEach((answer) => {
      const existing = answersByQuestion.get(answer.test_question_id) ?? [];
      existing.push(answer);
      answersByQuestion.set(answer.test_question_id, existing);
    });

    const questionAnalytics = (testQuestions ?? []).map((question) => {
      const questionAnswers = answersByQuestion.get(question.id) ?? [];
      const answeredCount = questionAnswers.length;
      const correctCount = questionAnswers.filter(
        (answer) => answer.is_correct === true,
      ).length;
      const wrongCount = questionAnswers.filter(
        (answer) => answer.is_correct === false,
      ).length;
      const skippedCount = Math.max(completedAttempts.length - answeredCount, 0);
      const correctPercentage =
        completedAttempts.length > 0
          ? roundOne((correctCount / completedAttempts.length) * 100)
          : null;
      const averageMarks =
        answeredCount > 0
          ? roundOne(
              questionAnswers.reduce(
                (total, answer) => total + (toNumber(answer.marks_awarded) ?? 0),
                0,
              ) / answeredCount,
            )
          : null;

      const snapshot = (question.question_snapshot ?? {}) as QuestionSnapshot;

      return {
        testQuestionId: question.id,
        orderNumber: question.order_number,
        questionText: getQuestionText(snapshot),
        difficulty: snapshot.difficulty ?? null,
        marks: toNumber(question.marks),
        answeredCount,
        correctCount,
        wrongCount,
        skippedCount,
        correctPercentage,
        averageMarks,
      };
    });

    const difficultQuestions = questionAnalytics
      .filter((question) => question.correctPercentage !== null)
      .sort((a, b) => {
        const correctDiff =
          (a.correctPercentage ?? 101) - (b.correctPercentage ?? 101);

        if (correctDiff !== 0) return correctDiff;

        return b.wrongCount - a.wrongCount;
      })
      .slice(0, 5);

    const curriculum = firstRelated(
      test.curricula as
        | { id: string; code: string; display_name: string }
        | { id: string; code: string; display_name: string }[]
        | null,
    );

    return NextResponse.json({
      role: access.role,
      test: {
        id: test.id,
        title: test.title,
        status: test.status,
        curriculumName: curriculum?.display_name ?? null,
        classLevel: test.class_level,
        subject: test.subject,
        durationMinutes: test.duration_minutes,
        totalQuestions: test.total_questions,
        totalMarks: toNumber(test.total_marks),
        createdAt: test.created_at,
        creator,
        topics,
      },
      summary: {
        startedCount: attempts.length,
        inProgressCount: attempts.filter(
          (attempt) => attempt.status === "in_progress",
        ).length,
        completedCount: completedAttempts.length,
        averagePercentage,
        averageScore,
        averageTimeTakenSeconds,
      },
      analytics: {
        completionRate:
          attempts.length > 0
            ? Math.round((completedAttempts.length / attempts.length) * 100)
            : 0,
        statusBreakdown,
        scoreDistribution: scoreBuckets,
        questionAnalytics,
        difficultQuestions,
      },
      attempts,
    });
  } catch (error) {
    console.error("Unexpected assessment result list error:", error);

    return NextResponse.json(
      { error: "Something went wrong while loading assessment results." },
      { status: 500 },
    );
  }
}
