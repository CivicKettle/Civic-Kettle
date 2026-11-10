import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/db";

export const dynamic = "force-dynamic";

function go(request: NextRequest, path: string, error?: string) {
  const url = new URL(path, request.url);
  if (error) url.searchParams.set("error", error);
  return NextResponse.redirect(url, { status: 303 });
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

  if (!isMinor && !phoneRaw) return go(request, back, "A mobile number is needed for the reminder.");
  if (phoneRaw && !phone) return go(request, back, "That mobile number doesn't look right. Use 10 digits, like 949 555 0100.");
  if (isMinor && !guardianName) return go(request, back, "A parent or guardian's name is required for volunteers under 18.");
  if (isMinor && !guardianPhoneRaw) return go(request, back, "A parent or guardian's mobile number is required for volunteers under 18.");
  if (isMinor && !guardianPhone) return go(request, back, "The guardian's mobile should be a 10-digit phone number, like 949 555 0100. The consent is the checkbox below.");
  if (isMinor && !consent) return go(request, back, "Please confirm you are the volunteer's parent or guardian.");

  // Event and shift must match the token, be open, and in the future.
  const { data: ev } = await admin.from("events").select("id,status,ends_at").eq("public_token", token).maybeSingle();
  if (!ev || ev.status === "cancelled" || new Date(ev.ends_at).getTime() < Date.now()) {
    return go(request, back, "This event isn't taking sign-ups.");
  }
  const { data: shift } = await admin.from("shifts").select("id,capacity").eq("id", shiftId).eq("event_id", ev.id).maybeSingle();
  if (!shift) return go(request, back, "That shift doesn't exist anymore.");

  // Same person, same shift: hand back the existing confirmation instead of a duplicate.
  const contact = isMinor ? guardianPhone : phone;
  const { data: dup } = await admin
    .from("signups")
    .select("cancel_token")
    .eq("shift_id", shift.id)
    .eq("status", "confirmed")
    .ilike("volunteer_name", name)
    .maybeSingle();
  if (dup) return go(request, `/v/${token}/done?c=${dup.cancel_token}&again=1`);

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
    .select("cancel_token")
    .single();
  if (error || !created) return go(request, back, "Something went wrong saving your sign-up. Try again.");

  void contact; // reserved for the confirmation message (email/text) step
  return go(request, `/v/${token}/done?c=${created.cancel_token}`);
}
