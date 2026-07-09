import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  return authorization?.replace(/^Bearer\s+/i, "") || null;
}

function normaliseEmail(value: string | null) {
  return (value || "").trim().toLowerCase();
}

/*
  GET:
  Checks whether an email has been invited as a school admin or teacher.
  Used before sending a magic link.
*/
export async function GET(request: NextRequest) {
  const email = normaliseEmail(
    new URL(request.url).searchParams.get("email")
  );

  if (!email) {
    return NextResponse.json(
      { error: "Email is required." },
      { status: 400 }
    );
  }

  const { data: memberships, error } = await supabaseAdmin
    .from("school_memberships")
    .select("id, role, status, school_listing_id")
    .ilike("email", email)
    .in("role", ["teacher", "school_admin"])
    .in("status", ["invited", "active"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const validMembership = (memberships || []).find(
    (membership) => Boolean(membership.school_listing_id)
  );

  if (!validMembership) {
    return NextResponse.json(
      {
        error:
          "This email has not been invited to a HeecoWorld school account.",
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    allowed: true,
    role: validMembership.role,
    status: validMembership.status,
  });
}

/*
  POST:
  Runs after the invited user has verified their magic link.
  Links Supabase Auth user_id to the matching school membership.
*/
export async function POST(request: NextRequest) {
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

  if (userError || !user?.email) {
    return NextResponse.json(
      { error: "Invalid session." },
      { status: 401 }
    );
  }

  const email = normaliseEmail(user.email);

  const { data: memberships, error: membershipError } = await supabaseAdmin
    .from("school_memberships")
    .select("id, school_listing_id, role, status, user_id")
    .eq("email", email)
    .in("status", ["invited", "active"]);

  if (membershipError) {
    return NextResponse.json(
      { error: membershipError.message },
      { status: 500 }
    );
  }

  if (!memberships || memberships.length === 0) {
    return NextResponse.json(
      {
        error:
          "This email does not have access to a HeecoWorld school account.",
      },
      { status: 403 }
    );
  }

  const linkedToAnotherUser = memberships.some(
    (membership) =>
      membership.user_id && membership.user_id !== user.id
  );

  if (linkedToAnotherUser) {
    return NextResponse.json(
      {
        error:
          "This school membership is already linked to a different account.",
      },
      { status: 409 }
    );
  }

  const invitedMembershipIds = memberships
    .filter((membership) => membership.status === "invited")
    .map((membership) => membership.id);

  if (invitedMembershipIds.length > 0) {
    const { error: activateError } = await supabaseAdmin
      .from("school_memberships")
      .update({
        user_id: user.id,
        status: "active",
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in("id", invitedMembershipIds);

    if (activateError) {
      return NextResponse.json(
        { error: activateError.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    ok: true,
    memberships: memberships.map((membership) => ({
      schoolListingId: membership.school_listing_id,
      role: membership.role,
    })),
  });
}