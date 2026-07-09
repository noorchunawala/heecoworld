import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ schoolId: string }>;
};

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  return authorization?.replace(/^Bearer\s+/i, "") || null;
}

function safePathPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function looksLikePdf(buffer: Buffer) {
  return (
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  );
}

export async function POST(request: NextRequest, context: RouteContext) {
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

  const { schoolId } = await context.params;
  const email = user.email.trim().toLowerCase();

  const [platformAdminResult, schoolMembershipResult] = await Promise.all([
    supabaseAdmin
      .from("platform_admins")
      .select("id")
      .eq("email", email)
      .eq("status", "active")
      .maybeSingle(),

    supabaseAdmin
      .from("school_memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("school_listing_id", schoolId)
      .eq("role", "school_admin")
      .eq("status", "active")
      .maybeSingle(),
  ]);

  if (platformAdminResult.error) {
    return NextResponse.json(
      { error: platformAdminResult.error.message },
      { status: 500 }
    );
  }

  if (schoolMembershipResult.error) {
    return NextResponse.json(
      { error: schoolMembershipResult.error.message },
      { status: 500 }
    );
  }

  const isPlatformAdmin = Boolean(platformAdminResult.data);
  const isAssignedSchoolAdmin = Boolean(schoolMembershipResult.data);

  if (!isPlatformAdmin && !isAssignedSchoolAdmin) {
    return NextResponse.json(
      { error: "You do not have permission to upload for this school." },
      { status: 403 }
    );
  }

  const formData = await request.formData();

  const file = formData.get("file");
  const academicYear = String(formData.get("academicYear") || "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "A PDF file is required." },
      { status: 400 }
    );
  }

  if (!academicYear) {
    return NextResponse.json(
      { error: "Academic year is required." },
      { status: 400 }
    );
  }

  const maxFileSize = 15 * 1024 * 1024;

  if (file.size > maxFileSize) {
    return NextResponse.json(
      { error: "PDF must be 15 MB or smaller." },
      { status: 400 }
    );
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  if (!looksLikePdf(fileBuffer)) {
    return NextResponse.json(
      { error: "The uploaded file is not a valid PDF." },
      { status: 400 }
    );
  }

  const { data: listing, error: listingError } = await supabaseAdmin
    .from("listings")
    .select("slug")
    .eq("id", schoolId)
    .eq("type", "school")
    .single();

  if (listingError || !listing?.slug) {
    return NextResponse.json(
      { error: listingError?.message || "School listing not found." },
      { status: 404 }
    );
  }

  const yearFolder = safePathPart(academicYear);

  if (!yearFolder) {
    return NextResponse.json(
      { error: "Academic year is invalid." },
      { status: 400 }
    );
  }

  const filePath = `${listing.slug}/${yearFolder}-${Date.now()}.pdf`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("inspection-reports")
    .upload(filePath, fileBuffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    filePath,
    fileName: file.name,
  });
}