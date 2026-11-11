import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/db";
import { DEVICE_COOKIE, addTokens, deviceCookieOptions, parseTokens } from "@/lib/device";

export const dynamic = "force-dynamic";

/**
 * Public: "find my sign-up" on a phone that didn't make it. The volunteer types
 * the email or mobile they signed up with; matching sign-ups for this event are
 * linked to this device so check-in works.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const token = String(form.get("token") || "");
  const who = String(form.get("who") || "").trim();
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url), { status: 303 });
  if (!/^[a-f0-9]{8,16}$/i.test(token)) return to("/");
  const page = `/v/${token}/checkin`;

  const admin = createAdminClient();
  if (!admin || who.length < 5) return to(`${page}?notfound=1`);

  const { data: ev } = await admin.from("events").select("id").eq("public_token", token).maybeSingle();
  if (!ev) return to("/");

  const base = () => admin.from("signups").select("cancel_token").eq("event_id", ev.id).eq("status", "confirmed");
  const found: string[] = [];
  if (who.includes("@")) {
    const { data } = await base().eq("email", who.toLowerCase());
    for (const r of data ?? []) found.push(r.cancel_token);
  } else {
    const phone = normalizePhone(who);
    if (phone) {
      const [{ data: a }, { data: b }] = await Promise.all([base().eq("phone", phone), base().eq("guardian_phone", phone)]);
      for (const r of [...(a ?? []), ...(b ?? [])]) if (!found.includes(r.cancel_token)) found.push(r.cancel_token);
    }
  }
  if (found.length === 0) return to(`${page}?notfound=1`);

  const res = to(page);
  const existing = parseTokens(request.cookies.get(DEVICE_COOKIE)?.value);
  res.cookies.set(DEVICE_COOKIE, addTokens(existing, found), deviceCookieOptions);
  return res;
}
