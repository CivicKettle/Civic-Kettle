import { NextResponse, type NextRequest } from "next/server";
import { getOrg, getSession, type Shift, type Signup } from "@/lib/db";
import { CHECKOUT_GRACE_MIN } from "@/lib/attendance";

export const dynamic = "force-dynamic";

/**
 * Coordinator marks a volunteer in, out, or undoes the last mark.
 * Marking after the fact uses the shift's own times, so hours stay honest:
 *   in  after the shift ended        → counted from the shift start
 *   out after the grace period ended → counted to the shift end
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url), { status: 303 });
  const session = await getSession();
  if (!session) return to("/app");
  const org = await getOrg(session);
  if (!org) return to("/app/setup");

  const form = await request.formData();
  const intent = String(form.get("intent") || "");
  const eventId = String(form.get("event_id") || "");
  const back = eventId ? `/app/events/${eventId}/checkin` : "/app/events";

  // Row-level security limits both reads to the coordinator's own organization.
  const { data: s } = await session.supabase.from("signups").select("*").eq("id", id).maybeSingle();
  const signup = s as Signup | null;
  if (!signup || signup.status !== "confirmed") return to(back);
  const { data: sh } = await session.supabase.from("shifts").select("*").eq("id", signup.shift_id).maybeSingle();
  const shift = sh as Shift | null;
  if (!shift) return to(back);

  const now = Date.now();
  const shiftEnd = new Date(shift.ends_at).getTime();
  let patch: Partial<Pick<Signup, "checked_in_at" | "checked_out_at">> | null = null;

  if (intent === "in" && !signup.checked_in_at) {
    patch = { checked_in_at: now > shiftEnd ? shift.starts_at : new Date(now).toISOString() };
  } else if (intent === "out" && signup.checked_in_at && !signup.checked_out_at) {
    const late = now > shiftEnd + CHECKOUT_GRACE_MIN * 60000;
    patch = { checked_out_at: late ? shift.ends_at : new Date(now).toISOString() };
  } else if (intent === "undo") {
    if (signup.checked_out_at) patch = { checked_out_at: null };
    else if (signup.checked_in_at) patch = { checked_in_at: null };
  }

  if (patch) await session.supabase.from("signups").update(patch).eq("id", id);
  return to(back);
}
