import { supabase } from "@/lib/SupabaseClient";

export async function isLoginRequired(featureKey: string) {
     
  const { data } = await supabase
    .from("feature_access_settings")
    .select("login_required")
    .eq("feature_key", featureKey)
    .maybeSingle();

  return data?.login_required ?? false;
}