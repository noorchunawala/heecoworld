import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

async function getLoggedInUser(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.replace("Bearer ", "").trim();

  if (!token) {
    return null;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getLoggedInUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("curriculum_documents")
      .select(`
        id,
        curriculum_id,
        class_level,
        subject,
        textbook_name,
        textbook_year_or_version,
        processing_status,
        curricula (
          id,
          code,
          display_name,
          curriculum_family
        ),
        curriculum_chapters (
          id,
          chapter_number,
          chapter_name,
          is_active,
          curriculum_sections (
            id,
            section_code,
            topic_name_exact,
            is_active,
            review_status
          )
        )
      `)
      .eq("processing_status", "published")
      .order("class_level", { ascending: true });

    if (error) {
      console.error("Assessment catalog error:", error);

      return NextResponse.json(
        { error: "Could not load assessment curriculum data." },
        { status: 500 }
      );
    }

    const catalog = (data ?? []).map((document) => ({
      ...document,
      curriculum_chapters: (document.curriculum_chapters ?? [])
        .filter((chapter) => chapter.is_active)
        .map((chapter) => ({
          ...chapter,
          curriculum_sections: (chapter.curriculum_sections ?? []).filter(
            (section) =>
              section.is_active && section.review_status === "approved"
          ),
        }))
        .filter((chapter) => chapter.curriculum_sections.length > 0),
    }));

    return NextResponse.json({ catalog });
  } catch (error) {
    console.error("Unexpected assessment catalog error:", error);

    return NextResponse.json(
      { error: "Something went wrong while loading the assessment catalog." },
      { status: 500 }
    );
  }
}