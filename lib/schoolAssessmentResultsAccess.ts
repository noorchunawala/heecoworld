import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

export type SchoolAssessmentResultRole = "teacher" | "school_admin";

type ResultAccessSuccess = {
  ok: true;
  userId: string;
  role: SchoolAssessmentResultRole;
  membershipId: string;
  schoolListingId: string;
};

type ResultAccessFailure = {
  ok: false;
  response: NextResponse;
};

export type SchoolAssessmentResultAccess =
  | ResultAccessSuccess
  | ResultAccessFailure;

function forbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function requireSchoolAssessmentResultsAccess(
  request: NextRequest,
  testId: string,
): Promise<SchoolAssessmentResultAccess> {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Your school session has expired. Please sign in again." },
        { status: 401 },
      ),
    };
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Your school session has expired. Please sign in again." },
        { status: 401 },
      ),
    };
  }

  const { data: test, error: testError } = await supabaseAdmin
    .from("tests")
    .select("id, school_listing_id, created_by_membership_id")
    .eq("id", testId)
    .maybeSingle();

  if (testError) {
    console.error("School assessment result test-access lookup error:", testError);

    return {
      ok: false,
      response: NextResponse.json(
        { error: "Could not verify assessment access." },
        { status: 500 },
      ),
    };
  }

  if (!test?.school_listing_id) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "This assessment could not be found." },
        { status: 404 },
      ),
    };
  }

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from("school_memberships")
    .select("id, role, school_listing_id")
    .eq("user_id", user.id)
    .eq("school_listing_id", test.school_listing_id)
    .eq("status", "active")
    .in("role", ["teacher", "school_admin"])
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    console.error(
      "School assessment result membership lookup error:",
      membershipError,
    );

    return {
      ok: false,
      response: NextResponse.json(
        { error: "Could not verify your school access." },
        { status: 500 },
      ),
    };
  }

  if (!membership) {
    return {
      ok: false,
      response: forbidden(
        "You do not have active access to results for this school.",
      ),
    };
  }

  const role = membership.role as SchoolAssessmentResultRole;

  if (
    role === "teacher" &&
    test.created_by_membership_id !== membership.id
  ) {
    return {
      ok: false,
      response: forbidden(
        "Teachers can view results only for assessments they created.",
      ),
    };
  }

  return {
    ok: true,
    userId: user.id,
    role,
    membershipId: membership.id,
    schoolListingId: test.school_listing_id,
  };
}
