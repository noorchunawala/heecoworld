import { supabase } from "@/lib/SupabaseClient";

export async function getFavoriteSchoolIds(userId: string) {
  const { data, error } = await supabase
    .from("favorite_schools")
    .select("school_id")
    .eq("user_id", userId);

  if (error) throw error;

  return data.map((item) => item.school_id);
}

export async function addFavoriteSchool(userId: string, schoolId: string) {
  const { error } = await supabase.from("favorite_schools").insert({
    user_id: userId,
    school_id: schoolId,
  });

  if (error && error.code !== "23505") throw error;
}

export async function removeFavoriteSchool(userId: string, schoolId: string) {
  const { error } = await supabase
    .from("favorite_schools")
    .delete()
    .eq("user_id", userId)
    .eq("school_id", schoolId);

  if (error) throw error;
}