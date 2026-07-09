import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const IP_MAX_ATTEMPTS = 5;
const EMAIL_MAX_ATTEMPTS = 3;
const BLOCK_MINUTES = 5;

type IdentifierType = "ip" | "email";
type AuditStatus = "success" | "blocked" | "failed" | "error";

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function getUserAgent(request: NextRequest) {
  return request.headers.get("user-agent") || "unknown";
}

function genericSuccess() {
  return NextResponse.json({
    success: true,
    message: "If your email is valid, you'll receive a sign-in link shortly.",
  });
}

function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function writeAuditLog({
  supabase,
  action,
  status,
  identifier,
  identifierType,
  ip,
  userAgent,
  metadata = {},
}: {
  supabase: ReturnType<typeof createSupabaseClient>;
  action: string;
  status: AuditStatus;
  identifier?: string;
  identifierType?: IdentifierType;
  ip: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
}) {
  await supabase.from("security_audit_logs").insert({
    action,
    status,
    identifier,
    identifier_type: identifierType,
    ip_address: ip,
    user_agent: userAgent,
    metadata,
  });
}

async function checkRateLimit({
  supabase,
  identifier,
  identifierType,
  action,
  maxAttempts,
}: {
  supabase: ReturnType<typeof createSupabaseClient>;
  identifier: string;
  identifierType: IdentifierType;
  action: string;
  maxAttempts: number;
}) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

  const { data: existing, error } = await supabase
    .from("security_rate_limits")
    .select("*")
    .eq("identifier", identifier)
    .eq("identifier_type", identifierType)
    .eq("action", action)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (existing?.blocked_until) {
    const blockedUntil = new Date(existing.blocked_until);

    if (blockedUntil > now) {
      return {
        limited: true,
        reason: "blocked",
        blockedUntil,
      };
    }
  }

  if (!existing) {
    const { error: insertError } = await supabase
      .from("security_rate_limits")
      .insert({
        identifier,
        identifier_type: identifierType,
        action,
        attempts: 1,
        window_start: now.toISOString(),
        blocked_until: null,
      });

    if (insertError) {
      throw insertError;
    }

    return { limited: false };
  }

  const existingWindowStart = new Date(existing.window_start);

  if (existingWindowStart < windowStart) {
    const { error: resetError } = await supabase
      .from("security_rate_limits")
      .update({
        attempts: 1,
        window_start: now.toISOString(),
        blocked_until: null,
        updated_at: now.toISOString(),
      })
      .eq("id", existing.id);

    if (resetError) {
      throw resetError;
    }

    return { limited: false };
  }

  const nextAttempts = Number(existing.attempts || 0) + 1;

  if (nextAttempts > maxAttempts) {
    const blockedUntil = new Date(now.getTime() + BLOCK_MINUTES * 60 * 1000);

    const { error: blockError } = await supabase
      .from("security_rate_limits")
      .update({
        attempts: nextAttempts,
        blocked_until: blockedUntil.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", existing.id);

    if (blockError) {
      throw blockError;
    }

    return {
      limited: true,
      reason: "too_many_attempts",
      blockedUntil,
    };
  }

  const { error: updateError } = await supabase
    .from("security_rate_limits")
    .update({
      attempts: nextAttempts,
      updated_at: now.toISOString(),
    })
    .eq("id", existing.id);

  if (updateError) {
    throw updateError;
  }

  return { limited: false };
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseClient();
  const ip = getClientIp(request);
  const userAgent = getUserAgent(request);

  try {
    const { email, turnstileToken } = await request.json();

    const cleanEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!cleanEmail || !turnstileToken) {
      await writeAuditLog({
        supabase,
        action: "magic_link_request",
        status: "failed",
        identifier: cleanEmail || undefined,
        identifierType: cleanEmail ? "email" : undefined,
        ip,
        userAgent,
        metadata: { reason: "missing_email_or_turnstile" },
      });

      return NextResponse.json(
        { error: "Email and security verification are required." },
        { status: 400 }
      );
    }

    const ipLimit = await checkRateLimit({
      supabase,
      identifier: ip,
      identifierType: "ip",
      action: "magic_link",
      maxAttempts: IP_MAX_ATTEMPTS,
    });

    if (ipLimit.limited) {
      await writeAuditLog({
        supabase,
        action: "magic_link_request",
        status: "blocked",
        identifier: ip,
        identifierType: "ip",
        ip,
        userAgent,
        metadata: {
          reason: ipLimit.reason,
          blockedUntil: ipLimit.blockedUntil?.toISOString(),
        },
      });

      return NextResponse.json(
        { error: "Too many attempts. Please wait and try again." },
        { status: 429 }
      );
    }

    const emailLimit = await checkRateLimit({
      supabase,
      identifier: cleanEmail,
      identifierType: "email",
      action: "magic_link",
      maxAttempts: EMAIL_MAX_ATTEMPTS,
    });

    if (emailLimit.limited) {
      await writeAuditLog({
        supabase,
        action: "magic_link_request",
        status: "blocked",
        identifier: cleanEmail,
        identifierType: "email",
        ip,
        userAgent,
        metadata: {
          reason: emailLimit.reason,
          blockedUntil: emailLimit.blockedUntil?.toISOString(),
        },
      });

      return genericSuccess();
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;

    if (!secret) {
      console.error("Missing TURNSTILE_SECRET_KEY");

      await writeAuditLog({
        supabase,
        action: "magic_link_request",
        status: "error",
        identifier: cleanEmail,
        identifierType: "email",
        ip,
        userAgent,
        metadata: { reason: "missing_turnstile_secret" },
      });

      return NextResponse.json(
        { error: "Security verification is not configured." },
        { status: 500 }
      );
    }

    const verifyResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret,
          response: turnstileToken,
          remoteip: ip !== "unknown" ? ip : "",
        }),
      }
    );

    const verifyResult = await verifyResponse.json();

    if (!verifyResult.success) {
      await writeAuditLog({
        supabase,
        action: "turnstile_verification",
        status: "failed",
        identifier: cleanEmail,
        identifierType: "email",
        ip,
        userAgent,
        metadata: {
          errorCodes: verifyResult["error-codes"] || [],
        },
      });

      return NextResponse.json(
        { error: "Security verification failed. Please refresh and try again." },
        { status: 400 }
      );
    }

    const allowedHostnames = ["localhost", "127.0.0.1"];

    const productionHostnames = process.env.TURNSTILE_ALLOWED_HOSTNAMES
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (productionHostnames?.length) {
      allowedHostnames.push(...productionHostnames);
    }

    if (
      verifyResult.hostname &&
      !allowedHostnames.includes(verifyResult.hostname)
    ) {
      await writeAuditLog({
        supabase,
        action: "turnstile_verification",
        status: "failed",
        identifier: cleanEmail,
        identifierType: "email",
        ip,
        userAgent,
        metadata: {
          reason: "hostname_mismatch",
          receivedHostname: verifyResult.hostname,
          allowedHostnames,
        },
      });

      return NextResponse.json(
        { error: "Security verification failed for this domain." },
        { status: 400 }
      );
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/my-learning`,
        shouldCreateUser: true,
      },
    });

    if (error) {
      await writeAuditLog({
        supabase,
        action: "magic_link_request",
        status: "error",
        identifier: cleanEmail,
        identifierType: "email",
        ip,
        userAgent,
        metadata: {
          reason: "supabase_magic_link_error",
          message: error.message,
        },
      });

      return genericSuccess();
    }

    await writeAuditLog({
      supabase,
      action: "magic_link_request",
      status: "success",
      identifier: cleanEmail,
      identifierType: "email",
      ip,
      userAgent,
    });

    return genericSuccess();
  } catch (error) {
    console.error("Magic link route error:", error);

    await writeAuditLog({
      supabase,
      action: "magic_link_request",
      status: "error",
      ip,
      userAgent,
      metadata: {
        reason: "unexpected_error",
      },
    }).catch(() => null);

    return NextResponse.json(
      { error: "Could not process sign-in request." },
      { status: 500 }
    );
  }
}