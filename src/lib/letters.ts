import { randomInt } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Event, Shift, Signup } from "@/lib/db";
import { toEntry } from "@/lib/hours";

export type LetterLine = { title: string; shift: string; date: string; hours: number };

export type Letter = {
  id: string;
  org_id: string;
  code: string | null;
  volunteer_name: string;
  volunteer_email: string;
  status: "requested" | "approved" | "declined" | "cancelled";
  requested_at: string;
  decided_at: string | null;
  signer_name: string | null;
  signer_title: string | null;
  total_hours: number | null;
  first_date: string | null;
  last_date: string | null;
  lines: LetterLine[];
};

export const LETTER_COLUMNS = "id,org_id,code,volunteer_name,volunteer_email,status,requested_at,decided_at,signer_name,signer_title,total_hours,first_date,last_date,lines";

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * One person's approved hours with one organization, a line per shift, oldest
 * first. Only hours a coordinator has approved count. The same function runs
 * for the volunteer's own page (server key) and for the coordinator (their
 * sign-in), so both always see the same total.
 */
export async function approvedLines(db: SupabaseClient, orgId: string, name: string, email: string): Promise<{ lines: LetterLine[]; total: number }> {
  const { data: evs } = await db.from("events").select("id,title,starts_at,org_id").eq("org_id", orgId).limit(1000);
  const events = new Map(((evs ?? []) as Pick<Event, "id" | "title" | "starts_at">[]).map((e) => [e.id, e]));
  if (events.size === 0) return { lines: [], total: 0 };
  const { data: su } = await db.from("signups").select("*").in("event_id", [...events.keys()]).eq("email", email.trim().toLowerCase()).eq("status", "confirmed");
  const mine = ((su ?? []) as Signup[]).filter((s) => sameName(s.volunteer_name, name) && s.hours_approved_at);
  if (mine.length === 0) return { lines: [], total: 0 };
  const { data: sh } = await db.from("shifts").select("*").in("id", [...new Set(mine.map((s) => s.shift_id))]);
  const shifts = new Map(((sh ?? []) as Shift[]).map((s) => [s.id, s]));
  const lines: LetterLine[] = [];
  for (const s of mine) {
    const shift = shifts.get(s.shift_id);
    const event = events.get(s.event_id);
    if (!shift || !event) continue;
    const hours = toEntry(s, shift, event).hours;
    if (!hours || hours <= 0) continue;
    lines.push({ title: event.title, shift: shift.name, date: shift.starts_at, hours: Math.round(hours * 100) / 100 });
  }
  lines.sort((a, b) => a.date.localeCompare(b.date));
  return { lines, total: Math.round(lines.reduce((t, l) => t + l.hours, 0) * 100) / 100 };
}

/** Twelve characters with no look-alikes (no 0/O, 1/I/L), shown as XXXX-XXXX-XXXX. */
export function newLetterCode(): string {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let out = "";
  for (let i = 0; i < 12; i++) out += alphabet[randomInt(alphabet.length)];
  return out;
}

export function prettyCode(code: string): string {
  return code.replace(/(.{4})(?=.)/g, "$1-");
}

/** What someone typed or scanned, back to the stored form. Null if it can't be a code. */
export function cleanCode(raw: string): string | null {
  const c = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^[2-9A-HJKMNP-Z]{12}$/.test(c) ? c : null;
}

export function fmtLetterHours(h: number): string {
  return `${h} ${h === 1 ? "hour" : "hours"}`;
}
