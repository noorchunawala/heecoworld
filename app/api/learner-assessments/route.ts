import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";
import {
  requireAuthenticatedUser,
  requireOwnedActiveLearner,
} from "@/lib/learnerAssessmentAccess";

type CurriculumRow = {
  id: string;
  code: string;
  display_name: string;
};

type TestRow = {
  id: string;
  title: string;
  class_level: string | null;
  subject: string | null;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  created_at: string;
  start_at: string | null;
  end_at: string | null;
  status: "published" | "closed";
  created_by_membership_id: string | null;
  curricula: CurriculumRow | CurriculumRow[] | null;
};

type TeacherMembershipRow = {
  id: string;
  user_id: string | null;
  full_name?: string | null;
};

type UserProfileRow = {
  id: string;
  full_name: string | null;
};

type TopicRow = {
  test_id: string;
  curriculum_sections:
    | { section_code: string | null; topic_name_exact: string }
    | { section_code: string | null; topic_name_exact: string }[]
    | null;
};

type AttemptRow = {
  test_id: string;
  learner_profile_id: string | null;
  status: string;
  attempt_token: string;
  score: number | null;
  total_marks: number | null;
  percentage: number | null;
  submitted_at: string | null;
};

function getSingle<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function isCompletedAttempt(status: string | undefined) {
  return status === "submitted" || status === "auto_submitted";
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser(request);
    if (!auth.ok) return auth.response;

    const learnerId = new URL(request.url).searchParams.get("learnerId")?.trim();
    if (!learnerId) {
      return NextResponse.json({ error: "Learner profile is required." }, { status: 400 });
    }

    const learnerAccess = await requireOwnedActiveLearner(auth.userId, learnerId);
    if (!learnerAccess.ok) return learnerAccess.response;

    const learner = learnerAccess.learner;
    const { data: tests, error: testsError } = await supabaseAdmin
      .from("tests")
      .select(`
        id, title, class_level, subject, duration_minutes, total_questions,
        total_marks, created_at, start_at, end_at, status,
        created_by_membership_id,
        curricula ( id, code, display_name )
      `)
      .eq("school_listing_id", learner.school_listing_id)
      .eq("curriculum_id", learner.curriculum_id)
      .eq("curriculum_level_id", learner.curriculum_level_id)
      .in("status", ["published", "closed"])
      .eq("access_mode", "private_class")
      .order("created_at", { ascending: false });

    if (testsError) {
      console.error("Learner assessment catalog test lookup error:", testsError);
      return NextResponse.json({ error: "Could not load school assessments." }, { status: 500 });
    }

    const testRows = (tests ?? []) as unknown as TestRow[];
    const testIds = testRows.map((test) => test.id);
    if (testIds.length === 0) {
      return NextResponse.json({
        learner: { id: learner.id, fullName: learner.full_name },
        assessments: [],
      });
    }

    const membershipIds = Array.from(
      new Set(testRows.map((test) => test.created_by_membership_id).filter((id): id is string => Boolean(id)))
    );

    const [topicResult, attemptResult, membershipResult] = await Promise.all([
      supabaseAdmin
        .from("test_sections")
        .select(`test_id, curriculum_sections ( section_code, topic_name_exact )`)
        .in("test_id", testIds),
      supabaseAdmin
        .from("test_attempts")
        .select(`test_id, learner_profile_id, status, attempt_token, score, total_marks, percentage, submitted_at`)
        .in("test_id", testIds),
      membershipIds.length > 0
        ? supabaseAdmin
            .from("school_memberships")
            .select("id, user_id, full_name")
            .in("id", membershipIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (topicResult.error || attemptResult.error || membershipResult.error) {
      console.error("Learner assessment catalog supporting lookup error:", {
        topic: topicResult.error,
        attempt: attemptResult.error,
        membership: membershipResult.error,
      });
      return NextResponse.json({ error: "Could not load assessment information." }, { status: 500 });
    }

    const memberships = (membershipResult.data ?? []) as TeacherMembershipRow[];
    const teacherUserIds = Array.from(
      new Set(memberships.map((membership) => membership.user_id).filter((id): id is string => Boolean(id)))
    );
    const { data: profiles, error: profilesError } = teacherUserIds.length
      ? await supabaseAdmin.from("user_profiles").select("id, full_name").in("id", teacherUserIds)
      : { data: [], error: null };

    if (profilesError) {
      console.error("Learner assessment teacher profile lookup error:", profilesError);
      return NextResponse.json({ error: "Could not load teacher information." }, { status: 500 });
    }

    const membershipById = new Map(memberships.map((membership) => [membership.id, membership] as const));
    const teacherNameByUserId = new Map(
      ((profiles ?? []) as UserProfileRow[]).map((profile) => [profile.id, profile.full_name?.trim() || "Your teacher"] as const)
    );
    const topicByTestId = new Map<string, string>();
    for (const row of (topicResult.data ?? []) as unknown as TopicRow[]) {
      if (topicByTestId.has(row.test_id)) continue;
      const section = getSingle(row.curriculum_sections);
      if (section) {
        topicByTestId.set(
          row.test_id,
          [section.section_code, section.topic_name_exact].filter(Boolean).join(" — ")
        );
      }
    }

    const attemptsByTestId = new Map<string, AttemptRow[]>();
    for (const attempt of (attemptResult.data ?? []) as AttemptRow[]) {
      const entries = attemptsByTestId.get(attempt.test_id) ?? [];
      entries.push(attempt);
      attemptsByTestId.set(attempt.test_id, entries);
    }

    const now = new Date();
    const assessments = testRows.map((test) => {
      const attempts = attemptsByTestId.get(test.id) ?? [];
      const learnerAttempt = attempts.find((attempt) => attempt.learner_profile_id === learner.id);
      const membership = test.created_by_membership_id ? membershipById.get(test.created_by_membership_id) : null;
      const teacherName = membership?.user_id
        ? (teacherNameByUserId.get(membership.user_id) ?? membership.full_name?.trim() ?? "Your teacher")
        : membership?.full_name?.trim() || "Your teacher";
      const curriculum = getSingle(test.curricula);
      const isCompleted = isCompletedAttempt(learnerAttempt?.status);

      let availability: "available" | "not_started" | "closed" = "available";
      if (!isCompleted && !learnerAttempt) {
        if (test.status !== "published" || (test.end_at && new Date(test.end_at) <= now)) {
          availability = "closed";
        } else if (test.start_at && new Date(test.start_at) > now) {
          availability = "not_started";
        }
      }

      return {
        id: test.id,
        title: test.title,
        teacherName,
        curriculumName: curriculum?.display_name ?? null,
        classLevel: test.class_level,
        subject: test.subject,
        topic: topicByTestId.get(test.id) ?? null,
        durationMinutes: test.duration_minutes,
        totalQuestions: test.total_questions,
        totalMarks: test.total_marks,
        publishedAt: test.start_at ?? test.created_at,
        availability,
        startedCount: attempts.length,
        completedCount: attempts.filter((attempt) => isCompletedAttempt(attempt.status)).length,
        learnerAttempt: learnerAttempt
          ? {
              status: learnerAttempt.status,
              score: learnerAttempt.score,
              totalMarks: learnerAttempt.total_marks,
              percentage: learnerAttempt.percentage,
              submittedAt: learnerAttempt.submitted_at,
              isCompleted,
            }
          : null,
      };
    });

    return NextResponse.json({
      learner: { id: learner.id, fullName: learner.full_name },
      assessments,
    });
  } catch (error) {
    console.error("Unexpected learner assessment catalog error:", error);
    return NextResponse.json({ error: "Something went wrong while loading school assessments." }, { status: 500 });
  }
}
