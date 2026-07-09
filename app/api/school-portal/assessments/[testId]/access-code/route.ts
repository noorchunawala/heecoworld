import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";
import { requireSchoolAssessmentResultsAccess } from "@/lib/schoolAssessmentResultsAccess";

type RouteContext = {
  params: Promise<{
    testId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext,
) {
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
      .select("id, title, status, share_code")
      .eq("id", testId)
      .eq("school_listing_id", access.schoolListingId)
      .maybeSingle();

    if (testError) {
      console.error("Assessment code lookup error:", testError);
      return NextResponse.json(
        { error: "Could not load the assessment code." },
        { status: 500 },
      );
    }

    if (!test) {
      return NextResponse.json(
        { error: "This assessment could not be found." },
        { status: 404 },
      );
    }

    if (test.status !== "published" || !test.share_code) {
      return NextResponse.json(
        { error: "An assessment code is available only after the test is published." },
        { status: 409 },
      );
    }

    return NextResponse.json({
      assessmentCode: test.share_code,
      title: test.title,
    });
  } catch (error) {
    console.error("Unexpected assessment code lookup error:", error);
    return NextResponse.json(
      { error: "Could not load the assessment code." },
      { status: 500 },
    );
  }
}
