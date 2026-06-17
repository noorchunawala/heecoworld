import { after, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resend } from "@/lib/resend";
import {
  buildParentConfirmationEmail,
  buildSchoolTourEmail,
} from "@/lib/emails";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type TourPayload = {
  school_ids: string[];
  school_names?: string[];
  parent_name: string;
  mobile: string;
  email?: string | null;
  child_grade?: string | null;
  preferred_date?: string | null;
  preferred_time?: string | null;
  message?: string | null;
  status?: string;
  otp_verified?: boolean;
};

function pickSchoolEmail(
  contacts: { type: string | null; label: string | null; value: string | null }[]
) {
  const emailContacts = contacts.filter(
    (contact) => contact.type === "email" && contact.value
  );

  const admissionsEmail = emailContacts.find((contact) =>
    (contact.label || "").toLowerCase().includes("admission")
  );

  return admissionsEmail?.value || emailContacts[0]?.value || null;
}

async function sendTourEmails(requestId: string, payload: TourPayload) {
  try {
    const { data: schools, error: schoolsError } = await supabase
      .from("listings")
      .select("id, name")
      .in("id", payload.school_ids);

    if (schoolsError) throw schoolsError;

    const { data: contacts, error: contactsError } = await supabase
      .from("school_contacts")
      .select("listing_id, type, label, value")
      .in("listing_id", payload.school_ids);

    if (contactsError) throw contactsError;

    const schoolEmails = (schools || [])
      .map((school) => {
        const schoolContacts = (contacts || []).filter(
          (contact) => contact.listing_id === school.id
        );

        return {
          schoolName: school.name,
          email: pickSchoolEmail(schoolContacts),
        };
      })
      .filter((item) => Boolean(item.email));

    if (schoolEmails.length === 0) {
      await supabase
        .from("tour_requests")
        .update({
          email_status: "failed",
          email_error: "No school email contacts found.",
        })
        .eq("id", requestId);

      return;
    }

    const emailTasks = [
      ...schoolEmails.map((school) =>
        resend.emails.send({
          from: "HeecoWorld <info@heecoworld.com>",
          to: school.email!,
          cc: "info@heecoworld.com",
          replyTo: payload.email || "info@heecoworld.com",
          subject: `New Parent Tour Request | ${school.schoolName} | HeecoWorld`,
          html: buildSchoolTourEmail({
            schoolName: school.schoolName,
            parentName: payload.parent_name,
            mobile: payload.mobile,
            email: payload.email,
            childGrade: payload.child_grade,
            preferredDate: payload.preferred_date,
            preferredTime: payload.preferred_time,
            message: payload.message,
          }),
        })
      ),
    ];

    if (payload.email) {
      emailTasks.push(
        resend.emails.send({
          from: "HeecoWorld <info@heecoworld.com>",
          to: payload.email,
          replyTo: "info@heecoworld.com",
          subject: "Your School Tour Request has been submitted | HeecoWorld",
          html: buildParentConfirmationEmail({
            parentName: payload.parent_name,
            schools: (schools || []).map((school) => school.name),
          }),
        })
      );
    }

    await Promise.all(emailTasks);

    await supabase
      .from("tour_requests")
      .update({
        email_status: "sent",
        email_sent_at: new Date().toISOString(),
        email_error: null,
      })
      .eq("id", requestId);
  } catch (error) {
    console.error("BOOK TOUR EMAIL ERROR:", error);

    await supabase
      .from("tour_requests")
      .update({
        email_status: "failed",
        email_error: error instanceof Error ? error.message : "Unknown error",
      })
      .eq("id", requestId);
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as TourPayload;

    if (!payload.school_ids || payload.school_ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "No schools selected." },
        { status: 400 }
      );
    }

    const { data: insertedRequest, error: insertError } = await supabase
      .from("tour_requests")
      .insert({
        ...payload,
        status: "new",
        email_status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("TOUR REQUEST INSERT ERROR:", insertError);

      return NextResponse.json(
        { success: false, message: insertError.message },
        { status: 500 }
      );
    }

    after(async () => {
      await sendTourEmails(insertedRequest.id, payload);
    });

    return NextResponse.json({
      success: true,
      requestId: insertedRequest.id,
    });
  } catch (error) {
    console.error("BOOK TOUR API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}