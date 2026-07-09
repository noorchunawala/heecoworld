import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

type RouteContext = {
  params: Promise<{
    schoolId: string;
  }>;
};

type PlatformAdminAccess =
  | {
      ok: true;
      userId: string;
      email: string;
    }
  | {
      ok: false;
      response: NextResponse;
    };

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.replace("Bearer ", "").trim();

  return token || null;
}

async function requirePlatformAdmin(
  request: NextRequest
): Promise<PlatformAdminAccess> {
  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Missing authentication token." },
        { status: 401 }
      ),
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user?.email) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid session." },
        { status: 401 }
      ),
    };
  }

  const email = user.email.trim().toLowerCase();

  const { data: platformAdmin, error: adminError } = await supabaseAdmin
    .from("platform_admins")
    .select("id, email, status")
    .eq("email", email)
    .eq("status", "active")
    .maybeSingle();

  if (adminError) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: adminError.message },
        { status: 500 }
      ),
    };
  }

  if (!platformAdmin) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "This account is not a HeecoWorld platform admin." },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    userId: user.id,
    email: platformAdmin.email,
  };
}

async function requireSchoolListing(schoolId: string) {
  const { data: school, error } = await supabaseAdmin
    .from("listings")
    .select("id, name, type")
    .eq("id", schoolId)
    .eq("type", "school")
    .maybeSingle();

  if (error) {
    return {
      school: null,
      response: NextResponse.json(
        { error: "Could not verify this school." },
        { status: 500 }
      ),
    };
  }

  if (!school) {
    return {
      school: null,
      response: NextResponse.json(
        { error: "School not found." },
        { status: 404 }
      ),
    };
  }

  return {
    school,
    response: null,
  };
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/*
  GET
  Lists every school_admin membership for one school.
*/
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const access = await requirePlatformAdmin(request);

    if (!access.ok) {
      return access.response;
    }

    const { schoolId } = await params;

    if (!schoolId) {
      return NextResponse.json(
        { error: "School ID is required." },
        { status: 400 }
      );
    }

    const schoolResult = await requireSchoolListing(schoolId);

    if (!schoolResult.school) {
      return schoolResult.response!;
    }

    const { data: admins, error: adminsError } = await supabaseAdmin
      .from("school_memberships")
      .select(`
        id,
        full_name,
        email,
        role,
        status,
        user_id,
        accepted_at,
        created_at,
        updated_at
      `)
      .eq("school_listing_id", schoolId)
      .eq("role", "school_admin")
      .order("created_at", { ascending: false });

  if (adminsError) {
  console.error("School admin list error:", adminsError);

  return NextResponse.json(
    {
      error: adminsError.message,
      details: adminsError.details,
      hint: adminsError.hint,
      code: adminsError.code,
    },
    { status: 500 }
  );
}
    return NextResponse.json({
      school: schoolResult.school,
      admins: admins ?? [],
    });
  } catch (error) {
    console.error("Unexpected school admin list error:", error);

    return NextResponse.json(
      { error: "Something went wrong while loading school administrators." },
      { status: 500 }
    );
  }
}

