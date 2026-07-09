import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";
import {
  getAllowedCurriculumCodes,
  type GlobalCurriculumCode,
} from "@/lib/assessmentCurriculumMatching";

function getAccessToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  return authorization?.replace(/^Bearer\s+/i, "").trim() || "";
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    const schoolId =
      new URL(request.url).searchParams.get("schoolId")?.trim() || "";

    if (!accessToken) {
      return NextResponse.json(
        { error: "Missing authentication token." },
        { status: 401 }
      );
    }

    if (!schoolId) {
      return NextResponse.json(
        { error: "School ID is required." },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Your session is invalid. Please sign in again." },
        { status: 401 }
      );
    }

    const [schoolResult, schoolProfileResult, curriculaResult, levelsResult] =
      await Promise.all([
        supabaseAdmin
          .from("listings")
          .select("id, name")
          .eq("id", schoolId)
          .eq("type", "school")
          .eq("status", "active")
          .maybeSingle(),

        supabaseAdmin
          .from("school_profiles")
          .select("curricula")
          .eq("listing_id", schoolId)
          .maybeSingle(),

        supabaseAdmin
          .from("curricula")
          .select("id, code, display_name")
          .eq("is_active", true)
          .order("display_name", { ascending: true }),

        supabaseAdmin
          .from("curriculum_levels")
          .select("id, curriculum_id, code, display_name, sort_order")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ]);

    if (schoolResult.error) {
      console.error("School curriculum options school error:", schoolResult.error);

      return NextResponse.json(
        { error: "Could not verify the selected school." },
        { status: 500 }
      );
    }

    if (!schoolResult.data) {
      return NextResponse.json(
        { error: "The selected school is not available." },
        { status: 400 }
      );
    }

    if (schoolProfileResult.error) {
      console.error(
        "School curriculum options profile error:",
        schoolProfileResult.error
      );

      return NextResponse.json(
        { error: "Could not load this school's curriculum details." },
        { status: 500 }
      );
    }

    if (curriculaResult.error || levelsResult.error) {
      console.error(
        "School curriculum options global catalogue error:",
        curriculaResult.error || levelsResult.error
      );

      return NextResponse.json(
        { error: "Could not load curriculum options." },
        { status: 500 }
      );
    }

    const allowedCodes = getAllowedCurriculumCodes(
      schoolProfileResult.data?.curricula
    );

    const levelsByCurriculum = new Map<
      string,
      {
        id: string;
        code: string;
        displayName: string;
        sortOrder: number;
      }[]
    >();

    for (const level of levelsResult.data || []) {
      const currentLevels =
        levelsByCurriculum.get(level.curriculum_id) || [];

      currentLevels.push({
        id: level.id,
        code: level.code,
        displayName: level.display_name,
        sortOrder: level.sort_order,
      });

      levelsByCurriculum.set(level.curriculum_id, currentLevels);
    }

    const curricula = (curriculaResult.data || [])
      .filter((curriculum) =>
        allowedCodes.has(curriculum.code as GlobalCurriculumCode)
      )
      .map((curriculum) => ({
        id: curriculum.id,
        code: curriculum.code,
        displayName: curriculum.display_name,
        levels: (levelsByCurriculum.get(curriculum.id) || []).sort(
          (a, b) => a.sortOrder - b.sortOrder
        ),
      }));

    return NextResponse.json({
      school: schoolResult.data,
      curricula,
      message:
        curricula.length === 0
          ? "Assessment curriculum options are not available for this school yet."
          : null,
    });
  } catch (error) {
    console.error("Unexpected school curriculum options error:", error);

    return NextResponse.json(
      { error: "Could not load school curriculum options." },
      { status: 500 }
    );
  }
}