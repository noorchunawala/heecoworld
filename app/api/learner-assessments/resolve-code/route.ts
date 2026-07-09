import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";
import {
  requireAuthenticatedUser,
  requireOwnedActiveLearner,
} from "@/lib/learnerAssessmentAccess";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const learnerId =
      typeof body?.learnerId === "string" ? body.learnerId.trim() : "";
    const assessmentCode =
      typeof body?.assessmentCode === "string"
        ? body.assessmentCode.trim().toUpperCase()
        : "";

    if (!learnerId || !assessmentCode) {
      return NextResponse.json(
        { error: "Learner profile and assessment code are required." },
        { status: 400 }
      );
    }

    const auth = await requireAuthenticatedUser(request);

    if (!auth.ok) {
      return auth.response;
    }

    const learnerAccess = await requireOwnedActiveLearner(auth.userId, learnerId);

    if (!learnerAccess.ok) {
      return learnerAccess.response;
    }

    const learner = learnerAccess.learner;

    const { data: test, error: testError } = await supabaseAdmin
      .from("tests")
      .select("id, title")
      .eq("share_code", assessmentCode)
      .eq("school_listing_id", learner.school_listing_id)
      .eq("curriculum_id", learner.curriculum_id)
      .eq("curriculum_level_id", learner.curriculum_level_id)
      .eq("status", "published")
      .eq("access_mode", "private_class")
      .maybeSingle();

    if (testError) {
      console.error("Learner assessment code lookup error:", testError);

      return NextResponse.json(
        { error: "Could not verify this assessment code." },
        { status: 500 }
      );
    }

    if (!test) {
      return NextResponse.json(
        {
          error:
            "This code is invalid or the assessment is not available for the selected learner.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      test: {
        id: test.id,
        title: test.title,
      },
    });
  } catch (error) {
    console.error("Unexpected learner assessment code lookup error:", error);

    return NextResponse.json(
      { error: "Something went wrong while verifying this assessment code." },
      { status: 500 }
    );
  }
}
