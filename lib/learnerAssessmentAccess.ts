import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

export type OwnedLearner = {
  id: string;
  account_user_id: string;
  full_name: string;
  school_listing_id: string | null;
  curriculum_id: string | null;
  curriculum_level_id: string | null;
  grade: string | null;
  section: string | null;
  status: string;
};

type AuthenticatedUserResult =
  | {
      ok: true;
      userId: string;
    }
  | {
      ok: false;
      response: NextResponse;
    };

type OwnedLearnerResult =
  | {
      ok: true;
      learner: OwnedLearner;
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

  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  return token || null;
}

export async function requireAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUserResult> {
  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  return {
    ok: true,
    userId: user.id,
  };
}

export async function requireOwnedActiveLearner(
  userId: string,
  learnerId: string
): Promise<OwnedLearnerResult> {
  if (!learnerId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Learner profile is required." },
        { status: 400 }
      ),
    };
  }

  const { data: learner, error } = await supabaseAdmin
    .from("learner_profiles")
    .select(`
      id,
      account_user_id,
      full_name,
      school_listing_id,
      curriculum_id,
      curriculum_level_id,
      grade,
      section,
      status
    `)
    .eq("id", learnerId)
    .eq("account_user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("Learner assessment ownership lookup error:", error);

    return {
      ok: false,
      response: NextResponse.json(
        { error: "Could not verify the learner profile." },
        { status: 500 }
      ),
    };
  }

  if (!learner) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "You do not have access to this learner profile." },
        { status: 403 }
      ),
    };
  }

  if (
    !learner.school_listing_id ||
    !learner.curriculum_id ||
    !learner.curriculum_level_id
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "This learner profile needs a school, curriculum, and academic level before assessments can be accessed.",
        },
        { status: 422 }
      ),
    };
  }

  return {
    ok: true,
    learner: learner as OwnedLearner,
  };
}

export async function requireOwnedLearnerAttempt(
  userId: string,
  learnerProfileId: string | null,
  studentUserId: string | null
): Promise<OwnedLearnerResult> {
  if (!learnerProfileId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "This assessment attempt is not linked to a learner profile." },
        { status: 403 }
      ),
    };
  }

  if (!studentUserId || studentUserId !== userId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "You do not have access to this assessment attempt." },
        { status: 403 }
      ),
    };
  }

  return requireOwnedActiveLearner(userId, learnerProfileId);
}
