import type { Event, Organization, Session, Shift, Signup } from "@/lib/db";
import { loadOptouts, normEmail } from "@/lib/emails/optout";
import { toEntry } from "@/lib/hours";

export type VolunteerShift = {
  eventId: string;
  title: string;
  shiftName: string;
  startsAt: string;
  status: "Upcoming" | "On shift" | "Attended" | "No-show" | "Cancelled";
  hours: number | null;
};

export type Volunteer = {
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
  minor: boolean;
  guardian: string | null;
  emailOff: boolean;
  events: number;
  attended: number;
  noShows: number;
  upcoming: number;
  hours: number;
  firstAt: string;
  lastAt: string | null;
  nextAt: string | null;
  history: VolunteerShift[];
};

/** Everyone who has signed up for any of this organization's events, one row per person. */
export async function loadVolunteers(session: Session, org: Organization, now: number = Date.now()): Promise<Volunteer[]> {
  const { data: ev } = await session.supabase.from("events").select("id,title,starts_at,status,org_id").eq("org_id", org.id).limit(1000);
  const events = new Map(((ev ?? []) as Pick<Event, "id" | "title" | "starts_at" | "status">[]).map((e) => [e.id, e]));
  if (events.size === 0) return [];
  const ids = [...events.keys()];
  const [{ data: sh }, { data: su }, optouts] = await Promise.all([
    session.supabase.from("shifts").select("*").in("event_id", ids),
    session.supabase.from("signups").select("*").in("event_id", ids).order("created_at").limit(5000),
    loadOptouts(session.supabase, org.id),
  ]);
  const shifts = new Map(((sh ?? []) as Shift[]).map((s) => [s.id, s]));

  const people = new Map<string, Volunteer & { eventIds: Set<string> }>();
  for (const s of (su ?? []) as Signup[]) {
    const shift = shifts.get(s.shift_id);
    const event = events.get(s.event_id);
    if (!shift || !event) continue;
    const key = `${s.volunteer_name.trim().toLowerCase()}|${normEmail(s.email)}`;
    const p = people.get(key) ?? {
      key,
      name: s.volunteer_name.trim(),
      email: s.email,
      phone: null,
      minor: false,
      guardian: null,
      emailOff: optouts.has(normEmail(s.email)),
      events: 0,
      attended: 0,
      noShows: 0,
      upcoming: 0,
      hours: 0,
      firstAt: s.created_at,
      lastAt: null,
      nextAt: null,
      history: [],
      eventIds: new Set<string>(),
    };
    // Newest sign-up wins for contact details.
    p.phone = s.phone || s.guardian_phone || p.phone;
    p.minor = s.is_minor;
    p.guardian = s.guardian_name || p.guardian;

    const e = toEntry(s, shift, event, now);
    const ended = new Date(shift.ends_at).getTime() < now;
    let status: VolunteerShift["status"];
    if (s.status === "cancelled") status = "Cancelled";
    else if (e.a.state === "in") status = "On shift";
    else if (e.a.state === "done") status = "Attended";
    else status = ended ? "No-show" : "Upcoming";

    if (status !== "Cancelled") p.eventIds.add(event.id);
    if (status === "Attended" || status === "On shift") {
      p.attended++;
      p.hours += e.hours ?? 0;
      if (!p.lastAt || shift.starts_at > p.lastAt) p.lastAt = shift.starts_at;
    }
    if (status === "No-show") p.noShows++;
    if (status === "Upcoming" && event.status !== "cancelled") {
      p.upcoming++;
      if (!p.nextAt || shift.starts_at < p.nextAt) p.nextAt = shift.starts_at;
    }
    p.history.push({ eventId: event.id, title: event.title, shiftName: shift.name, startsAt: shift.starts_at, status, hours: status === "Attended" ? e.hours : null });
    people.set(key, p);
  }

  return [...people.values()].map(({ eventIds, ...p }) => ({
    ...p,
    events: eventIds.size,
    hours: Math.round(p.hours * 100) / 100,
    history: p.history.sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
  }));
}

export type VolunteerSort = "name" | "hours" | "recent";

export function filterAndSort(rows: Volunteer[], q: string, sort: VolunteerSort): Volunteer[] {
  const needle = q.trim().toLowerCase();
  const digits = needle.replace(/\D/g, "");
  const hit = (v: Volunteer) =>
    !needle ||
    v.name.toLowerCase().includes(needle) ||
    (v.email || "").toLowerCase().includes(needle) ||
    (v.guardian || "").toLowerCase().includes(needle) ||
    (digits.length >= 3 && (v.phone || "").replace(/\D/g, "").includes(digits));
  const out = rows.filter(hit);
  if (sort === "hours") out.sort((a, b) => b.hours - a.hours || a.name.localeCompare(b.name));
  else if (sort === "recent") out.sort((a, b) => (b.lastAt || b.firstAt).localeCompare(a.lastAt || a.firstAt));
  else out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}
