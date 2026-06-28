import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/SupabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

   const {
  listingId,
  eventType,
  metadata,
  sourcePage,
  referrer,
  sessionId,
  visitorId,
} = body;

    if (!listingId || !eventType) {
      return NextResponse.json(
        { success: false, error: "listingId and eventType are required." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("listing_analytics_events")
      .insert({
        listing_id: listingId,
        event_type: eventType,
        metadata: metadata || {},
        source_page: sourcePage || null,
        referrer: referrer || null,
        session_id: sessionId || null,
visitor_id: visitorId || null,
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Could not track event." },
      { status: 500 }
    );
  }
}