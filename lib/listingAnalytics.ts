import { supabaseAdmin } from "@/lib/SupabaseAdmin";

export async function getListingAnalytics(listingId: string) {
  const { data: events, error } = await supabaseAdmin
    .from("listing_analytics_events")
    .select("event_type, created_at, metadata")
    .eq("listing_id", listingId);

  if (error) throw error;

  const rows = events || [];

  const count = (type: string) =>
    rows.filter((event) => event.event_type === type).length;

  const today = new Date();
 const last7Days: {
  day: string;
  date: string;
  views: number;
}[] = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    const key = date.toISOString().slice(0, 10);

    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      date: key,
      views: rows.filter(
        (event) =>
          event.event_type === "profile_view" &&
          event.created_at?.startsWith(key)
      ).length,
    };
  });

  const recentActivity = rows
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 10)
    .map((event) => ({
      eventType: event.event_type,
      createdAt: event.created_at,
      schoolName: event.metadata?.schoolName || "this listing",
    }));
const comparedWithCounts = new Map<string, number>();

rows
  .filter((event) => event.event_type === "comparison_completed")
  .forEach((event) => {
    const names = event.metadata?.comparedSchoolNames || [];

    names.forEach((name: string) => {
      comparedWithCounts.set(name, (comparedWithCounts.get(name) || 0) + 1);
    });
  });

const comparedSchools = Array.from(comparedWithCounts.entries())
  .map(([name, count]) => ({ name, count }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 5);

  return {
    stats: {
      profileViews: count("profile_view"),
      shortlisted: count("shortlist_added"),
      compared: count("compare_added"),
      tourInterest: count("tour_interest"),
      reviews: count("review_submitted"),
      heecoMatch: count("heeco_match_result"),
    },

    clicks: {
      phone: count("phone_click"),
      email: count("email_click"),
      map: count("map_click"),
      website: count("website_click"),
    },

    weeklyViews: last7Days,
    recentActivity,
    comparedSchools
  };
}