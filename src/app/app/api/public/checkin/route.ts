import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Shift, Signup } from "@/lib/db";
import { canSelfCheckIn, canSelfCheckOut } from "@/lib/attendance";
import { DEVICE_COOKIE, parseTokens } from "@/lib/device";

export const dynamic = "force-dynamic";

/** Public: a volunteer checks themselves in or out from a recognized device. */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const token = String(form.get("token") || "");
  const signupId = String(form.get("signup_id") || "");
  const action = String(form.get("action") || "");
  if (!/^[a-f0-9]{8,16}$/i.test(token)) return NextResponse.redirect(new URL("/", request.url), { status: 303 });
  const page = `/v/${token}/checkin`;
  const to = (query: string) => NextResponse.redirect(new URL(`${page}${query}`, request.url), { status: 303 });

  const admin = createAdminClient();
  if (!admin) return to("?error=" + encodeURIComponent("Check-in isn't switched on yet."));

  const { data: s } = await admin.from("signups").select("*").eq("id", signupId).eq("status", "confirmed").maybeSingle();
  const signup = s as Signup | null;
  const tokens = parseTokens(request.cookies.get(DEVICE_COOKIE)?.value);
  // The device must hold this sign-up's private token.
  if (!signup || !tokens.includes(signup.cancel_token)) return to("?notfound=1");

  const [{ data: ev }, { data: sh }] = await Promise.all([
    admin.from("events").select("id,status,public_token").eq("id", signup.event_id).single(),
    admin.from("shifts").select("*").eq("id", signup.shift_id).single(),
  ]);
  const shift = sh as Shift | null;
  if (!ev || !shift || ev.public_token !== token || ev.status === "cancelled") return to("?notfound=1");

  const now = new Date().toISOString();
  if (action === "in") {
    if (signup.checked_in_at) return to("?ok=in");
    if (!canSelfCheckIn(shift)) return to("?error=" + encodeURIComponent("Check-in for this shift isn't open right now. Find the coordinator if you're here."));
    await admin.from("signups").update({ checked_in_at: now }).eq("id", signup.id);
    return to("?ok=in");
  }
  if (action === "out") {
    if (!signup.checked_in_at) return to("?error=" + encodeURIComponent("Check in first."));
    if (signup.checked_out_at) return to("?ok=out");
    // A second tap right after checking in is almost always a double-tap, not a departure.
    if (Date.now() - new Date(signup.checked_in_at).getTime() < 60 * 1000) return to("?ok=in");
    // Past the grace period the shift has already closed itself at its end time.
    if (canSelfCheckOut(shift)) await admin.from("signups").update({ checked_out_at: now }).eq("id", signup.id);
    return to("?ok=out");
  }
  return to("");
}
