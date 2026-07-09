import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.replace("Bearer ", "").trim();

  return token || null;
}

type TestRow = {
  id: string;
  title: string;
  class_level: string;
  subject: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  status: string;
  access_mode: string;
  share_code: string | null;
  created_at: string;
  created_by_membership_id: string | null;
};

type AttemptRow = {
  test_id: string;
  score: number | null;
  status: string;
};

type MembershipRow = {
  id: string;
  full_name: string | null;
  email: string;
};

export async function GET(request: NextRequest) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const schoolId = new URL(request.url).searchParams
      .get("schoolId")
      ?.trim();

    if (!schoolId) {
      return NextResponse.json(
        { error: "School ID is required." },
        { status: 400 }
      );
    }

    /*
      Resolve the currently logged-in person's active role
      for this exact school. Never trust a role from the browser.
    */
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("school_memberships")
      .select("id, school_listing_id, role")
      .eq("user_id", user.id)
      .eq("school_listing_id", schoolId)
      .eq("status", "active")
      .in("role", ["teacher", "school_admin"])
      .maybeSingle();

    if (membershipError) {
      console.error("School assessment membership lookup error:", membershipError);

      return NextResponse.json(
        { error: "Could not verify school assessment access." },
        { status: 500 }
      );
    }

    if (!membership) {
      return NextResponse.json(
        {
          error:
            "You do not have active assessment access for this school.",
        },
        { status: 403 }
      );
    }

    let testsQuery = supabaseAdmin
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
        created_at,
        created_by_membership_id
      `)
      .eq("school_listing_id", schoolId)
      .order("created_at", { ascending: false });

    /*
      A teacher can see only their own tests.
      A school admin can see every test created for their school.
    */
    if (membership.role === "teacher") {
      testsQuery = testsQuery.eq(
        "created_by_membership_id",
        membership.id
      );
    }

    const { data: testsData, error: testsError } = await testsQuery;

    if (testsError) {
      console.error("School assessment tests lookup error:", testsError);

      return NextResponse.json(
        { error: "Could not load school assessments." },
        { status: 500 }
      );
    }

    const tests = (testsData ?? []) as TestRow[];

    if (tests.length === 0) {
      return NextResponse.json({
        role: membership.role,
        tests: [],
      });
    }

    const testIds = tests.map((test) => test.id);

    const creatorMembershipIds = Array.from(
      new Set(
        tests
          .map((test) => test.created_by_membership_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    const [
      { data: attemptsData, error: attemptsError },
      { data: creatorsData, error: creatorsError },
    ] = await Promise.all([
      supabaseAdmin
        .from("test_attempts")
        .select("test_id, score, status")
        .in("test_id", testIds)
        .in("status", ["submitted", "auto_submitted"]),

      creatorMembershipIds.length > 0
        ? supabaseAdmin
            .from("school_memberships")
            .select("id, full_name, email")
            .in("id", creatorMembershipIds)
        : Promise.resolve({
            data: [] as MembershipRow[],
            error: null,
          }),
    ]);

    if (attemptsError) {
      console.error("School assessment attempts lookup error:", attemptsError);

      return NextResponse.json(
        { error: "Could not load assessment attempt metrics." },
        { status: 500 }
      );
    }

    if (creatorsError) {
      console.error("School assessment creator lookup error:", creatorsError);

      return NextResponse.json(
        { error: "Could not load assessment creator details." },
        { status: 500 }
      );
    }

    const attemptsByTestId = new Map<string, AttemptRow[]>();

    for (const attempt of (attemptsData ?? []) as AttemptRow[]) {
      const current = attemptsByTestId.get(attempt.test_id) ?? [];
      current.push(attempt);
      attemptsByTestId.set(attempt.test_id, current);
    }

    const creatorByMembershipId = new Map(
      ((creatorsData ?? []) as MembershipRow[]).map((creator) => [
        creator.id,
        creator,
      ])
    );

    const responseTests = tests.map((test) => {
      const submittedAttempts = attemptsByTestId.get(test.id) ?? [];

      const totalScore = submittedAttempts.reduce(
        (sum, attempt) => sum + Number(attempt.score ?? 0),
        0
      );

      const attemptCount = submittedAttempts.length;

      const averageScore =
        attemptCount > 0 ? Number((totalScore / attemptCount).toFixed(1)) : null;

      const averagePercentage =
        attemptCount > 0 && Number(test.total_marks) > 0
          ? Number(
              (
                (totalScore / (attemptCount * Number(test.total_marks))) *
                100
              ).toFixed(1)
            )
          : null;

      const creator = test.created_by_membership_id
        ? creatorByMembershipId.get(test.created_by_membership_id)
        : null;

      return {
        id: test.id,
        title: test.title,
        classLevel: test.class_level,
        subject: test.subject,
        durationMinutes: test.duration_minutes,
        totalQuestions: test.total_questions,
        totalMarks: test.total_marks,
        status: test.status,
        accessMode: test.access_mode,
        createdAt: test.created_at,

        creator: creator
          ? {
              name: creator.full_name?.trim() || creator.email,
              email: creator.email,
            }
          : null,

        metrics: {
          attemptCount,
          averageScore,
          averagePercentage,
        },
      };
    });

    return NextResponse.json({
      role: membership.role,
      tests: responseTests,
    });
  } catch (error) {
    console.error("Unexpected school assessment list error:", error);

    return NextResponse.json(
      { error: "Something went wrong while loading school assessments." },
      { status: 500 }
    );
  }
}