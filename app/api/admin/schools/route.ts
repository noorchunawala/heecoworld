import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  return authorization?.replace(/^Bearer\s+/i, "") || null;
}

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

  const currentUserEmail = user.email.trim().toLowerCase();

  const { data: platformAdmin, error: platformAdminError } =
    await supabaseAdmin
      .from("platform_admins")
      .select("id")
      .eq("email", currentUserEmail)
      .eq("status", "active")
      .maybeSingle();

  if (platformAdminError) {
    return NextResponse.json(
      { error: platformAdminError.message },
      { status: 500 }
    );
  }

  if (!platformAdmin) {
    return NextResponse.json(
      { error: "You are not allowed to create school listings." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);

  const name = String(body?.name || "").trim();
  const slug = String(body?.slug || "")
    .trim()
    .toLowerCase();
  const emirate = String(body?.emirate || "").trim() || null;
  const area = String(body?.area || "").trim() || null;
  const schoolAdminEmail = String(body?.schoolAdminEmail || "")
    .trim()
    .toLowerCase();

  if (!name || !slug || !schoolAdminEmail) {
    return NextResponse.json(
      { error: "School name, slug and school admin email are required." },
      { status: 400 }
    );
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json(
      { error: "Slug can contain only lowercase letters, numbers and hyphens." },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(schoolAdminEmail)) {
    return NextResponse.json(
      { error: "Enter a valid school admin email address." },
      { status: 400 }
    );
  }

  const { data: existingListing, error: existingListingError } =
    await supabaseAdmin
      .from("listings")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

  if (existingListingError) {
    return NextResponse.json(
      { error: existingListingError.message },
      { status: 500 }
    );
  }

  if (existingListing) {
    return NextResponse.json(
      { error: "A listing with this slug already exists." },
      { status: 409 }
    );
  }

  const { data: listing, error: listingError } = await supabaseAdmin
    .from("listings")
    .insert({
      name,
      slug,
      emirate,
      area,
      status: "draft",
      type: "school",
    })
    .select("id")
    .single();

  if (listingError || !listing) {
    return NextResponse.json(
      { error: listingError?.message || "Could not create school listing." },
      { status: 500 }
    );
  }

  const schoolId = listing.id;

  const [profileResult, detailsResult, membershipResult] = await Promise.all([
    supabaseAdmin.from("school_profiles").insert({
      listing_id: schoolId,
      curricula: [],
      grades: [],
      priorities: [],
      facilities: [],
    }),

    supabaseAdmin.from("school_profile_details").insert({
      listing_id: schoolId,
      updated_at: new Date().toISOString(),
    }),

    supabaseAdmin.from("school_memberships").insert({
      school_listing_id: schoolId,
      email: schoolAdminEmail,
      role: "school_admin",
      status: "invited",
      invited_by_user_id: user.id,
    }),
  ]);

  const setupError =
    profileResult.error || detailsResult.error || membershipResult.error;

  if (setupError) {
    await Promise.all([
      supabaseAdmin
        .from("school_memberships")
        .delete()
        .eq("school_listing_id", schoolId),

      supabaseAdmin
        .from("school_profile_details")
        .delete()
        .eq("listing_id", schoolId),

      supabaseAdmin
        .from("school_profiles")
        .delete()
        .eq("listing_id", schoolId),
    ]);

    await supabaseAdmin.from("listings").delete().eq("id", schoolId);

    return NextResponse.json(
      { error: setupError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    id: schoolId,
    schoolAdminEmail,
  });
}