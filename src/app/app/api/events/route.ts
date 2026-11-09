import { NextResponse, type NextRequest } from "next/server";
import { getOrg, getSession } from "@/lib/db";
import { parseEventForm } from "@/lib/eventForm";

export const dynamic = "force-dynamic";

function go(request: NextRequest, path: string, error?: string) {
  const url = new URL(path, request.url);
  if (error) url.searchParams.set("error", error);
  return NextResponse.redirect(url, { status: 303 });
}

/** Create an event with its shifts. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return go(request, "/app");
  const org = await getOrg(session);
  if (!org) return go(request, "/app/setup");

  const form = await request.formData();
  const parsed = parseEventForm(form, org.time_zone);
  if (!parsed.ok) return go(request, "/app/events/new", parsed.error);
  const { shifts, ...event } = parsed.data;

  const { data: created, error } = await session.supabase
    .from("events")
    .insert({ ...event, org_id: org.id })
    .select("id")
    .single();
  if (error || !created) return go(request, "/app/events/new", error?.message || "Couldn't create the event.");

  const { error: shiftErr } = await session.supabase
    .from("shifts")
    .insert(shifts.map(({ id: _id, ...s }) => ({ ...s, event_id: created.id })));
  if (shiftErr) {
    await session.supabase.from("events").delete().eq("id", created.id);
    return go(request, "/app/events/new", shiftErr.message);
  }

  return go(request, `/app/events/${created.id}?created=1`);
}
