import type { SupabaseClient } from "@supabase/supabase-js";
import type { Shift, Signup } from "@/lib/db";
import { normEmail } from "@/lib/emails/optout";

export type Broadcast = {
  id: string;
  event_id: string;
  shift_id: string | null;
  subject: string;
  body: string;
  recipient_count: number;
  skipped_count: number;
  sent_by: string | null;
  created_at: string;
};

export type Audience = { send: { signup: Signup; shift: Shift }[]; off: Signup[] };

/**
 * Who a message goes to: confirmed sign-ups for the whole event or one shift,
 * one email per address (a parent with two children gets one), minus anyone
 * who turned emails off.
 */
export function pickAudience(signups: Signup[], shifts: Shift[], audience: string, optouts: Set<string>): Audience {
  const seen = new Set<string>();
  const out: Audience = { send: [], off: [] };
  for (const s of signups) {
    if (s.status !== "confirmed") continue;
    if (audience !== "all" && s.shift_id !== audience) continue;
    const email = normEmail(s.email);
    const shift = shifts.find((x) => x.id === s.shift_id);
    if (!email || !shift || seen.has(email)) continue;
    seen.add(email);
    if (optouts.has(email)) out.off.push(s);
    else out.send.push({ signup: s, shift });
  }
  return out;
}

/** The free email plan allows this many emails a day across everything the site sends. */
export function dailyEmailLimit(): number {
  const n = Number((process.env.EMAIL_DAILY_LIMIT || "").trim());
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 100;
}

/** Emails sent in the last 24 hours (confirmations, reminders and messages). Fails soft to 0. */
export async function emailsInLastDay(admin: SupabaseClient): Promise<number> {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  let total = 0;
  try {
    const { count } = await admin.from("messages").select("id", { count: "exact", head: true }).gte("sent_at", since);
    total += count ?? 0;
  } catch {
    /* table missing: count nothing */
  }
  try {
    const { data } = await admin.from("broadcasts").select("recipient_count").gte("created_at", since);
    for (const r of data ?? []) total += Number(r.recipient_count) || 0;
  } catch {
    /* table missing: count nothing */
  }
  return total;
}
