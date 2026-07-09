import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

function getAccessToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  return authorization?.replace(/^Bearer\s+/i, "").trim() || "";
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);

    if (!accessToken) {
      return NextResponse.json(
        { error: "Missing authentication token." },
        { status: 401 }
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

    const [curriculaResult, levelsResult] = await Promise.all([
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

    if (curriculaResult.error) {
      console.error("Could not load curricula:", curriculaResult.error);

      return NextResponse.json(
        { error: "Could not load curricula." },
        { status: 500 }
      );
    }

    if (levelsResult.error) {
      console.error("Could not load curriculum levels:", levelsResult.error);

      return NextResponse.json(
        { error: "Could not load curriculum levels." },
        { status: 500 }
      );
    }

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

    const curricula = (curriculaResult.data || []).map((curriculum) => ({
      id: curriculum.id,
      code: curriculum.code,
      displayName: curriculum.display_name,
      levels: (levelsByCurriculum.get(curriculum.id) || []).sort(
        (a, b) => a.sortOrder - b.sortOrder
      ),
    }));

    return NextResponse.json({ curricula });
  } catch (error) {
    console.error("Unexpected curriculum catalogue error:", error);

    return NextResponse.json(
      { error: "Could not load the curriculum catalogue." },
      { status: 500 }
    );
  }
}