/*
  POST
  Adds a new school admin or re-invites an suspended school admin.
  No email is sent yet. The person can activate through /school-access.
*/
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const access = await requirePlatformAdmin(request);

    if (!access.ok) {
      return access.response;
    }

    const { schoolId } = await params;

    if (!schoolId) {
      return NextResponse.json(
        { error: "School ID is required." },
        { status: 400 }
      );
    }

    const schoolResult = await requireSchoolListing(schoolId);

    if (!schoolResult.school) {
      return schoolResult.response!;
    }

    const body = await request.json().catch(() => null);

    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const fullName =
      typeof body?.fullName === "string"
        ? body.fullName.trim() || null
        : null;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid school administrator email." },
        { status: 400 }
      );
    }

    /*
      We intentionally do not allow one account to be both a teacher and
      school admin yet. The dashboard currently treats these as separate roles.
    */
    const { data: existingMemberships, error: existingError } =
      await supabaseAdmin
        .from("school_memberships")
        .select("id, role, status, email")
        .eq("school_listing_id", schoolId)
        .eq("email", email);

    if (existingError) {
      console.error("Existing school membership lookup error:", existingError);

      return NextResponse.json(
        { error: "Could not check existing school access." },
        { status: 500 }
      );
    }

    const existingTeacher = (existingMemberships ?? []).find(
      (membership) => membership.role === "teacher"
    );

    if (existingTeacher) {
      return NextResponse.json(
        {
          error:
            "This email already has teacher access for this school. Keep school-admin and teacher access separate for now.",
        },
        { status: 409 }
      );
    }

    const existingAdmin = (existingMemberships ?? []).find(
      (membership) => membership.role === "school_admin"
    );

    if (existingAdmin?.status === "active") {
      return NextResponse.json(
        { error: "This school administrator already has active access." },
        { status: 409 }
      );
    }

    if (existingAdmin?.status === "invited") {
      return NextResponse.json(
        { error: "This school administrator already has a pending invitation." },
        { status: 409 }
      );
    }

    if (existingAdmin?.status === "suspended") {
      const { data: reInvitedAdmin, error: reInviteError } =
        await supabaseAdmin
          .from("school_memberships")
          .update({
            full_name: fullName,
            status: "invited",
            invited_by_user_id: access.userId,
            accepted_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingAdmin.id)
          .eq("school_listing_id", schoolId)
          .eq("role", "school_admin")
          .select(`
            id,
            full_name,
            email,
            role,
            status,
            user_id,
            accepted_at,
            created_at,
            updated_at
          `)
          .single();

      if (reInviteError || !reInvitedAdmin) {
        console.error("School admin re-invite error:", reInviteError);

        return NextResponse.json(
          { error: "Could not re-invite this school administrator." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "School administrator access was re-invited.",
        admin: reInvitedAdmin,
      });
    }

    const { data: createdAdmin, error: createError } = await supabaseAdmin
      .from("school_memberships")
      .insert({
        school_listing_id: schoolId,
        email,
        full_name: fullName,
        role: "school_admin",
        status: "invited",
        invited_by_user_id: access.userId,
      })
      .select(`
        id,
        full_name,
        email,
        role,
        status,
        user_id,
        accepted_at,
        created_at,
        updated_at
      `)
      .single();

    if (createError || !createdAdmin) {
      console.error("Create school admin access error:", createError);

      return NextResponse.json(
        { error: "Could not invite this school administrator." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message:
          "School administrator access was created. They can activate using their invited email.",
        admin: createdAdmin,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected create school admin error:", error);

    return NextResponse.json(
      { error: "Something went wrong while creating school administrator access." },
      { status: 500 }
    );
  }
}

/*
  PATCH
  action = deactivate | reinvite
*/
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const access = await requirePlatformAdmin(request);

    if (!access.ok) {
      return access.response;
    }

    const { schoolId } = await params;

    if (!schoolId) {
      return NextResponse.json(
        { error: "School ID is required." },
        { status: 400 }
      );
    }

    const schoolResult = await requireSchoolListing(schoolId);

    if (!schoolResult.school) {
      return schoolResult.response!;
    }

    const body = await request.json().catch(() => null);

    const membershipId =
      typeof body?.membershipId === "string"
        ? body.membershipId.trim()
        : "";

    const action =
      body?.action === "deactivate" || body?.action === "reinvite"
        ? body.action
        : null;

    if (!membershipId || !action) {
      return NextResponse.json(
        { error: "A school administrator and action are required." },
        { status: 400 }
      );
    }

    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("school_memberships")
      .select("id, email, role, status")
      .eq("id", membershipId)
      .eq("school_listing_id", schoolId)
      .eq("role", "school_admin")
      .maybeSingle();

    if (membershipError) {
      console.error("School admin membership lookup error:", membershipError);

      return NextResponse.json(
        { error: "Could not verify school administrator access." },
        { status: 500 }
      );
    }

    if (!membership) {
      return NextResponse.json(
        { error: "School administrator access was not found." },
        { status: 404 }
      );
    }

    if (action === "deactivate") {
      if (membership.status === "suspended") {
        return NextResponse.json({
          message: "School administrator access is already inactive.",
        });
      }

      const { data: updatedAdmin, error: updateError } = await supabaseAdmin
        .from("school_memberships")
        .update({
          status: "suspended",
          updated_at: new Date().toISOString(),
        })
        .eq("id", membership.id)
        .eq("school_listing_id", schoolId)
        .eq("role", "school_admin")
        .select(`
          id,
          full_name,
          email,
          role,
          status,
          user_id,
          accepted_at,
          created_at,
          updated_at
        `)
        .single();

     if (updateError || !updatedAdmin) {
  console.error("Deactivate school admin error:", updateError);

  return NextResponse.json(
    {
      error:
        updateError?.message ||
        "No administrator row was updated. Please try again.",
      details: updateError?.details || null,
      hint: updateError?.hint || null,
      code: updateError?.code || null,
    },
    { status: 500 }
  );
}

      return NextResponse.json({
        message: "School administrator access was deactivated.",
        admin: updatedAdmin,
      });
    }

    if (membership.status === "active") {
      return NextResponse.json(
        {
          error:
            "This administrator is already active. Deactivate them before re-inviting.",
        },
        { status: 409 }
      );
    }

    const { data: reInvitedAdmin, error: reInviteError } =
      await supabaseAdmin
        .from("school_memberships")
        .update({
          status: "invited",
          invited_by_user_id: access.userId,
          accepted_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", membership.id)
        .eq("school_listing_id", schoolId)
        .eq("role", "school_admin")
        .select(`
          id,
          full_name,
          email,
          role,
          status,
          user_id,
          accepted_at,
          created_at,
          updated_at
        `)
        .single();

    if (reInviteError || !reInvitedAdmin) {
      console.error("Re-invite school admin error:", reInviteError);

      return NextResponse.json(
        { error: "Could not re-invite this school administrator." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "School administrator access was re-invited.",
      admin: reInvitedAdmin,
    });
  } catch (error) {
    console.error("Unexpected update school admin error:", error);

    return NextResponse.json(
      { error: "Something went wrong while updating school administrator access." },
      { status: 500 }
    );
  }
}