import { NextResponse, type NextRequest } from "next/server";
import type { Shift, Signup } from "@/lib/db";
import { deliver, loadParts } from "@/lib/emails/deliver";
import { createAdminClient } from "@/lib/supabase/admin";
import { promoteShift } from "@/lib/waitlist";

export const dynamic = "force-dynamic";

const TOKEN = /^[a-f0-9]{16,64}$/i;

/** Public: a volunteer moves their sign-up to another shift of the same event. */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const cancelToken = String(form.get("cancel_token") || "");
  const mine = String(form.get("mine") || "");
  const shiftId = String(form.get("shift_id") || "");
  const home = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  if (!TOKEN.test(cancelToken) || !TOKEN.test(mine)) return home;
  const back = (params: Record<string, string>) => {
    const url = new URL(`/v/mine/${mine}`, request.url);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return NextResponse.redirect(url, { status: 303 });
  };

  const admin = createAdminClient();
  if (!admin) return home;
  if (!shiftId) return back({ error: "Pick the shift you want to move to." });

  const { data: s } = await admin.from("signups").select("*").eq("cancel_token", cancelToken).eq("status", "confirmed").maybeSingle();
  if (!s) return back({ error: "That sign-up isn't active anymore." });
  const signup = s as Signup;
  if (signup.checked_in_at) return back({ error: "You've already checked in for that shift, so it can't be moved." });
  if (signup.shift_id === shiftId) return back({ error: "You're already on that shift." });

  const [{ data: ev }, { data: target }] = await Promise.all([
    admin.from("events").select("id,status").eq("id", signup.event_id).maybeSingle(),
    admin.from("shifts").select("*").eq("id", shiftId).eq("event_id", signup.event_id).maybeSingle(),
  ]);
  if (!ev || ev.status === "cancelled") return back({ error: "This event isn't taking changes." });
  if (!target || new Date((target as Shift).ends_at).getTime() < Date.now()) return back({ error: "That shift isn't available anymore." });

  // Same person already on the target shift? (same name and email)
  const { data: dups } = await admin
    .from("signups")
    .select("id")
    .eq("shift_id", shiftId)
    .eq("status", "confirmed")
    .eq("email", signup.email ?? "")
    .ilike("volunteer_name", signup.volunteer_name)
    .limit(1);
  if (dups && dups.length > 0) return back({ error: "You're already signed up for that shift." });

  const { count } = await admin.from("signups").select("id", { count: "exact", head: true }).eq("shift_id", shiftId).eq("status", "confirmed");
  if ((count ?? 0) >= (target as Shift).capacity) return back({ error: "That shift just filled up. Pick another if you can." });

  const { error } = await admin.from("signups").update({ shift_id: shiftId }).eq("id", signup.id).eq("status", "confirmed");
  if (error) return back({ error: "Something went wrong moving your sign-up. Try again." });

  // The earlier confirmation and reminders were for the old shift: clear the
  // record so a fresh confirmation goes now and reminders follow the new time.
  await admin.from("messages").delete().eq("signup_id", signup.id).in("kind", ["confirmation", "day_before", "morning_of"]);
  const parts = await loadParts(admin, signup.id);
  if (parts) await deliver(admin, "confirmation", parts);

  await promoteShift(admin, signup.shift_id);

  return back({ switched: "1" });
}
