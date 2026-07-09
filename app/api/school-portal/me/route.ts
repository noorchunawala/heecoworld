import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  return authorization?.replace(/^Bearer\s+/i, "") || null;
}

export async function GET(request: NextRequest) {
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

  if (userError || !user) {
    return NextResponse.json(
      { error: "Invalid session." },
      { status: 401 }
    );
  }

  const { data: memberships, error: membershipError } = await supabaseAdmin
    .from("school_memberships")
    .select("id, school_listing_id, role")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (membershipError) {
    return NextResponse.json(
      { error: membershipError.message },
      { status: 500 }
    );
  }

  if (!memberships || memberships.length === 0) {
    return NextResponse.json(
      { error: "No active school access found for this account." },
      { status: 403 }
    );
  }

  const schoolIds = [
    ...new Set(memberships.map((membership) => membership.school_listing_id)),
  ];

  const { data: listings, error: listingsError } = await supabaseAdmin
    .from("listings")
    .select("id, name, slug, status")
    .in("id", schoolIds)
    .eq("type", "school");

  if (listingsError) {
    return NextResponse.json(
      { error: listingsError.message },
      { status: 500 }
    );
  }

  const listingsById = new Map(
    (listings || []).map((listing) => [listing.id, listing])
  );

  const schools = memberships
    .map((membership) => {
      const listing = listingsById.get(membership.school_listing_id);

      if (!listing) return null;

      return {
        membershipId: membership.id,
        role: membership.role,
        school: {
          id: listing.id,
          name: listing.name,
          slug: listing.slug,
          status: listing.status,
        },
      };
    })
    .filter(Boolean);

  return NextResponse.json({ schools });
}