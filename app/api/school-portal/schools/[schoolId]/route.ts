import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

type RouteContext = {
  params: Promise<{ schoolId: string }>;
};

type JsonRecord = Record<string, unknown>;

class RequestError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  return authorization?.replace(/^Bearer\s+/i, "") || null;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textOrNull(value: unknown) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed || null;
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function textArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sortOrder(value: unknown, index: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return index + 1;
  }

  return Math.floor(parsed);
}

function booleanOrDefault(value: unknown, fallback = true) {
  return typeof value === "boolean" ? value : fallback;
}

function optionalRows(body: JsonRecord, key: string): JsonRecord[] | null {
  if (!(key in body)) return null;

  const value = body[key];

  if (!Array.isArray(value)) {
    throw new RequestError(`${key} must be an array.`);
  }

  return value.filter(isRecord);
}

function safeReportPath(value: unknown, schoolSlug: string) {
  const path = textOrNull(value);

  if (!path) return null;

  if (!path.startsWith(`${schoolSlug}/`)) {
    throw new RequestError("Invalid inspection report file path.");
  }

  return path;
}

async function getSchoolAdminAccess(userId: string, schoolId: string) {
  const { data, error } = await supabaseAdmin
    .from("school_memberships")
    .select("id, role")
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

async function replaceChildRows(
  tableName: string,
  schoolId: string,
  rows: JsonRecord[]
) {
  const table = supabaseAdmin.from(tableName) as any;

  const { error: deleteError } = await table
    .delete()
    .eq("listing_id", schoolId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (rows.length === 0) return;

  const { error: insertError } = await table.insert(rows);

  if (insertError) {
    throw new Error(insertError.message);
  }
}

async function getSchoolData(schoolId: string) {
  const [
    listingResult,
    profileResult,
    detailsResult,
    feesResult,
    availabilityResult,
    contactsResult,
    facilitiesResult,
    qaResult,
    inspectionReportsResult,
    parentGuidesResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("listings")
      .select("*")
      .eq("id", schoolId)
      .eq("type", "school")
      .single(),

    supabaseAdmin
      .from("school_profiles")
      .select("*")
      .eq("listing_id", schoolId)
      .maybeSingle(),

    supabaseAdmin
      .from("school_profile_details")
      .select("*")
      .eq("listing_id", schoolId)
      .maybeSingle(),

    supabaseAdmin
      .from("school_fees")
      .select("*")
      .eq("listing_id", schoolId)
      .order("sort_order", { ascending: true }),

    supabaseAdmin
      .from("school_availability")
      .select("*")
      .eq("listing_id", schoolId)
      .order("sort_order", { ascending: true }),

    supabaseAdmin
      .from("school_contacts")
      .select("*")
      .eq("listing_id", schoolId)
      .order("sort_order", { ascending: true }),

    supabaseAdmin
      .from("school_facilities")
      .select("*")
      .eq("listing_id", schoolId)
      .order("sort_order", { ascending: true }),

    supabaseAdmin
      .from("school_qa")
      .select("*")
      .eq("listing_id", schoolId)
      .order("sort_order", { ascending: true }),

    supabaseAdmin
      .from("school_inspection_reports")
      .select("*")
      .eq("listing_id", schoolId)
      .order("sort_order", { ascending: true }),

    supabaseAdmin
      .from("school_parent_guides")
      .select("*")
      .eq("listing_id", schoolId)
      .order("sort_order", { ascending: true }),
  ]);

  const error =
    listingResult.error ||
    profileResult.error ||
    detailsResult.error ||
    feesResult.error ||
    availabilityResult.error ||
    contactsResult.error ||
    facilitiesResult.error ||
    qaResult.error ||
    inspectionReportsResult.error ||
    parentGuidesResult.error;

  if (error) {
    throw new Error(error.message);
  }

  return {
    listing: listingResult.data,
    profile: profileResult.data,
    details: detailsResult.data,
    fees: feesResult.data || [],
    availability: availabilityResult.data || [],
    contacts: contactsResult.data || [],
    facilities: facilitiesResult.data || [],
    qa: qaResult.data || [],
    inspectionReports: inspectionReportsResult.data || [],
    parentGuides: parentGuidesResult.data || [],
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
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

  const { schoolId } = await context.params;

  try {
    const membership = await getSchoolAdminAccess(user.id, schoolId);

    if (!membership) {
      return NextResponse.json(
        { error: "You do not have school-admin access for this school." },
        { status: 403 }
      );
    }

    const school = await getSchoolData(schoolId);

    return NextResponse.json(school);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load school profile.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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

  const { schoolId } = await context.params;

  try {
    const membership = await getSchoolAdminAccess(user.id, schoolId);

    if (!membership) {
      return NextResponse.json(
        { error: "You do not have school-admin access for this school." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);

    if (!isRecord(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const before = await getSchoolData(schoolId);

    const listingInput = isRecord(body.listing) ? body.listing : {};
    const profileInput = isRecord(body.profile) ? body.profile : {};
    const detailsInput = isRecord(body.details) ? body.details : {};

    const listingPayload: JsonRecord = {};

    if ("name" in listingInput) {
      const name = textOrNull(listingInput.name);

      if (!name) {
        return NextResponse.json(
          { error: "School name is required." },
          { status: 400 }
        );
      }

      listingPayload.name = name;
    }

    if ("emirate" in listingInput) {
      listingPayload.emirate = textOrNull(listingInput.emirate);
    }

    if ("area" in listingInput) {
      listingPayload.area = textOrNull(listingInput.area);
    }

    if ("address" in listingInput) {
      listingPayload.address = textOrNull(listingInput.address);
    }

    if ("phone" in listingInput) {
      listingPayload.phone = textOrNull(listingInput.phone);
    }

    if ("email" in listingInput) {
      listingPayload.email = textOrNull(listingInput.email);
    }

    if ("website" in listingInput) {
      listingPayload.website = textOrNull(listingInput.website);
    }

    if ("short_description" in listingInput) {
      listingPayload.short_description = textOrNull(
        listingInput.short_description
      );
    }

    const profilePayload: JsonRecord = {
      listing_id: schoolId,
    };

    const profileTextFields = ["rating", "gender"];

    for (const field of profileTextFields) {
      if (field in profileInput) {
        profilePayload[field] = textOrNull(profileInput[field]);
      }
    }

    const profileNumberFields = ["fee_min", "fee_max"];

    for (const field of profileNumberFields) {
      if (field in profileInput) {
        profilePayload[field] = numberOrNull(profileInput[field]);
      }
    }

    const profileArrayFields = [
      "curricula",
      "grades",
      "priorities",
      "facilities",
    ];

    for (const field of profileArrayFields) {
      if (field in profileInput) {
        profilePayload[field] = textArray(profileInput[field]);
      }
    }

    const detailsPayload: JsonRecord = {
      listing_id: schoolId,
      updated_at: new Date().toISOString(),
    };

    const detailTextFields = [
      "description",
      "school_type",
      "school_phase",
      "founded_year",
      "authority",
      "inspection_rating",
      "wellbeing_rating",
      "inclusion_rating",
      "last_inspection_year",
      "opening_year",
      "teacher_turnover",
      "principal_name",
      "owner_name",
      "community",
      "main_teacher_nationality",
      "application_fee",
      "registration_fee",
      "transport_fee_note",
      "admission_notes",
    ];

    for (const field of detailTextFields) {
      if (field in detailsInput) {
        detailsPayload[field] = textOrNull(detailsInput[field]);
      }
    }

    const detailArrayFields = [
      "academics_highlights",
      "admissions_requirements",
      "admissions_process",
      "visit_checklist",
      "reasons",
    ];

    for (const field of detailArrayFields) {
      if (field in detailsInput) {
        detailsPayload[field] = textArray(detailsInput[field]);
      }
    }

    if (Object.keys(listingPayload).length > 0) {
      const { error: listingError } = await supabaseAdmin
        .from("listings")
        .update(listingPayload)
        .eq("id", schoolId)
        .eq("type", "school");

      if (listingError) {
        throw new Error(listingError.message);
      }
    }

    if (Object.keys(profilePayload).length > 1) {
      const { error: profileError } = await supabaseAdmin
        .from("school_profiles")
        .upsert(profilePayload, { onConflict: "listing_id" });

      if (profileError) {
        throw new Error(profileError.message);
      }
    }

    if (Object.keys(detailsPayload).length > 2) {
      const { error: detailsError } = await supabaseAdmin
        .from("school_profile_details")
        .upsert(detailsPayload, { onConflict: "listing_id" });

      if (detailsError) {
        throw new Error(detailsError.message);
      }
    }

    const feesInput = optionalRows(body, "fees");

    if (feesInput) {
      const fees = feesInput
        .map((row, index) => {
          const gradeName = textOrNull(row.grade_name);

          if (!gradeName) return null;

          return {
            listing_id: schoolId,
            grade_name: gradeName,
            current_year: textOrNull(row.current_year),
            current_fee: numberOrNull(row.current_fee),
            next_year: textOrNull(row.next_year),
            next_fee: numberOrNull(row.next_fee),
            notes: textOrNull(row.notes),
            sort_order: sortOrder(row.sort_order, index),
          };
        })
        .filter(Boolean) as JsonRecord[];

      await replaceChildRows("school_fees", schoolId, fees);
    }

    const availabilityInput = optionalRows(body, "availability");

    if (availabilityInput) {
      const availability = availabilityInput
        .map((row, index) => {
          const gradeName = textOrNull(row.grade_name);

          if (!gradeName) return null;

          return {
            listing_id: schoolId,
            grade_name: gradeName,
            academic_year: textOrNull(row.academic_year),
            status: textOrNull(row.status) || "Not updated",
            notes: textOrNull(row.notes),
            sort_order: sortOrder(row.sort_order, index),
          };
        })
        .filter(Boolean) as JsonRecord[];

      await replaceChildRows("school_availability", schoolId, availability);
    }

    const contactsInput = optionalRows(body, "contacts");

    if (contactsInput) {
      const allowedContactTypes = new Set([
        "email",
        "phone",
        "website",
        "whatsapp",
        "other",
      ]);

      const contacts = contactsInput
        .map((row, index) => {
          const value = textOrNull(row.value);

          if (!value) return null;

          const requestedType = textOrNull(row.type) || "other";

          return {
            listing_id: schoolId,
            type: allowedContactTypes.has(requestedType)
              ? requestedType
              : "other",
            label: textOrNull(row.label),
            value,
            href: textOrNull(row.href),
            sort_order: sortOrder(row.sort_order, index),
          };
        })
        .filter(Boolean) as JsonRecord[];

      await replaceChildRows("school_contacts", schoolId, contacts);
    }

    const facilitiesInput = optionalRows(body, "facilities");

    if (facilitiesInput) {
      const facilities = facilitiesInput
        .map((row, index) => {
          const facilityName = textOrNull(row.facility_name);

          if (!facilityName) return null;

          return {
            listing_id: schoolId,
            facility_name: facilityName,
            facility_type: textOrNull(row.facility_type),
            is_available: booleanOrDefault(row.is_available, true),
            notes: textOrNull(row.notes),
            sort_order: sortOrder(row.sort_order, index),
          };
        })
        .filter(Boolean) as JsonRecord[];

      await replaceChildRows("school_facilities", schoolId, facilities);
    }

    const qaInput = optionalRows(body, "qa");

    if (qaInput) {
      const qa = qaInput
        .map((row, index) => {
          const question = textOrNull(row.question);

          if (!question) return null;

          return {
            listing_id: schoolId,
            question,
            answer: textOrNull(row.answer),
            sort_order: sortOrder(row.sort_order, index),
          };
        })
        .filter(Boolean) as JsonRecord[];

      await replaceChildRows("school_qa", schoolId, qa);
    }

    const inspectionReportsInput = optionalRows(body, "inspectionReports");

    if (inspectionReportsInput) {
      const schoolSlug = before.listing?.slug || "";

      const inspectionReports = inspectionReportsInput
        .map((row, index) => {
          const academicYear = textOrNull(row.academic_year);

          if (!academicYear) return null;

          return {
            listing_id: schoolId,
            academic_year: academicYear,
            overall_rating: textOrNull(row.overall_rating),
            inspection_authority: textOrNull(row.inspection_authority),
            report_file_name: textOrNull(row.report_file_name),
            report_pdf_path: safeReportPath(
              row.report_pdf_path,
              schoolSlug
            ),
            notes: textOrNull(row.notes),
            sort_order: sortOrder(row.sort_order, index),
          };
        })
        .filter(Boolean) as JsonRecord[];

      await replaceChildRows(
        "school_inspection_reports",
        schoolId,
        inspectionReports
      );
    }

    const parentGuidesInput = optionalRows(body, "parentGuides");

    if (parentGuidesInput) {
      const parentGuides = parentGuidesInput
        .map((row, index) => {
          const title = textOrNull(row.title);

          if (!title) return null;

          return {
            listing_id: schoolId,
            title,
            items: textArray(row.items),
            sort_order: sortOrder(row.sort_order, index),
          };
        })
        .filter(Boolean) as JsonRecord[];

      await replaceChildRows(
        "school_parent_guides",
        schoolId,
        parentGuides
      );
    }

    const after = await getSchoolData(schoolId);

    const { error: auditError } = await supabaseAdmin
      .from("school_audit_logs")
      .insert({
        school_listing_id: schoolId,
        actor_user_id: user.id,
        entity_type: "school_profile",
        entity_id: schoolId,
        action: "updated_by_school_admin",
        before_data: before,
        after_data: after,
      });

    if (auditError) {
      console.error("School profile audit log error:", auditError.message);
    }

    return NextResponse.json({
      ok: true,
      school: after,
    });
  } catch (error) {
    const status = error instanceof RequestError ? error.status : 500;

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update school profile.",
      },
      { status }
    );
  }
}