import { after, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resend } from "@/lib/resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Payload = {
  listingId: string;
  schoolName: string;
  parentName: string;
  email: string;
  mobile: string;
  childGrade?: string;
  preferredDate: string;
  preferredSlot: string;
  preferredPlatform: string;
  message?: string;
};

function tomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Payload;

    if (
      !payload.listingId ||
      !payload.parentName ||
      !payload.email ||
      !payload.mobile ||
      !payload.preferredDate ||
      !payload.preferredSlot ||
      !payload.preferredPlatform
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required fields." },
        { status: 400 }
      );
    }

    if (payload.preferredDate < tomorrowDate()) {
      return NextResponse.json(
        { success: false, message: "Please select a future date." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("admissions_consultation_requests")
      .insert({
        listing_id: payload.listingId,
        school_name: payload.schoolName,
        parent_name: payload.parentName,
        email: payload.email,
        mobile: payload.mobile,
        child_grade: payload.childGrade || null,
        preferred_date: payload.preferredDate,
        preferred_slot: payload.preferredSlot,
        preferred_platform: payload.preferredPlatform,
        message: payload.message || null,
        status: "new",
        email_status: "pending",
      })
      .select("id")
      .single();

    if (error) throw error;

    after(async () => {
      try {
        await resend.emails.send({
          from: "HeecoWorld <info@heecoworld.com>",
          to: "info@heecoworld.com",
          replyTo: payload.email,
          subject: `Admissions Consultation Request | ${payload.schoolName} | HeecoWorld`,
          html: `
            <h2>New Admissions Consultation Request</h2>
            <p><b>School:</b> ${payload.schoolName}</p>
            <p><b>Parent:</b> ${payload.parentName}</p>
            <p><b>Email:</b> ${payload.email}</p>
            <p><b>Mobile:</b> ${payload.mobile}</p>
            <p><b>Child Grade:</b> ${payload.childGrade || "Not provided"}</p>
            <p><b>Preferred Date:</b> ${payload.preferredDate}</p>
            <p><b>Preferred Slot:</b> ${payload.preferredSlot}</p>
            <p><b>Preferred Platform:</b> ${payload.preferredPlatform}</p>
            <p><b>Message:</b> ${payload.message || "No message"}</p>
          `,
        });

        await supabase
          .from("admissions_consultation_requests")
          .update({
            email_status: "sent",
            email_sent_at: new Date().toISOString(),
            email_error: null,
          })
          .eq("id", data.id);
      } catch (emailError) {
        await supabase
          .from("admissions_consultation_requests")
          .update({
            email_status: "failed",
            email_error:
              emailError instanceof Error ? emailError.message : "Unknown error",
          })
          .eq("id", data.id);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}