import { NextRequest, NextResponse } from "next/server";
import { getListingAnalytics } from "@/lib/listingAnalytics";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { schoolId } = await params;

    const analytics = await getListingAnalytics(schoolId);

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error("School overview analytics error:", error);

    return NextResponse.json(
      { error: "Could not load school overview analytics." },
      { status: 500 }
    );
  }
}