import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

type RouteContext = {
  params: Promise<{ schoolId: string }>;
};

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  return authorization?.replace(/^Bearer\s+/i, "") || null;
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return "";

  return value.trim().toLowerCase();
}

function textOrNull(value: unknown) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed || null;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function getActiveSchoolAdmin(userId: string, schoolId: string) {
  const { data, error } = await supabaseAdmin
    .from("school_memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("school_listing_id", schoolId)
    .eq("role", "school_admin")
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function writeAuditLog({
  schoolId,
  actorUserId,
  action,
  entityId,
  beforeData,
  afterData,
}: {
  schoolId: string;
  actorUserId: string;
  action: string;
  entityId: string;
  beforeData?: unknown;
  afterData?: unknown;
}) {
  const { error } = await supabaseAdmin.from("school_audit_logs").insert({
    school_listing_id: schoolId,
    actor_user_id: actorUserId,
    entity_type: "school_membership",
    entity_id: entityId,
    action,
    before_data: beforeData || null,
    after_data: afterData || null,
  });

  if (error) {
    console.error("Teacher membership audit error:", error.message);
  }
}

async function getAuthenticatedUser(request: NextRequest) {
  const token = getBearerToken(request);

  if (!token) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Missing authentication token." },
        { status: 401 }
      ),
    };
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Invalid session." },
        { status: 401 }
      ),
    };
  }

  return { user, response: null };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await getAuthenticatedUser(request);

  if (!auth.user) {
    return auth.response;
  }

  const { schoolId } = await context.params;

  try {
    const schoolAdmin = await getActiveSchoolAdmin(auth.user.id, schoolId);

    if (!schoolAdmin) {
      return NextResponse.json(
        { error: "You do not have school-admin access for this school." },
        { status: 403 }
      );
    }

    const { data: teachers, error } = await supabaseAdmin
      .from("school_memberships")
      .select("id, email, full_name, status, user_id, created_at, accepted_at")
      .eq("school_listing_id", schoolId)
      .eq("role", "teacher")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      teachers: teachers || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load teachers.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await getAuthenticatedUser(request);

  if (!auth.user) {
    return auth.response;
  }

  const { schoolId } = await context.params;

  try {
    const schoolAdmin = await getActiveSchoolAdmin(auth.user.id, schoolId);

    if (!schoolAdmin) {
      return NextResponse.json(
        { error: "You do not have school-admin access for this school." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const email = normalizeEmail(body?.email);
    const fullName = textOrNull(body?.fullName);

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Enter a valid teacher email address." },
        { status: 400 }
      );
    }

    const { data: existingMembership, error: existingError } =
      await supabaseAdmin
        .from("school_memberships")
        .select("id, role, status, user_id, email, full_name")
        .eq("school_listing_id", schoolId)
        .eq("email", email)
        .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message },
        { status: 500 }
      );
    }

    if (existingMembership) {
      if (existingMembership.role !== "teacher") {
        return NextResponse.json(
          {
            error:
              "This email already has school-admin access for this school.",
          },
          { status: 409 }
        );
      }

      if (
        existingMembership.status === "active" ||
        existingMembership.status === "invited"
      ) {
        return NextResponse.json(
          { error: "This teacher has already been added." },
          { status: 409 }
        );
      }

      const { data: reactivatedTeacher, error: reactivateError } =
        await supabaseAdmin
          .from("school_memberships")
          .update({
            full_name: fullName || existingMembership.full_name,
            status: "invited",
            invited_by_user_id: auth.user.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingMembership.id)
          .eq("school_listing_id", schoolId)
          .eq("role", "teacher")
          .select("id, email, full_name, status, user_id, created_at, accepted_at")
          .single();

      if (reactivateError) {
        return NextResponse.json(
          { error: reactivateError.message },
          { status: 500 }
        );
      }

      await writeAuditLog({
        schoolId,
        actorUserId: auth.user.id,
        action: "teacher_reinvited",
        entityId: reactivatedTeacher.id,
        beforeData: existingMembership,
        afterData: reactivatedTeacher,
      });

      return NextResponse.json({
        ok: true,
        teacher: reactivatedTeacher,
        message: "Teacher invitation created again.",
      });
    }

    const { data: teacher, error: insertError } = await supabaseAdmin
      .from("school_memberships")
      .insert({
        school_listing_id: schoolId,
        email,
        full_name: fullName,
        role: "teacher",
        status: "invited",
        invited_by_user_id: auth.user.id,
      })
      .select("id, email, full_name, status, user_id, created_at, accepted_at")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    await writeAuditLog({
      schoolId,
      actorUserId: auth.user.id,
      action: "teacher_invited",
      entityId: teacher.id,
      afterData: teacher,
    });

    return NextResponse.json({
      ok: true,
      teacher,
      message: "Teacher invitation created.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not add teacher.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await getAuthenticatedUser(request);

  if (!auth.user) {
    return auth.response;
  }

  const { schoolId } = await context.params;

  try {
    const schoolAdmin = await getActiveSchoolAdmin(auth.user.id, schoolId);

    if (!schoolAdmin) {
      return NextResponse.json(
        { error: "You do not have school-admin access for this school." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const membershipId =
      typeof body?.membershipId === "string" ? body.membershipId.trim() : "";
    const action = typeof body?.action === "string" ? body.action : "";

    if (!membershipId || action !== "deactivate") {
      return NextResponse.json(
        { error: "Invalid teacher update request." },
        { status: 400 }
      );
    }

    const { data: existingTeacher, error: existingError } = await supabaseAdmin
      .from("school_memberships")
      .select("id, email, full_name, status, user_id")
      .eq("id", membershipId)
      .eq("school_listing_id", schoolId)
      .eq("role", "teacher")
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message },
        { status: 500 }
      );
    }

    if (!existingTeacher) {
      return NextResponse.json(
        { error: "Teacher was not found for this school." },
        { status: 404 }
      );
    }

    const { data: updatedTeacher, error: updateError } = await supabaseAdmin
      .from("school_memberships")
      .update({
        status: "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("id", membershipId)
      .eq("school_listing_id", schoolId)
      .eq("role", "teacher")
      .select("id, email, full_name, status, user_id, created_at, accepted_at")
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    await writeAuditLog({
      schoolId,
      actorUserId: auth.user.id,
      action: "teacher_deactivated",
      entityId: updatedTeacher.id,
      beforeData: existingTeacher,
      afterData: updatedTeacher,
    });

    return NextResponse.json({
      ok: true,
      teacher: updatedTeacher,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update teacher.",
      },
      { status: 500 }
    );
  }
}