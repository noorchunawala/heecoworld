import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

export const revalidate = 3600;

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.rpc(
      "get_public_practice_options"
    );

    if (error) {
      console.error("Public practice options RPC error:", error);

      return NextResponse.json(
        { error: "Could not load practice test options." },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? {
      curricula: [],
      questionCounts: [10, 20, 30, 40],
      durations: [5, 10, 15, 30, 45, 60],
      difficulties: [
        { id: "easy", label: "Easy" },
        { id: "mixed", label: "Mixed", recommended: true },
        { id: "challenging", label: "Challenging" },
      ],
    });
  } catch (error) {
    console.error("Unexpected public practice options error:", error);

    return NextResponse.json(
      { error: "Something went wrong while loading practice test options." },
      { status: 500 }
    );
  }
}