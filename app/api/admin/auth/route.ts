import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");

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

  if (userError || !user?.email) {
    return NextResponse.json(
      { error: "Invalid session." },
      { status: 401 }
    );
  }

  const email = user.email.trim().toLowerCase();

  const { data: platformAdmin, error: adminError } = await supabaseAdmin
    .from("platform_admins")
    .select("id, email, status")
    .eq("email", email)
    .eq("status", "active")
    .maybeSingle();

  if (adminError) {
    return NextResponse.json(
      { error: adminError.message },
      { status: 500 }
    );
  }

  if (!platformAdmin) {
    return NextResponse.json(
      { error: "This account is not a HeecoWorld platform admin." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    ok: true,
    email: platformAdmin.email,
  });
}