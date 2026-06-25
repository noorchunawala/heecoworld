import { supabase } from "@/lib/SupabaseClient";

export async function getMyListingAdminAccess() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return [];

  const { data, error } = await supabase
    .from("listing_admin_users")
    .select("*")
    .eq("status", "active")
    .ilike("email", user.email);

  if (error) throw error;

  return data || [];
}