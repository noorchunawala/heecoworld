import { supabase } from "@/lib/SupabaseClient";

export async function getApprovedReviews(schoolId: string) {
  const { data, error } = await supabase
    .from("school_reviews")
    .select("*")
    .eq("school_id", schoolId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function submitSchoolReview(input: {
  userId: string;
  schoolId: string;
  reviewerType: "parent" | "student" | "alumni";
  rating: number;
  title: string;
  reviewText: string;
  academicsRating: number;
teachersRating: number;
facilitiesRating: number;
communicationRating: number;
valueRating: number;
reviewerName: string;
}) {
  const { error } = await supabase.from("school_reviews").upsert(
    {
      user_id: input.userId,
      school_id: input.schoolId,
      reviewer_type: input.reviewerType,
      rating: input.rating,
      title: input.title.trim(),
      review_text: input.reviewText.trim(),
      status: "pending",
      updated_at: new Date().toISOString(),
      academics_rating: input.academicsRating,
teachers_rating: input.teachersRating,
facilities_rating: input.facilitiesRating,
communication_rating: input.communicationRating,
value_rating: input.valueRating,
reviewer_name: input.reviewerName,
    },
    { onConflict: "user_id,school_id" }
  );

  if (error) throw error;
}