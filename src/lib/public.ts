import { createAdminClient } from "@/lib/supabase/admin";
import { withCounts, type Event, type Organization, type Shift, type ShiftWithCounts, type Signup } from "@/lib/db";

export type PublicEvent = {
  org: Pick<Organization, "name" | "time_zone" | "contact_email">;
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
    admin.from("organizations").select("name,time_zone,contact_email").eq("id", event.org_id).single(),
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
