import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEVICE_COOKIE, addTokens, deviceCookieOptions, parseTokens } from "@/lib/device";

export const dynamic = "force-dynamic";

/**
 * The check-in link from the "find my sign-up" email. Opening it connects this
 * phone to every sign-up made with the same email for the same event, then
 * shows the check-in page. The link carries the sign-up's private token, the
 * same one already in that person's confirmation email.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ cancelToken: string }> }) {
  const { cancelToken } = await params;
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url), { status: 303 });
  if (!/^[a-f0-9]{16,64}$/i.test(cancelToken)) return to("/");

  const admin = createAdminClient();
  if (!admin) return to("/");

  const { data: s } = await admin.from("signups").select("event_id,email,cancel_token").eq("cancel_token", cancelToken).maybeSingle();
  if (!s) return to("/");
  const { data: ev } = await admin.from("events").select("public_token").eq("id", s.event_id).maybeSingle();
  if (!ev) return to("/");

  const tokens = [s.cancel_token as string];
  if (s.email) {
    const { data: rest } = await admin.from("signups").select("cancel_token").eq("event_id", s.event_id).eq("status", "confirmed").eq("email", s.email);
    for (const r of rest ?? []) if (!tokens.includes(r.cancel_token)) tokens.push(r.cancel_token);
  }

  const res = to(`/v/${ev.public_token}/checkin`);
  res.cookies.set(DEVICE_COOKIE, addTokens(parseTokens(request.cookies.get(DEVICE_COOKIE)?.value), tokens), deviceCookieOptions);
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("Cache-Control", "no-store");
  return res;
}
