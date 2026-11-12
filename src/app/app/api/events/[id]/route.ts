import { NextResponse, type NextRequest } from "next/server";
import { getOrg, getSession, type Shift } from "@/lib/db";
import { parseEventForm } from "@/lib/eventForm";
import { createAdminClient } from "@/lib/supabase/admin";
import { promoteEvent } from "@/lib/waitlist";

export const dynamic = "force-dynamic";

function go(request: NextRequest, path: string, error?: string) {
  const url = new URL(path, request.url);
  if (error) url.searchParams.set("error", error);
  return NextResponse.redirect(url, { status: 303 });
}

/** Update an event (and reconcile its shifts), or change its status. */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session) return go(request, "/app");
  const org = await getOrg(session);
  if (!org) return go(request, "/app/setup");

  const { data: existing } = await session.supabase
    .from("events")
    .select("id,org_id")
    .eq("id", id)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!existing) return go(request, "/app/events", "That event doesn't exist.");

  const form = await request.formData();
  const intent = String(form.get("intent") || "update");

  if (intent === "cancel" || intent === "restore") {
    const status = intent === "cancel" ? "cancelled" : "published";
    const { error } = await session.supabase.from("events").update({ status }).eq("id", id);
    return go(request, `/app/events/${id}`, error?.message);
  }

  if (intent === "notes") {
    const notes = String(form.get("summary_notes") || "").trim().slice(0, 4000) || null;
    const { error } = await session.supabase.from("events").update({ summary_notes: notes }).eq("id", id);
    const msg = error && /summary_notes/.test(error.message) ? "Notes need the latest database setup (v4). Run it in Supabase, then try again." : error?.message;
    return go(request, `/app/events/${id}/summary`, msg);
  }

  const parsed = parseEventForm(form, org.time_zone);
  if (!parsed.ok) return go(request, `/app/events/${id}/edit`, parsed.error);
  const { shifts, ...event } = parsed.data;

  const { error } = await session.supabase.from("events").update(event).eq("id", id);
  if (error) return go(request, `/app/events/${id}/edit`, error.message);

  // Reconcile shifts: update the ones with ids, insert new ones, delete the ones removed
  // (only if they have no confirmed sign-ups).
  const { data: currentRaw } = await session.supabase.from("shifts").select("*").eq("event_id", id);
  const current = (currentRaw ?? []) as Shift[];
  const keptIds = new Set(shifts.map((s) => s.id).filter(Boolean) as string[]);

  for (const s of shifts) {
    if (s.id && current.some((c) => c.id === s.id)) {
      const { id: sid, ...rest } = s;
      await session.supabase.from("shifts").update(rest).eq("id", sid);
    } else {
      const { id: _drop, ...rest } = s;
      await session.supabase.from("shifts").insert({ ...rest, event_id: id });
    }
  }

  const removed = current.filter((c) => !keptIds.has(c.id));
  for (const r of removed) {
    const { count } = await session.supabase
      .from("signups")
      .select("id", { count: "exact", head: true })
      .eq("shift_id", r.id)
      .eq("status", "confirmed");
    if ((count ?? 0) > 0) {
      return go(request, `/app/events/${id}`, `Kept the "${r.name}" shift because it has sign-ups. Cancel those first to remove it.`);
    }
    await session.supabase.from("shifts").delete().eq("id", r.id);
  }

  const admin = createAdminClient();
  if (admin) await promoteEvent(admin, id);

  return go(request, `/app/events/${id}?saved=1`);
}
