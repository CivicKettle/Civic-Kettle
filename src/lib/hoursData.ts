import type { Event, Organization, Shift, Signup } from "@/lib/db";
import type { Session } from "@/lib/db";
import { toEntry, type HoursEntry } from "@/lib/hours";

/** Every check-in in the range for the coordinator's organization (row-level security scopes it). */
export async function loadEntries(session: Session, org: Organization, startIso: string, endIso: string): Promise<HoursEntry[]> {
  const { data: su } = await session.supabase
    .from("signups")
    .select("*")
    .eq("status", "confirmed")
    .gte("checked_in_at", startIso)
    .lte("checked_in_at", endIso)
    .order("checked_in_at", { ascending: false })
    .limit(2000);
  const signups = (su ?? []) as Signup[];
  if (signups.length === 0) return [];
  const [{ data: sh }, { data: ev }] = await Promise.all([
    session.supabase.from("shifts").select("*").in("id", [...new Set(signups.map((s) => s.shift_id))]),
    session.supabase.from("events").select("id,title,starts_at,org_id").in("id", [...new Set(signups.map((s) => s.event_id))]).eq("org_id", org.id),
  ]);
  const shifts = new Map(((sh ?? []) as Shift[]).map((s) => [s.id, s]));
  const events = new Map(((ev ?? []) as Pick<Event, "id" | "title" | "starts_at">[]).map((e) => [e.id, e]));
  const out: HoursEntry[] = [];
  for (const s of signups) {
    const shift = shifts.get(s.shift_id);
    const event = events.get(s.event_id);
    if (shift && event) out.push(toEntry(s, shift, event));
  }
  return out;
}
