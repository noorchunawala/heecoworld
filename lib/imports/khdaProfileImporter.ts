import { supabaseAdmin as supabase } from "@/lib/SupabaseAdmin";

function normalizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/l\.l\.c/g, "")
    .replace(/llc/g, "")
    .replace(/branch/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseGrades(raw?: string | null) {
  if (!raw) return [];

  const text = raw.trim();

  const gradeOrder = [
    "Pre-primary",
    "FS1",
    "FS2",
    "KG1",
    "KG2",
    "Year 1",
    "Year 2",
    "Year 3",
    "Year 4",
    "Year 5",
    "Year 6",
    "Year 7",
    "Year 8",
    "Year 9",
    "Year 10",
    "Year 11",
    "Year 12",
    "Year 13",
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "Grade 12",
    "Grade 13",
  ];

  function normalizeGrade(value: string) {
    const v = value.trim();

    if (/^FS\d+$/i.test(v)) return v.toUpperCase();
    if (/^KG\d+$/i.test(v)) return v.toUpperCase();
    if (/^Y\d+$/i.test(v)) return `Year ${v.replace(/Y/i, "")}`;
    if (/^G\d+$/i.test(v)) return `Grade ${v.replace(/G/i, "")}`;
    if (/^Grade\s*\d+$/i.test(v)) return `Grade ${v.match(/\d+/)?.[0]}`;
    if (/^Year\s*\d+$/i.test(v)) return `Year ${v.match(/\d+/)?.[0]}`;

    return v;
  }

  if (text.includes("-")) {
    const [startRaw, endRaw] = text.split("-");
    const start = normalizeGrade(startRaw);
    const end = normalizeGrade(endRaw);

    const startIndex = gradeOrder.indexOf(start);
    const endIndex = gradeOrder.indexOf(end);

    if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
      return gradeOrder.slice(startIndex, endIndex + 1);
    }
  }

  return text
    .split(/[,;/|]+/)
    .map((item) => normalizeGrade(item))
    .filter(Boolean);
}

function mapCurriculum(raw?: string | null) {
  if (!raw) return [];

  if (raw.toLowerCase() === "uk") return ["British"];

  return [raw];
}

export async function importKhdaSchoolProfile(input: {
  schoolName: string;
  curriculum?: string | null;
  grades?: string | null;
  rating?: string | null;
  principalName?: string | null;
  yearEstablished?: string | number | null;
  feeMin?: number | null;
  feeMax?: number | null;
}) {
  const normalizedInputName = normalizeName(input.schoolName);

  const { data: listings, error } = await supabase
    .from("listings")
    .select("id,name")
    .eq("emirate", "Dubai");

  if (error) throw error;

  const matchedListing = listings?.find(
    (listing) => normalizeName(listing.name) === normalizedInputName
  );

  if (!matchedListing) {
    throw new Error(`No matching listing found for ${input.schoolName}`);
  }

  const now = new Date().toISOString();

  const profilePayload = {
    listing_id: matchedListing.id,
    curricula: mapCurriculum(input.curriculum),
    grades: parseGrades(input.grades),
    fee_min: input.feeMin,
    fee_max: input.feeMax,
    rating: input.rating,
    gender: "Co-educational",
    priorities: [],
    facilities: [],
    updated_at: now,
  };

  const { data: existingProfile } = await supabase
    .from("school_profiles")
    .select("id")
    .eq("listing_id", matchedListing.id)
    .maybeSingle();

  if (existingProfile?.id) {
    const { error: updateError } = await supabase
      .from("school_profiles")
      .update(profilePayload)
      .eq("id", existingProfile.id);

    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabase
      .from("school_profiles")
      .insert(profilePayload);

    if (insertError) throw insertError;
  }

  const { data: existingDetails } = await supabase
    .from("school_profile_details")
    .select("id")
    .eq("listing_id", matchedListing.id)
    .maybeSingle();

  const detailsPayload = {
    principal_name: input.principalName,
    founded_year: input.yearEstablished ? String(input.yearEstablished) : null,
    authority: "KHDA",
    updated_at: now,
  };

  if (existingDetails?.id) {
    const { error: detailsUpdateError } = await supabase
      .from("school_profile_details")
      .update(detailsPayload)
      .eq("id", existingDetails.id);

    if (detailsUpdateError) throw detailsUpdateError;
  }

  return matchedListing.id;
}
export async function importKhdaSchoolFees(input: {
  listingId: string;
  academicYear: string;
  fees: {
    gradeName: string;
    fee: number;
    sortOrder: number;
  }[];
}) {
  const { error: deleteError } = await supabase
    .from("school_fees")
    .delete()
    .eq("listing_id", input.listingId)
    .eq("current_year", input.academicYear);

  if (deleteError) throw deleteError;

  if (input.fees.length === 0) return;

  const rows = input.fees.map((fee) => ({
    listing_id: input.listingId,
    grade_name: fee.gradeName,
    current_year: input.academicYear,
    current_fee: fee.fee,
    next_year: null,
    next_fee: null,
    notes: null,
    sort_order: fee.sortOrder,
  }));

  const { error: insertError } = await supabase
    .from("school_fees")
    .insert(rows);

  if (insertError) throw insertError;

  const feeValues = input.fees.map((item) => item.fee);

  const feeMin = Math.min(...feeValues);
  const feeMax = Math.max(...feeValues);

  const { error: profileError } = await supabase
    .from("school_profiles")
    .update({
      fee_min: feeMin,
      fee_max: feeMax,
      updated_at: new Date().toISOString(),
    })
    .eq("listing_id", input.listingId);

  if (profileError) throw profileError;
}

export async function importKhdaProfileAndFees(input: {
  schoolName: string;
  curriculum?: string | null;
  grades?: string | null;
  rating?: string | null;
  principalName?: string | null;
  yearEstablished?: string | number | null;
  academicYear: string;
  fees: {
    gradeName: string;
    fee: number;
    sortOrder: number;
  }[];
}) {
  const listingId = await importKhdaSchoolProfile({
    schoolName: input.schoolName,
    curriculum: input.curriculum,
    grades: input.grades,
    rating: input.rating,
    principalName: input.principalName,
    yearEstablished: input.yearEstablished,
    feeMin: input.fees.length
      ? Math.min(...input.fees.map((x) => x.fee))
      : null,
    feeMax: input.fees.length
      ? Math.max(...input.fees.map((x) => x.fee))
      : null,
  });

  await importKhdaSchoolFees({
    listingId,
    academicYear: input.academicYear,
    fees: input.fees,
  });

  return listingId;
}