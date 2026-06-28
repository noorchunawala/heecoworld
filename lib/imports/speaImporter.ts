import { supabaseAdmin as supabase } from "@/lib/SupabaseAdmin";
import { NormalizedSpeaListing } from "@/lib/imports/speaNormalizer";

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
  type: "phone" | "email";
  label: string;
  value: string;
  href: string;
}) {
  const { data: existing } = await supabase
    .from("contacts")
    .select("id")
    .eq("listing_id", input.listingId)
    .eq("type", input.type)
    .eq("label", input.label)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from("contacts").update({
      value: input.value,
      href: input.href,
    }).eq("id", existing.id);
    return;
  }

  await supabase.from("contacts").insert({
    listing_id: input.listingId,
    type: input.type,
    label: input.label,
    value: input.value,
    href: input.href,
  });
}

export async function importSpeaListing(item: NormalizedSpeaListing) {
  const now = new Date().toISOString();

  const listingPayload = {
    name: item.name,
    slug: `${slugify(item.name)}-${item.dataSourceId}`,
    type: "school",
    emirate: "Sharjah",
    area: item.area,
    phone:item.phone,
    email:item.email,
    address:item.area,
    data_source: item.dataSource,
    data_source_id: item.dataSourceId,
    data_last_synced: now,
  };

  const { data: existingListing } = await supabase
    .from("listings")
    .select("id")
    .eq("data_source", item.dataSource)
    .eq("data_source_id", item.dataSourceId)
    .maybeSingle();

  let listingId: string;

  if (existingListing?.id) {
    const { data, error } = await supabase
      .from("listings")
      .update(listingPayload)
      .eq("id", existingListing.id)
      .select("id")
      .single();

    if (error) throw error;
    listingId = data.id;
  } else {
    const { data, error } = await supabase
      .from("listings")
      .insert(listingPayload)
      .select("id")
      .single();

    if (error) throw error;
    listingId = data.id;
  }

  const profilePayload = {
    listing_id: listingId,
    curricula: item.curricula,
    grades: item.grades,
    fee_min: null,
    fee_max: null,
    rating: item.rating,
    gender: "Co-educational",
    priorities: [],
    facilities: [],
    updated_at: now,
  };

  const { data: existingProfile } = await supabase
    .from("school_profiles")
    .select("id")
    .eq("listing_id", listingId)
    .maybeSingle();

  if (existingProfile?.id) {
    const { error } = await supabase
      .from("school_profiles")
      .update(profilePayload)
      .eq("id", existingProfile.id);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("school_profiles")
      .insert(profilePayload);

    if (error) throw error;
  }

  const detailsPayload = {
    listing_id: listingId,
    authority: "SPEA",
    founded_year: item.establishedOn,
    data_source: item.dataSource,
    data_source_id: item.dataSourceId,
    data_last_synced: now,
    updated_at: now,
  };

  const { data: existingDetails } = await supabase
    .from("school_profile_details")
    .select("id")
    .eq("listing_id", listingId)
    .maybeSingle();

  if (existingDetails?.id) {
    const { error } = await supabase
      .from("school_profile_details")
      .update(detailsPayload)
      .eq("id", existingDetails.id);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("school_profile_details")
      .insert(detailsPayload);

    if (error) throw error;
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

  if (item.phone) {
    await upsertContact({
      listingId,
      type: "phone",
      label: "Phone",
      value: item.phone,
      href: `tel:${item.phone}`,
    });
  }

  return listingId;
}