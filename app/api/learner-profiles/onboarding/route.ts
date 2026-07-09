import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";
import {
  getAllowedCurriculumCodes,
  type GlobalCurriculumCode,
} from "@/lib/assessmentCurriculumMatching";

type UserType = "parent" | "student";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const cleaned = cleanText(value);
  return cleaned || null;
}


function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function requireAuthenticatedUser(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "").trim();

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

  if (error || !user?.id || !user.email) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Your session is invalid. Please sign in again." },
        { status: 401 }
      ),
    };
  }

  return {
    user,
    response: null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser(request);

    if (!auth.user) {
      return auth.response!;
    }

    const accountEmail = auth.user.email?.trim().toLowerCase() || "";

    if (!accountEmail) {
      return NextResponse.json(
        { error: "Your account does not have a valid email address." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);

    const fullName = cleanText(body?.fullName);
    const mobile = cleanText(body?.mobile);

    const userType: UserType | null =
      body?.userType === "parent" || body?.userType === "student"
        ? body.userType
        : null;

    const learnerFullName = cleanText(body?.learnerFullName);
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
        { error: "Please enter your full name." },
        { status: 400 }
      );
    }

    if (!mobile) {
      return NextResponse.json(
        { error: "Please enter your mobile number." },
        { status: 400 }
      );
    }

    if (!userType) {
      return NextResponse.json(
        { error: "Please select Parent / Guardian or Student." },
        { status: 400 }
      );
    }

    if (!learnerFullName) {
      return NextResponse.json(
        {
          error:
            userType === "parent"
              ? "Please enter your child's full name."
              : "Please enter the student's full name.",
        },
        { status: 400 }
      );
    }

    if (!schoolListingId) {
      return NextResponse.json(
        { error: "Please select a school." },
        { status: 400 }
      );
    }

    if (!curriculumId) {
      return NextResponse.json(
        { error: "Please select the learner's curriculum." },
        { status: 400 }
      );
    }

    if (!curriculumLevelId) {
      return NextResponse.json(
        { error: "Please select the learner's academic level." },
        { status: 400 }
      );
    }

    if (
      schoolRegisteredEmail &&
      !isValidEmail(schoolRegisteredEmail)
    ) {
      return NextResponse.json(
        { error: "Please enter a valid school-registered email." },
        { status: 400 }
      );
    }

    const [
      schoolResult,
      schoolProfileResult,
      curriculumResult,
      levelResult,
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
      console.error("Learner onboarding school lookup error:", schoolResult.error);

      return NextResponse.json(
        { error: "Could not verify the selected school." },
        { status: 500 }
      );
    }

    if (!schoolResult.data) {
      return NextResponse.json(
        { error: "The selected school is not available." },
        { status: 400 }
      );
    }

    if (schoolProfileResult.error) {
      console.error(
        "Learner onboarding school profile lookup error:",
        schoolProfileResult.error
      );

      return NextResponse.json(
        { error: "Could not load this school's curriculum details." },
        { status: 500 }
      );
    }

    if (curriculumResult.error || levelResult.error) {
      console.error(
        "Learner onboarding curriculum validation error:",
        curriculumResult.error || levelResult.error
      );

      return NextResponse.json(
        { error: "Could not validate the selected curriculum and level." },
        { status: 500 }
      );
    }

    const school = schoolResult.data;
    const curriculum = curriculumResult.data;
    const curriculumLevel = levelResult.data;

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

    const { data: existingAccountProfile, error: accountProfileError } =
      await supabaseAdmin
        .from("user_profiles")
        .select("id, is_profile_complete")
        .eq("id", auth.user.id)
        .maybeSingle();

    if (accountProfileError) {
      console.error(
        "Learner onboarding account-profile lookup error:",
        accountProfileError
      );

      return NextResponse.json(
        { error: "Could not verify your profile." },
        { status: 500 }
      );
    }

    if (existingAccountProfile?.is_profile_complete) {
      return NextResponse.json(
        { error: "Your profile is already complete." },
        { status: 409 }
      );
    }

    const { error: draftProfileError } = await supabaseAdmin
      .from("user_profiles")
      .upsert(
        {
          id: auth.user.id,
          full_name: fullName,
          email: accountEmail,
          user_type: userType,
          mobile,
          country_code: "+971",
          is_profile_complete: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (draftProfileError) {
      console.error(
        "Learner onboarding draft account-profile save error:",
        draftProfileError
      );

      return NextResponse.json(
        { error: draftProfileError.message },
        { status: 500 }
      );
    }

    const relationship = userType === "parent" ? "child" : "self";

    const { data: existingLearner, error: existingLearnerError } =
      await supabaseAdmin
        .from("learner_profiles")
        .select("id, school_assigned_at")
        .eq("account_user_id", auth.user.id)
        .eq("relationship", relationship)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (existingLearnerError) {
      console.error(
        "Learner onboarding learner lookup error:",
        existingLearnerError
      );

      return NextResponse.json(
        { error: "Could not prepare the learner profile." },
        { status: 500 }
      );
    }

    const learnerPayload = {
      full_name: learnerFullName,
      school_listing_id: school.id,
      curriculum_id: curriculum.id,
      curriculum_level_id: curriculumLevel.id,

      // Temporary compatibility for old learner screens.
      grade: curriculumLevel.display_name,

      section,
      academic_year: academicYear,
      school_registered_email: schoolRegisteredEmail,
      verification_status: "self_declared",
      status: "active",
      updated_at: new Date().toISOString(),
    };

    let learner;
    

    if (existingLearner) {
const now = new Date().toISOString();
      const updatePayload = {
  ...learnerPayload,
  school_assigned_at:
    existingLearner.school_assigned_at ?? now,
  school_last_changed_at: now,
};
      const { data, error } = await supabaseAdmin
        .from("learner_profiles")
        .update(updatePayload)
        .eq("id", existingLearner.id)
        .eq("account_user_id", auth.user.id)
        .select(
          "id, full_name, relationship, school_listing_id, curriculum_id, curriculum_level_id, grade, section, academic_year, verification_status, status"
        )
        .single();

      if (error || !data) {
        console.error("Learner onboarding update error:", error);

        return NextResponse.json(
          { error: "Could not save the learner profile." },
          { status: 500 }
        );
      }

      learner = data;
    } else {
      const now = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from("learner_profiles")
        .insert({
          account_user_id: auth.user.id,
          relationship,
          ...learnerPayload,
          school_assigned_at: now,
school_last_changed_at: now,
        })
        .select(
          "id, full_name, relationship, school_listing_id, curriculum_id, curriculum_level_id, grade, section, academic_year, verification_status, status"
        )
        .single();

      if (error || !data) {
        console.error("Learner onboarding insert error:", error);

        return NextResponse.json(
          { error: "Could not create the learner profile." },
          { status: 500 }
        );
      }

      learner = data;
    }

    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .upsert(
        {
          id: auth.user.id,
          full_name: fullName,
          email: accountEmail,
          user_type: userType,
          mobile,
          country_code: "+971",
          is_profile_complete: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.error("Learner onboarding account-profile save error:", profileError);

      return NextResponse.json(
        {
          error:
            "Your learner was saved, but your account profile could not be completed. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Profile completed successfully.",
      learner,
      school: {
        id: school.id,
        name: school.name,
      },
      curriculum: {
        id: curriculum.id,
        code: curriculum.code,
        displayName: curriculum.display_name,
      },
      academicLevel: {
        id: curriculumLevel.id,
        code: curriculumLevel.code,
        displayName: curriculumLevel.display_name,
      },
    });
  } catch (error) {
    console.error("Unexpected learner onboarding error:", error);

    return NextResponse.json(
      { error: "Something went wrong while completing your profile." },
      { status: 500 }
    );
  }
}