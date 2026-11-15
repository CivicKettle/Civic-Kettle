import { withCounts, type Event, type Organization, type Shift, type ShiftWithCounts, type Signup } from "@/lib/db";
import { normEmail } from "@/lib/emails/optout";
import { toEntry } from "@/lib/hours";
import { loadSignupByCancelToken } from "@/lib/public";
import { createAdminClient } from "@/lib/supabase/admin";

export type MineRow = {
  signup: Signup;
  event: Event;
  shift: Shift;
  /** Other shifts of the same event this person could move to. */
  alternatives: ShiftWithCounts[];
  /** False once they have checked in, or the event was cancelled. */
  canChange: boolean;
  /** On the shift's waiting list, not yet holding a spot. */
  waiting: boolean;
};

export type Mine = {
  org: Pick<Organization, "id" | "name" | "slug" | "time_zone" | "contact_email">;
  email: string;
  upcoming: MineRow[];
  pastShifts: number;
  pastHours: number;
  /** One entry per name under this email, with approved hours and the latest letter. Null when letters aren't switched on (database step 12). */
  letters: MineLetter[] | null;
};

export type MineLetter = { name: string; approvedHours: number; state: "none" | "requested" | "approved" | "declined"; code: string | null };

/**
 * Everything one person (one email address) is signed up for with one
 * organization. The link in their email carries a sign-up's private token;
 * that token is what proves the address is theirs. No account involved.
 */
export async function loadMine(token: string): Promise<Mine | null> {
  const base = await loadSignupByCancelToken(token);
  const admin = createAdminClient();
  const email = normEmail(base?.signup.email);
  if (!base || !admin || !email) return null;

  const { data: orgRow } = await admin.from("organizations").select("id,name,slug,time_zone,contact_email").eq("id", base.event.org_id).single();
  if (!orgRow) return null;
  const org = orgRow as Mine["org"];

  const { data: evs } = await admin.from("events").select("*").eq("org_id", org.id).limit(500);
  const events = new Map(((evs ?? []) as Event[]).map((e) => [e.id, e]));
  if (events.size === 0) return { org, email, upcoming: [], pastShifts: 0, pastHours: 0, letters: null };

  const { data: su } = await admin.from("signups").select("*").in("event_id", [...events.keys()]).eq("email", email).in("status", ["confirmed", "waitlist"]);
  const mine = (su ?? []) as Signup[];
  const eventIds = [...new Set(mine.map((s) => s.event_id))];
  if (eventIds.length === 0) return { org, email, upcoming: [], pastShifts: 0, pastHours: 0, letters: null };

  const [{ data: sh }, { data: counts }] = await Promise.all([
    admin.from("shifts").select("*").in("event_id", eventIds).order("sort_order"),
    admin.from("signups").select("shift_id,status").in("event_id", eventIds),
  ]);
  const shifts = withCounts((sh ?? []) as Shift[], (counts ?? []) as Pick<Signup, "shift_id" | "status">[]);
  const now = Date.now();

  const upcoming: MineRow[] = [];
  let pastShifts = 0;
  let pastHours = 0;
  for (const s of mine) {
    const event = events.get(s.event_id);
    const shift = shifts.find((x) => x.id === s.shift_id);
    if (!event || !shift) continue;
    if (new Date(shift.ends_at).getTime() > now) {
      const taken = new Set(mine.filter((m) => m.event_id === s.event_id && m.volunteer_name.trim().toLowerCase() === s.volunteer_name.trim().toLowerCase()).map((m) => m.shift_id));
      const waiting = s.status === "waitlist";
      const canChange = !waiting && !s.checked_in_at && event.status !== "cancelled";
      const alternatives = canChange ? shifts.filter((x) => x.event_id === s.event_id && !taken.has(x.id) && x.open > 0 && new Date(x.ends_at).getTime() > now) : [];
      upcoming.push({ signup: s, event, shift, alternatives, canChange, waiting });
    } else if (s.checked_in_at && s.status === "confirmed") {
      pastShifts++;
      pastHours += toEntry(s, shift, event, now).hours ?? 0;
    }
  }
  upcoming.sort((a, b) => a.shift.starts_at.localeCompare(b.shift.starts_at));

  // Hours letters: approved hours per name under this email, and where each person's latest letter stands.
  let letters: MineLetter[] | null = null;
  const { data: lt, error: lettersOff } = await admin.from("hours_letters").select("volunteer_name,status,code,requested_at").eq("org_id", org.id).eq("volunteer_email", email).order("requested_at", { ascending: false });
  if (!lettersOff) {
    const byName = new Map<string, MineLetter>();
    for (const s of mine) {
      if (s.status !== "confirmed" || !s.hours_approved_at) continue;
      const event = events.get(s.event_id);
      const shift = shifts.find((x) => x.id === s.shift_id);
      if (!event || !shift) continue;
      const key = s.volunteer_name.trim().toLowerCase();
      const row = byName.get(key) ?? { name: s.volunteer_name.trim(), approvedHours: 0, state: "none" as const, code: null };
      row.approvedHours += toEntry(s, shift, event, now).hours ?? 0;
      byName.set(key, row);
    }
    for (const [key, row] of byName) {
      row.approvedHours = Math.round(row.approvedHours * 100) / 100;
      const latest = ((lt ?? []) as { volunteer_name: string; status: string; code: string | null }[]).find((l) => l.volunteer_name.trim().toLowerCase() === key && l.status !== "cancelled");
      if (latest) { row.state = latest.status as MineLetter["state"]; row.code = latest.status === "approved" ? latest.code : null; }
    }
    letters = [...byName.values()].filter((r) => r.approvedHours > 0).sort((a, b) => a.name.localeCompare(b.name));
  }
  return { org, email, upcoming, pastShifts, pastHours: Math.round(pastHours * 100) / 100, letters };
}
