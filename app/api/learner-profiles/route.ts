import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";
import {
  getAllowedCurriculumCodes,
  type GlobalCurriculumCode,
} from "@/lib/assessmentCurriculumMatching";

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  return token || null;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const cleaned = cleanText(value);
  return cleaned || null;
}
function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isBeforeNow(date: Date) {
  return date.getTime() <= Date.now();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET(request: NextRequest) {
  try {
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

    if (userError || !user?.id) {
      return NextResponse.json(
        { error: "Your session is invalid. Please sign in again." },
        { status: 401 }
      );
    }

    const { data: account, error: accountError } = await supabaseAdmin
      .from("user_profiles")
      .select("id, full_name, email, user_type, is_profile_complete")
      .eq("id", user.id)
      .maybeSingle();

    if (accountError) {
      console.error("Learner account lookup error:", accountError);

      return NextResponse.json(
        { error: "Could not load your learning profile." },
        { status: 500 }
      );
    }

    if (!account?.is_profile_complete) {
      return NextResponse.json(
        { error: "Complete your profile before opening My Learning." },
        { status: 403 }
      );
    }

    if (account.user_type !== "parent" && account.user_type !== "student") {
      return NextResponse.json(
        { error: "My Learning is available for parent and student accounts." },
        { status: 403 }
      );
    }

    const { data: learners, error: learnersError } = await supabaseAdmin
      .from("learner_profiles")
      .select(`
        id,
        full_name,
        relationship,
        curriculum_id,
        curriculum_level_id,
        grade,
        section,
        academic_year,
        verification_status,
        status,
        created_at,
        school_listing_id,
        listings!learner_profiles_school_listing_id_fkey (
          id,
          name,
          emirate,
          area
        )
      `)
      .eq("account_user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: true });

    if (learnersError) {
      console.error("Learner profile list error:", learnersError);

      return NextResponse.json(
        { error: "Could not load your learners." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      account: {
        fullName: account.full_name,
        userType: account.user_type,
      },
      learners: learners || [],
    });
  } catch (error) {
    console.error("Unexpected learner profile list error:", error);

    return NextResponse.json(
      { error: "Something went wrong while loading My Learning." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    if (userError || !user?.id) {
      return NextResponse.json(
        { error: "Your session is invalid. Please sign in again." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);

    const fullName = cleanText(body?.fullName);
    const schoolListingId = cleanText(body?.schoolListingId);
    const curriculumId = cleanText(body?.curriculumId);
    const curriculumLevelId = cleanText(body?.curriculumLevelId);

    const section = optionalText(body?.section);
    const academicYear = optionalText(body?.academicYear);
    const schoolRegisteredEmail = optionalText(
      body?.schoolRegisteredEmail
    )?.toLowerCase();

    if (!fullName) {
      return NextResponse.json(
        { error: "Enter the child’s full name." },
        { status: 400 }
      );
    }

    if (!schoolListingId) {
      return NextResponse.json(
        { error: "Select the child’s school." },
        { status: 400 }
      );
    }

    if (!curriculumId) {
      return NextResponse.json(
        { error: "Select the child’s curriculum." },
        { status: 400 }
      );
    }

    if (!curriculumLevelId) {
      return NextResponse.json(
        { error: "Select the child’s academic level." },
        { status: 400 }
      );
    }

    if (
      schoolRegisteredEmail &&
      !isValidEmail(schoolRegisteredEmail)
    ) {
      return NextResponse.json(
        { error: "Enter a valid school email address." },
        { status: 400 }
      );
    }

    const { data: account, error: accountError } = await supabaseAdmin
      .from("user_profiles")
      .select("id, user_type, is_profile_complete")
      .eq("id", user.id)
      .maybeSingle();

    if (accountError) {
      console.error("Parent account lookup error:", accountError);

      return NextResponse.json(
        { error: "Could not verify your account." },
        { status: 500 }
      );
    }

    if (!account?.is_profile_complete) {
      return NextResponse.json(
        { error: "Complete your profile before adding a child." },
        { status: 403 }
      );
    }

    if (account.user_type !== "parent") {
      return NextResponse.json(
        { error: "Only parent accounts can add another child." },
        { status: 403 }
      );
    }

    const [
      schoolResult,
      schoolProfileResult,
      curriculumResult,
      curriculumLevelResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("listings")
        .select("id, name")
        .eq("id", schoolListingId)
        .eq("type", "school")
        .eq("status", "active")
        .maybeSingle(),

      supabaseAdmin
        .from("school_profiles")
        .select("curricula")
        .eq("listing_id", schoolListingId)
        .maybeSingle(),

      supabaseAdmin
        .from("curricula")
        .select("id, code, display_name")
        .eq("id", curriculumId)
        .eq("is_active", true)
        .maybeSingle(),

      supabaseAdmin
        .from("curriculum_levels")
        .select("id, curriculum_id, code, display_name")
        .eq("id", curriculumLevelId)
        .eq("curriculum_id", curriculumId)
        .eq("is_active", true)
        .maybeSingle(),
    ]);

    if (schoolResult.error) {
      console.error("Add child school validation error:", schoolResult.error);

      return NextResponse.json(
        { error: "Could not verify the selected school." },
        { status: 500 }
      );
    }

    if (!schoolResult.data) {
      return NextResponse.json(
        { error: "Select a valid active school." },
        { status: 400 }
      );
    }

    if (schoolProfileResult.error) {
      console.error(
        "Add child school profile lookup error:",
        schoolProfileResult.error
      );

      return NextResponse.json(
        { error: "Could not load this school's curriculum details." },
        { status: 500 }
      );
    }

    if (curriculumResult.error || curriculumLevelResult.error) {
      console.error(
        "Add child curriculum validation error:",
        curriculumResult.error || curriculumLevelResult.error
      );

      return NextResponse.json(
        { error: "Could not validate the selected curriculum and level." },
        { status: 500 }
      );
    }

    const school = schoolResult.data;
    const curriculum = curriculumResult.data;
    const curriculumLevel = curriculumLevelResult.data;

    if (!curriculum || !curriculumLevel) {
      return NextResponse.json(
        {
          error:
            "Select a valid curriculum and academic level from the available options.",
        },
        { status: 400 }
      );
    }

    const allowedCurriculumCodes = getAllowedCurriculumCodes(
      schoolProfileResult.data?.curricula
    );

    if (allowedCurriculumCodes.size === 0) {
      return NextResponse.json(
        {
          error:
            "Assessment curriculum options are not available for this school yet.",
        },
        { status: 422 }
      );
    }

    if (
      !allowedCurriculumCodes.has(
        curriculum.code as GlobalCurriculumCode
      )
    ) {
      return NextResponse.json(
        {
          error:
            "This curriculum is not available for the selected school.",
        },
        { status: 400 }
      );
    }
    const now = new Date().toISOString();

    const { data: learner, error: learnerError } = await supabaseAdmin
      .from("learner_profiles")
      .insert({
        account_user_id: user.id,
        relationship: "child",
        full_name: fullName,
        school_listing_id: school.id,
        curriculum_id: curriculum.id,
        curriculum_level_id: curriculumLevel.id,

        // Compatibility with current My Learning display.
        grade: curriculumLevel.display_name,

        section,
        academic_year: academicYear,
        school_registered_email: schoolRegisteredEmail,
        verification_status: "self_declared",
        status: "active",
        school_assigned_at: now,
school_last_changed_at: now,
      })
      .select(`
        id,
        full_name,
        relationship,
        curriculum_id,
        curriculum_level_id,
        grade,
        section,
        academic_year,
        verification_status,
        status,
        created_at,
        school_listing_id,
        listings!learner_profiles_school_listing_id_fkey (
          id,
          name,
          emirate,
          area
        )
      `)
      .single();

    if (learnerError || !learner) {
      console.error("Add learner error:", learnerError);

      return NextResponse.json(
        { error: "Could not add this child. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Child added successfully.",
        learner,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected add learner error:", error);

    return NextResponse.json(
      { error: "Something went wrong while adding this child." },
      { status: 500 }
    );
  }
}
export async function PATCH(request: NextRequest) {
  try {
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

    if (userError || !user?.id) {
      return NextResponse.json(
        { error: "Your session is invalid. Please sign in again." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);

    const learnerId = cleanText(body?.learnerId);
    const fullName = cleanText(body?.fullName);
    const schoolListingId = cleanText(body?.schoolListingId);
    const curriculumId = cleanText(body?.curriculumId);
    const curriculumLevelId = cleanText(body?.curriculumLevelId);

    const section = optionalText(body?.section);
    const academicYear = optionalText(body?.academicYear);
    const schoolRegisteredEmail = optionalText(
      body?.schoolRegisteredEmail
    )?.toLowerCase();

    if (!learnerId) {
      return NextResponse.json(
        { error: "Learner profile is missing." },
        { status: 400 }
      );
    }

    if (!fullName) {
      return NextResponse.json(
        { error: "Enter the learner’s full name." },
        { status: 400 }
      );
    }

    if (
      schoolRegisteredEmail &&
      !isValidEmail(schoolRegisteredEmail)
    ) {
      return NextResponse.json(
        { error: "Enter a valid school email address." },
        { status: 400 }
      );
    }

    const { data: learner, error: learnerError } = await supabaseAdmin
      .from("learner_profiles")
      .select(`
        id,
        account_user_id,
        full_name,
        school_listing_id,
        curriculum_id,
        curriculum_level_id,
        school_assigned_at,
        school_last_changed_at,
         created_at,
        status
      `)
      .eq("id", learnerId)
      .eq("account_user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (learnerError) {
      console.error("Learner edit lookup error:", learnerError);

      return NextResponse.json(
        { error: "Could not load this learner profile." },
        { status: 500 }
      );
    }

    if (!learner) {
      return NextResponse.json(
        { error: "Learner profile not found." },
        { status: 404 }
      );
    }

    const wantsSchoolGradeChange =
      Boolean(schoolListingId) &&
      Boolean(curriculumId) &&
      Boolean(curriculumLevelId) &&
      (
        schoolListingId !== learner.school_listing_id ||
        curriculumId !== learner.curriculum_id ||
        curriculumLevelId !== learner.curriculum_level_id
      );

    const lastChangeValue =
  learner.school_last_changed_at ??
  learner.school_assigned_at ??
  learner.created_at;

    const lockUntil = lastChangeValue
      ? addDays(new Date(lastChangeValue), 90)
      : null;

    if (
      wantsSchoolGradeChange &&
      lockUntil &&
      !isBeforeNow(lockUntil)
    ) {
      return NextResponse.json(
        {
          error: `School, curriculum and academic level can be changed again on ${lockUntil.toLocaleDateString(
            "en-GB",
            {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }
          )}.`,
          lockedUntil: lockUntil.toISOString(),
        },
        { status: 423 }
      );
    }

    const updatePayload: Record<string, unknown> = {
      full_name: fullName,
      section,
      academic_year: academicYear,
      school_registered_email: schoolRegisteredEmail,
    };

    if (wantsSchoolGradeChange) {
      if (!schoolListingId) {
        return NextResponse.json(
          { error: "Select the learner’s school." },
          { status: 400 }
        );
      }

      if (!curriculumId) {
        return NextResponse.json(
          { error: "Select the learner’s curriculum." },
          { status: 400 }
        );
      }

      if (!curriculumLevelId) {
        return NextResponse.json(
          { error: "Select the learner’s academic level." },
          { status: 400 }
        );
      }

      const [
        schoolResult,
        schoolProfileResult,
        curriculumResult,
        curriculumLevelResult,
      ] = await Promise.all([
        supabaseAdmin
          .from("listings")
          .select("id, name")
          .eq("id", schoolListingId)
          .eq("type", "school")
          .eq("status", "active")
          .maybeSingle(),

        supabaseAdmin
          .from("school_profiles")
          .select("curricula")
          .eq("listing_id", schoolListingId)
          .maybeSingle(),

        supabaseAdmin
          .from("curricula")
          .select("id, code, display_name")
          .eq("id", curriculumId)
          .eq("is_active", true)
          .maybeSingle(),

        supabaseAdmin
          .from("curriculum_levels")
          .select("id, curriculum_id, code, display_name")
          .eq("id", curriculumLevelId)
          .eq("curriculum_id", curriculumId)
          .eq("is_active", true)
          .maybeSingle(),
      ]);

      if (schoolResult.error || schoolProfileResult.error) {
        console.error(
          "Edit learner school validation error:",
          schoolResult.error || schoolProfileResult.error
        );

        return NextResponse.json(
          { error: "Could not verify the selected school." },
          { status: 500 }
        );
      }

      if (curriculumResult.error || curriculumLevelResult.error) {
        console.error(
          "Edit learner curriculum validation error:",
          curriculumResult.error || curriculumLevelResult.error
        );

        return NextResponse.json(
          { error: "Could not validate the selected curriculum and level." },
          { status: 500 }
        );
      }

      const school = schoolResult.data;
      const curriculum = curriculumResult.data;
      const curriculumLevel = curriculumLevelResult.data;

      if (!school) {
        return NextResponse.json(
          { error: "Select a valid active school." },
          { status: 400 }
        );
      }

      if (!curriculum || !curriculumLevel) {
        return NextResponse.json(
          {
            error:
              "Select a valid curriculum and academic level from the available options.",
          },
          { status: 400 }
        );
      }

      const allowedCurriculumCodes = getAllowedCurriculumCodes(
        schoolProfileResult.data?.curricula
      );

      if (allowedCurriculumCodes.size === 0) {
        return NextResponse.json(
          {
            error:
              "Assessment curriculum options are not available for this school yet.",
          },
          { status: 422 }
        );
      }

      if (
        !allowedCurriculumCodes.has(
          curriculum.code as GlobalCurriculumCode
        )
      ) {
        return NextResponse.json(
          {
            error:
              "This curriculum is not available for the selected school.",
          },
          { status: 400 }
        );
      }

      updatePayload.school_listing_id = school.id;
      updatePayload.curriculum_id = curriculum.id;
      updatePayload.curriculum_level_id = curriculumLevel.id;
      updatePayload.grade = curriculumLevel.display_name;
      updatePayload.school_last_changed_at = new Date().toISOString();

      if (!learner.school_assigned_at) {
        updatePayload.school_assigned_at = new Date().toISOString();
      }
    }

    const { data: updatedLearner, error: updateError } = await supabaseAdmin
      .from("learner_profiles")
      .update(updatePayload)
      .eq("id", learner.id)
      .eq("account_user_id", user.id)
      .select(`
        id,
        full_name,
        relationship,
        curriculum_id,
        curriculum_level_id,
        grade,
        section,
        academic_year,
        verification_status,
        status,
        created_at,
        school_listing_id,
        listings!learner_profiles_school_listing_id_fkey (
          id,
          name,
          emirate,
          area
        )
      `)
      .single();

    if (updateError || !updatedLearner) {
      console.error("Update learner error:", updateError);

      return NextResponse.json(
        { error: "Could not update this learner profile." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Learner profile updated successfully.",
      learner: updatedLearner,
    });
  } catch (error) {
    console.error("Unexpected update learner error:", error);

    return NextResponse.json(
      { error: "Something went wrong while updating this learner." },
      { status: 500 }
    );
  }
}