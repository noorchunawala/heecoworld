import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

type TeacherOwnedTest = {
  id: string;
  status: string;
  school_listing_id: string | null;
  created_by_membership_id: string | null;
  created_by_user_id: string | null;
};

type TeacherTestAccess =
  | {
      ok: true;
      userId: string;
      schoolListingId: string;
      membershipId: string;
      test: TeacherOwnedTest;
    }
  | {
      ok: false;
      response: NextResponse;
    };

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.replace("Bearer ", "").trim();

  return token || null;
}

/*
  Teachers can access only tests where all of these match:

  1. created_by_user_id = logged-in auth user
  2. created_by_membership_id = teacher's active membership
  3. school_listing_id = that membership's assigned school
*/
export async function requireTeacherOwnedTest(
  request: NextRequest,
  testId: string
): Promise<TeacherTestAccess> {
  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      ),
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      ),
    };
  }

  const { data: test, error: testError } = await supabaseAdmin
    .from("tests")
    .select(`
      id,
      status,
      school_listing_id,
      created_by_membership_id,
      created_by_user_id
    `)
    .eq("id", testId)
    .maybeSingle();

  if (testError) {
    console.error("Teacher test access lookup error:", testError);

    return {
      ok: false,
      response: NextResponse.json(
        { error: "Could not verify test access." },
        { status: 500 }
      ),
    };
  }

  /*
    Platform-admin tests have no school/membership ownership.
    They must never be accessible through school-portal routes.
  */
  if (
    !test ||
    !test.school_listing_id ||
    !test.created_by_membership_id ||
    test.created_by_user_id !== user.id
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Test not found or you do not have access to it." },
        { status: 404 }
      ),
    };
  }

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from("school_memberships")
    .select("id, school_listing_id")
    .eq("id", test.created_by_membership_id)
    .eq("user_id", user.id)
    .eq("school_listing_id", test.school_listing_id)
    .eq("role", "teacher")
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) {
    console.error("Teacher membership verification error:", membershipError);

    return {
      ok: false,
      response: NextResponse.json(
        { error: "Could not verify teacher access." },
        { status: 500 }
      ),
    };
  }

  if (!membership) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "Your teacher access for this school is inactive or unavailable.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    userId: user.id,
    schoolListingId: membership.school_listing_id,
    membershipId: membership.id,
    test,
  };
}