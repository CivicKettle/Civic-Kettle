import { createAdminClient } from "@/lib/supabase/admin";
import { withCounts, type Event, type Organization, type Shift, type ShiftWithCounts, type Signup } from "@/lib/db";

export type PublicEvent = {
  org: Pick<Organization, "name" | "time_zone" | "contact_email" | "slug">;
  event: Event;
  shifts: ShiftWithCounts[];
};

/** Everything the public sign-up page needs, fetched with the server's secret key. */
export async function loadPublicEvent(token: string): Promise<PublicEvent | null> {
  const admin = createAdminClient();
  if (!admin || !/^[a-f0-9]{8,16}$/i.test(token)) return null;

  const { data: ev } = await admin.from("events").select("*").eq("public_token", token).maybeSingle();
  if (!ev) return null;
  const event = ev as Event;

  const [{ data: org }, { data: sh }, { data: su }] = await Promise.all([
    admin.from("organizations").select("name,time_zone,contact_email,slug").eq("id", event.org_id).single(),
    admin.from("shifts").select("*").eq("event_id", event.id).order("sort_order"),
    admin.from("signups").select("shift_id,status").eq("event_id", event.id),
  ]);
  if (!org) return null;
  return {
    org,
    event,
    shifts: withCounts((sh ?? []) as Shift[], (su ?? []) as Pick<Signup, "shift_id" | "status">[]),
  };
}

export async function loadSignupByCancelToken(cancelToken: string) {
  const admin = createAdminClient();
  if (!admin || !/^[a-f0-9]{16,64}$/i.test(cancelToken)) return null;
  const { data: s } = await admin.from("signups").select("*").eq("cancel_token", cancelToken).maybeSingle();
  if (!s) return null;
  const signup = s as Signup;
  const [{ data: ev }, { data: sh }] = await Promise.all([
    admin.from("events").select("*").eq("id", signup.event_id).single(),
    admin.from("shifts").select("*").eq("id", signup.shift_id).single(),
  ]);
  if (!ev || !sh) return null;
  const { data: org } = await admin.from("organizations").select("name,time_zone,contact_email").eq("id", (ev as Event).org_id).single();
  if (!org) return null;
  return { signup, event: ev as Event, shift: sh as Shift, org };
}

/** Confirmed sign-ups for this event that were made on (or linked to) this device. */
export async function loadDeviceSignups(eventId: string, tokens: string[]): Promise<Signup[]> {
  const admin = createAdminClient();
  if (!admin || tokens.length === 0) return [];
  const { data } = await admin
    .from("signups")
    .select("*")
    .eq("event_id", eventId)
    .eq("status", "confirmed")
    .in("cancel_token", tokens)
    .order("created_at");
  return (data ?? []) as Signup[];
}

export type OrgPage = {
  org: Pick<Organization, "name" | "slug" | "time_zone" | "contact_email">;
  events: { event: Event; capacity: number; open: number; shifts: number; waiting: number }[];
};

/**
 * An organization's public page: every published event that hasn't ended yet,
 * with how many spots are open. No volunteer names or contact details.
 */
export async function loadOrgPage(slug: string): Promise<OrgPage | null> {
  const admin = createAdminClient();
  if (!admin || !/^[a-z0-9-]{1,64}$/.test(slug)) return null;
  const { data: org } = await admin.from("organizations").select("id,name,slug,time_zone,contact_email").eq("slug", slug).maybeSingle();
  if (!org) return null;
  const { data: evs } = await admin
    .from("events")
    .select("*")
    .eq("org_id", org.id)
    .eq("status", "published")
    .gte("ends_at", new Date().toISOString())
    .order("starts_at")
    .limit(60);
  const events = (evs ?? []) as Event[];
  if (events.length === 0) return { org, events: [] };
  const ids = events.map((e) => e.id);
  const [{ data: sh }, { data: su }] = await Promise.all([
    admin.from("shifts").select("*").in("event_id", ids),
    admin.from("signups").select("shift_id,status").in("event_id", ids),
  ]);
  const shifts = withCounts((sh ?? []) as Shift[], (su ?? []) as Pick<Signup, "shift_id" | "status">[]);
  return {
    org,
    events: events.map((event) => {
      const mine = shifts.filter((s) => s.event_id === event.id);
      return { event, capacity: mine.reduce((t, s) => t + s.capacity, 0), open: mine.reduce((t, s) => t + s.open, 0), shifts: mine.length, waiting: mine.reduce((t, s) => t + s.waiting, 0) };
    }),
  };
}
