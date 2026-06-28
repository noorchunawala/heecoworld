import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const schoolIds: string[] = body.schoolIds || [];
    const schoolNames: string[] = body.schoolNames || [];
    const email: string | null = body.email || null;

    if (!schoolIds.length) {
      return NextResponse.json(
        { success: false, error: "No school selected." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("tour_requests").insert({
      school_ids: schoolIds,
      school_names:schoolNames,
      parent_name: "Interest captured",
      email: email,
      mobile: "+9710123456789",
      child_grade: null,
      preferred_date: null,
      preferred_time: null,
      message: "Interest only: user clicked Book Tour before school onboarding.",
      status: "new",
      email_status: "not_sent",
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Could not save interest." },
      { status: 500 }
    );
  }
}