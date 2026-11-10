import { createAdminClient } from "@/lib/supabase/admin";
import type { Event, Shift, Signup } from "@/lib/db";
import { deliver } from "./deliver";

/**
 * Send reminders for shifts starting inside a time window.
 *  day_before: shifts starting 12 to 36 hours from now (run in the evening)
 *  morning_of: shifts starting 0 to 14 hours from now (run in the morning)
 * Safe to run as often as you like: deliver() never sends the same kind twice.
 */
export async function runReminders(kind: "day_before" | "morning_of") {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Supabase secret key missing" };

  const now = Date.now();
  const [fromH, toH] = kind === "day_before" ? [12, 36] : [0, 14];
  const from = new Date(now + fromH * 3600 * 1000).toISOString();
  const to = new Date(now + toH * 3600 * 1000).toISOString();

  const { data: shiftsRaw } = await admin.from("shifts").select("*").gte("starts_at", from).lte("starts_at", to);
  const shifts = (shiftsRaw ?? []) as Shift[];
  if (shifts.length === 0) return { ok: true, kind, shifts: 0, sent: 0, skipped: 0, failed: 0, noAddress: 0 };

  const eventIds = [...new Set(shifts.map((s) => s.event_id))];
  const { data: evRaw } = await admin.from("events").select("*").in("id", eventIds).eq("status", "published");
  const events = (evRaw ?? []) as Event[];
  const orgIds = [...new Set(events.map((e) => e.org_id))];
  const { data: orgRaw } = await admin.from("organizations").select("id,name,time_zone,contact_email").in("id", orgIds);
  const orgs = new Map((orgRaw ?? []).map((o) => [o.id, o]));

  const { data: suRaw } = await admin
    .from("signups")
    .select("*")
    .in("shift_id", shifts.map((s) => s.id))
    .eq("status", "confirmed");
  const signups = (suRaw ?? []) as Signup[];

  const tally = { sent: 0, skipped: 0, failed: 0, noAddress: 0 };
  for (const signup of signups) {
    const shift = shifts.find((s) => s.id === signup.shift_id);
    const event = events.find((e) => e.id === signup.event_id);
    const org = event ? orgs.get(event.org_id) : undefined;
    if (!shift || !event || !org) continue;
    const r = await deliver(admin, kind, { signup, event, shift, org });
    if (r === "sent") tally.sent++;
    else if (r === "skipped") tally.skipped++;
    else if (r === "failed") tally.failed++;
    else tally.noAddress++;
  }
  return { ok: true, kind, shifts: shifts.length, signups: signups.length, ...tally };
}
