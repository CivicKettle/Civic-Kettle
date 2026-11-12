import { NextResponse, type NextRequest } from "next/server";
import { getOrg, getSession } from "@/lib/db";
import { parseEventForm, repeatDates, type Repeat } from "@/lib/eventForm";

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
  const repeatRaw = String(form.get("repeat") || "none");
  const repeat: Repeat = repeatRaw === "weekly" || repeatRaw === "biweekly" || repeatRaw === "monthly" ? repeatRaw : "none";
  const dates = repeatDates(String(form.get("date") || ""), repeat, parseInt(String(form.get("repeat_more") || "0"), 10));

  // A repeating event is saved as separate events, one per date, so each has
  // its own sign-up link and can be changed or cancelled by itself.
  const createdIds: string[] = [];
  for (const date of dates) {
    form.set("date", date);
    const parsed = parseEventForm(form, org.time_zone);
    if (!parsed.ok) return createdIds.length ? go(request, "/app/events", `Created ${createdIds.length} of ${dates.length} events, then stopped: ${parsed.error}`) : go(request, "/app/events/new", parsed.error);
    const { shifts, ...event } = parsed.data;

    const { data: created, error } = await session.supabase.from("events").insert({ ...event, org_id: org.id }).select("id").single();
    if (error || !created) {
      const msg = error?.message || "Couldn't create the event.";
      return createdIds.length ? go(request, "/app/events", `Created ${createdIds.length} of ${dates.length} events, then stopped: ${msg}`) : go(request, "/app/events/new", msg);
    }
    const { error: shiftErr } = await session.supabase.from("shifts").insert(shifts.map(({ id: _id, ...s }) => ({ ...s, event_id: created.id })));
    if (shiftErr) {
      await session.supabase.from("events").delete().eq("id", created.id);
      return createdIds.length ? go(request, "/app/events", `Created ${createdIds.length} of ${dates.length} events, then stopped: ${shiftErr.message}`) : go(request, "/app/events/new", shiftErr.message);
    }
    createdIds.push(created.id);
  }

  if (createdIds.length > 1) {
    const url = new URL("/app/events", request.url);
    url.searchParams.set("created", String(createdIds.length));
    return NextResponse.redirect(url, { status: 303 });
  }
  return go(request, `/app/events/${createdIds[0]}?created=1`);
}
