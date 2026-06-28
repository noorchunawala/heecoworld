import { supabaseAdmin } from "@/lib/SupabaseAdmin";
import { getListingAnalytics } from "@/lib/listingAnalytics";
import ListingAnalyticsDemoClient from "./ListingAnalyticsDemoClient";

export default async function ListingAnalyticsDemoPage() {
  const { data: listing } = await supabaseAdmin
    .from("listings")
    .select("id, name, emirate")
    .limit(1)
    .single();

  if (!listing) {
    return <main>No listing found.</main>;
  }

  const analytics = await getListingAnalytics(listing.id);

  return (
    <ListingAnalyticsDemoClient
      listing={listing}
      analytics={analytics}
    />
  );
}