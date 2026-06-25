import { supabaseAdmin as supabase } from "@/lib/SupabaseAdmin";
import { NormalizedKhdaListing } from "@/lib/imports/khdaNormalizer";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function upsertContact(input: {
  listingId: string;
  type: "phone" | "email" | "website" | "whatsapp" | "other";
  label: string;
  value: string;
  href: string;
}) {
  const { data: existing } = await supabase
    .from("school_contacts")
    .select("id")
    .eq("listing_id", input.listingId)
    .eq("type", input.type)
    .eq("label", input.label)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("school_contacts")
      .update({
        value: input.value,
        href: input.href,
      })
      .eq("id", existing.id);

    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("school_contacts").insert({
    listing_id: input.listingId,
    type: input.type,
    label: input.label,
    value: input.value,
    href: input.href,
  });

  if (error) throw error;
}

async function upsertInspectionReport(input: {
  listingId: string;
  academicYear: string;
  overallRating?: string | null;
  reportUrl?: string | null;
  schoolName: string;
}) {
  const { data: existing } = await supabase
    .from("school_inspection_reports")
    .select("id")
    .eq("listing_id", input.listingId)
    .eq("academic_year", input.academicYear)
    .maybeSingle();

  const payload = {
    listing_id: input.listingId,
    academic_year: input.academicYear,
    overall_rating: input.overallRating || null,
    inspection_authority: "KHDA",
    report_pdf_path: input.reportUrl || null,
    report_file_name: input.reportUrl
      ? `${input.schoolName} KHDA Inspection Report`
      : null,
    notes: null,
  };

  if (existing?.id) {
    const { error } = await supabase
      .from("school_inspection_reports")
      .update(payload)
      .eq("id", existing.id);

    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("school_inspection_reports")
    .insert(payload);

  if (error) throw error;
}

export async function importKhdaListing(item: NormalizedKhdaListing) {
  const now = new Date().toISOString();

  const listingPayload = {
    name: item.name,
    slug: `${slugify(item.name)}-${item.dataSourceId}`,
    type: item.category,
    emirate: item.emirate,
    area: item.area,
    phone:item.phone,
    address: item.area,
    email:item.email,
    website:item.website,
    source_url:item.website,
    inspection_rating:item.inspectionRating,
    data_source: item.dataSource,
    data_source_id: item.dataSourceId,
    data_last_synced: now,
  };

  const { data: existingListing, error: lookupError } = await supabase
    .from("listings")
    .select("id")
    .eq("data_source", item.dataSource)
    .eq("data_source_id", item.dataSourceId)
    .maybeSingle();

  if (lookupError) throw lookupError;

  let listingId: string;

  if (existingListing?.id) {
    const { data: updatedListing, error: updateError } = await supabase
      .from("listings")
      .update(listingPayload)
      .eq("id", existingListing.id)
      .select("id")
      .single();

    if (updateError) throw updateError;
    listingId = updatedListing.id;
  } else {
    const { data: insertedListing, error: insertError } = await supabase
      .from("listings")
      .insert(listingPayload)
      .select("id")
      .single();

    if (insertError) throw insertError;
    listingId = insertedListing.id;
  }

  const profilePayload = {
    listing_id: listingId,
    hero_image_url: item.heroImageUrl,
    school_type:"Private School",
    inspection_rating: item.inspectionRating,
    last_inspection_year: item.inspectionYear,
    founded_year: item.establishedOn,
    authority: "KHDA",
    data_source: item.dataSource,
    data_source_id: item.dataSourceId,
    data_last_synced: now,
    updated_at: now,
  };

  const { data: existingProfile, error: profileLookupError } = await supabase
    .from("school_profile_details")
    .select("id")
    .eq("listing_id", listingId)
    .maybeSingle();

  if (profileLookupError) throw profileLookupError;

  if (existingProfile?.id) {
    const { error } = await supabase
      .from("school_profile_details")
      .update(profilePayload)
      .eq("id", existingProfile.id);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("school_profile_details")
      .insert(profilePayload);

    if (error) throw error;
  }

  if (item.phone) {
    await upsertContact({
      listingId,
      type: "phone",
      label: "Phone",
      value: item.phone,
      href: `tel:${item.phone}`,
    });
  }

  if (item.mobile) {
    await upsertContact({
      listingId,
      type: "phone",
      label: "Mobile",
      value: item.mobile,
      href: `tel:${item.mobile}`,
    });
  }

  if (item.email) {
    await upsertContact({
      listingId,
      type: "email",
      label: "Email",
      value: item.email,
      href: `mailto:${item.email}`,
    });
  }

  if (item.website) {
    await upsertContact({
      listingId,
      type: "website",
      label: "Website",
      value: item.website,
      href: item.website,
    });
  }

  if (item.inspectionYear || item.inspectionReportUrl) {
    await upsertInspectionReport({
      listingId,
      academicYear: item.inspectionYear || "Latest",
      overallRating: item.inspectionRating,
      reportUrl: item.inspectionReportUrl,
      schoolName: item.name,
    });
  }

  return listingId;
}