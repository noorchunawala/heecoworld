import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  return token || null;
}

function cleanTextArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        { error: "Missing authentication token." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user?.id) {
      return NextResponse.json(
        { error: "Your session is invalid. Please sign in again." },
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

    const { data: school, error: schoolError } = await supabaseAdmin
      .from("listings")
      .select("id, name")
      .eq("id", schoolId)
      .eq("type", "school")
      .eq("status", "active")
      .maybeSingle();

    if (schoolError) {
      console.error("Learner school validation error:", schoolError);

      return NextResponse.json(
        { error: "Could not verify the selected school." },
        { status: 500 }
      );
    }

    if (!school) {
      return NextResponse.json(
        { error: "Select a valid active school." },
        { status: 400 }
      );
    }

    const { data: schoolProfile, error: profileError } =
      await supabaseAdmin
        .from("school_profiles")
        .select("listing_id, curricula, grades")
        .eq("listing_id", schoolId)
        .maybeSingle();

    if (profileError) {
      console.error("Learner school profile lookup error:", profileError);

      return NextResponse.json(
        { error: "Could not load this school's grade options." },
        { status: 500 }
      );
    }

    if (!schoolProfile) {
      return NextResponse.json(
        {
          error:
            "This school profile is not configured yet. Please select another school.",
        },
        { status: 422 }
      );
    }

    const curricula = cleanTextArray(schoolProfile.curricula);
    const grades = cleanTextArray(schoolProfile.grades);

    if (grades.length === 0) {
      return NextResponse.json(
        {
          error:
            "This school does not have grade options configured yet. Please select another school.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      school: {
        id: school.id,
        name: school.name,
      },
      curricula,
      grades,
    });
  } catch (error) {
    console.error("Unexpected learner school options error:", error);

    return NextResponse.json(
      { error: "Something went wrong while loading school options." },
      { status: 500 }
    );
  }
}