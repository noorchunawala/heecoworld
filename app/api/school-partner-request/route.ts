import { after, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resend } from "@/lib/resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type PartnerPayload = {
  schoolName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  role?: string;
  emirate?: string;
  message?: string;
};

function buildPartnerEmail(payload: PartnerPayload) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f8f1e7;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:white;border-radius:20px;overflow:hidden;">
        <div style="background:#071B33;padding:24px;">
          <h1 style="color:white;margin:0;">HeecoWorld</h1>
          <p style="color:#D6B46A;margin:8px 0 0;">New School Partner Request</p>
        </div>
        <div style="padding:24px;color:#071B33;">
          <p><strong>School:</strong> ${payload.schoolName}</p>
          <p><strong>Contact Person:</strong> ${payload.contactPerson}</p>
          <p><strong>Email:</strong> ${payload.email}</p>
          <p><strong>Phone:</strong> ${payload.phone || "Not provided"}</p>
          <p><strong>Role:</strong> ${payload.role || "Not provided"}</p>
          <p><strong>Emirate:</strong> ${payload.emirate || "Not provided"}</p>
          <p><strong>Message:</strong></p>
          <p>${payload.message || "No message provided."}</p>
        </div>
      </div>
    </div>
  `;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as PartnerPayload;

    if (!payload.schoolName || !payload.contactPerson || !payload.email) {
      return NextResponse.json(
        { success: false, message: "Missing required fields." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("school_partner_requests")
      .insert({
        school_name: payload.schoolName,
        contact_person: payload.contactPerson,
        email: payload.email,
        phone: payload.phone || null,
        role: payload.role || null,
        emirate: payload.emirate || null,
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
          from: "Scoolyx <info@scoolyx.com>",
          to: "info@scoolyx.com",
          replyTo: payload.email,
          subject: `New School Partner Request | ${payload.schoolName} | Scoolyx`,
          html: buildPartnerEmail(payload),
        });

        await supabase
          .from("school_partner_requests")
          .update({
            email_status: "sent",
            email_sent_at: new Date().toISOString(),
            email_error: null,
          })
          .eq("id", data.id);
      } catch (emailError) {
        await supabase
          .from("school_partner_requests")
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
    console.error("PARTNER REQUEST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}