import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/db";
import { deliver, loadParts } from "@/lib/emails/deliver";
import { DEVICE_COOKIE, addTokens, deviceCookieOptions, parseTokens } from "@/lib/device";

export const dynamic = "force-dynamic";

function go(request: NextRequest, path: string, error?: string) {
  const url = new URL(path, request.url);
  if (error) url.searchParams.set("error", error);
  return NextResponse.redirect(url, { status: 303 });
}

/** Redirect to the confirmation page and remember this sign-up on the device. */
function confirmed(request: NextRequest, path: string, cancelToken: string) {
  const res = go(request, path);
  const existing = parseTokens(request.cookies.get(DEVICE_COOKIE)?.value);
  res.cookies.set(DEVICE_COOKIE, addTokens(existing, [cancelToken]), deviceCookieOptions);
  return res;
}

/** Public: a volunteer (or guardian) signs up for a shift. No login. */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const token = String(form.get("token") || "");
  const back = `/v/${token}`;
  if (!/^[a-f0-9]{8,16}$/i.test(token)) return go(request, "/", undefined);

  const admin = createAdminClient();
  if (!admin) return go(request, back, "Sign-ups aren't switched on yet.");

  const shiftId = String(form.get("shift_id") || "");
  const adult = String(form.get("adult") || "");
  const name = String(form.get("volunteer_name") || "").trim().replace(/\s+/g, " ");
  const phoneRaw = String(form.get("phone") || "").trim();
  const emailRaw = String(form.get("email") || "").trim().toLowerCase();
  const guardianName = String(form.get("guardian_name") || "").trim();
  const guardianPhoneRaw = String(form.get("guardian_phone") || "").trim();
  const consent = String(form.get("guardian_consent") || "") === "yes";

  if (!shiftId) return go(request, back, "Pick a shift.");
  if (name.length < 2) return go(request, back, "Enter the volunteer's name.");
  if (adult !== "yes" && adult !== "no") return go(request, back, "Tell us whether the volunteer is 18 or older.");

  const isMinor = adult === "no";
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  const guardianPhone = guardianPhoneRaw ? normalizePhone(guardianPhoneRaw) : null;
  const email = emailRaw && emailRaw.includes("@") ? emailRaw : null;

  if (!email) return go(request, back, isMinor ? "A parent or guardian's email is needed for the confirmation and reminders." : "An email address is needed for the confirmation and reminders.");
  if (phoneRaw && !phone) return go(request, back, "That mobile number doesn't look right. Use 10 digits, like 949 555 0100.");
  if (isMinor && !guardianName) return go(request, back, "A parent or guardian's name is required for volunteers under 18.");
  if (isMinor && guardianPhoneRaw && !guardianPhone) return go(request, back, "The guardian's mobile should be a 10-digit phone number, like 949 555 0100. The consent is the checkbox below.");
  if (isMinor && !consent) return go(request, back, "Please confirm you are the volunteer's parent or guardian.");

  // Event and shift must match the token, be open, and in the future.
  const { data: ev } = await admin.from("events").select("id,status,ends_at").eq("public_token", token).maybeSingle();
  if (!ev || ev.status === "cancelled" || new Date(ev.ends_at).getTime() < Date.now()) {
    return go(request, back, "This event isn't taking sign-ups.");
  }
  const { data: shift } = await admin.from("shifts").select("id,capacity").eq("id", shiftId).eq("event_id", ev.id).maybeSingle();
  if (!shift) return go(request, back, "That shift doesn't exist anymore.");

  // Same person, same shift: hand back the existing confirmation instead of a duplicate.
  // Both the name and the email must match, so knowing a name alone reveals nothing.
  const { data: dups } = await admin
    .from("signups")
    .select("cancel_token")
    .eq("shift_id", shift.id)
    .eq("status", "confirmed")
    .eq("email", email)
    .ilike("volunteer_name", name)
    .limit(1);
  const dup = dups?.[0];
  if (dup) return confirmed(request, `/v/${token}/done?c=${dup.cancel_token}&again=1`, dup.cancel_token);

  const { count } = await admin.from("signups").select("id", { count: "exact", head: true }).eq("shift_id", shift.id).eq("status", "confirmed");
  if ((count ?? 0) >= shift.capacity) return go(request, back, "That shift just filled up. Pick another if you can.");

  const { data: created, error } = await admin
    .from("signups")
    .insert({
      event_id: ev.id,
      shift_id: shift.id,
      volunteer_name: name,
      phone,
      email,
      is_minor: isMinor,
      guardian_name: isMinor ? guardianName : null,
      guardian_phone: isMinor ? guardianPhone : null,
    })
    .select("id,cancel_token")
    .single();
  if (error || !created) return go(request, back, "Something went wrong saving your sign-up. Try again.");

  // Confirmation email. A failure here never blocks the sign-up itself.
  const parts = await loadParts(admin, created.id);
  if (parts) await deliver(admin, "confirmation", parts);

  return confirmed(request, `/v/${token}/done?c=${created.cancel_token}`, created.cancel_token);
}
