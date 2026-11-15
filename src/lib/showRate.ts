import type { Organization, Session } from "@/lib/db";

export type ShowRate = { rate: number; came: number; signed: number };

/**
 * Of the people who were signed up when a shift ended, how many checked in.
 * Looks at this organization's shifts from the last twelve months. Null until
 * there are at least ten sign-ups to go on, so an early fluke isn't advice.
 */
export async function loadShowRate(session: Session, org: Organization, now: number = Date.now()): Promise<ShowRate | null> {
  const since = new Date(now - 365 * 86400_000).toISOString();
  const nowIso = new Date(now).toISOString();
  const { data: ev } = await session.supabase.from("events").select("id,status").eq("org_id", org.id).gte("starts_at", since).limit(1000);
  const ids = ((ev ?? []) as { id: string; status: string | null }[]).filter((e) => e.status !== "cancelled").map((e) => e.id);
  if (ids.length === 0) return null;
  const { data: sh } = await session.supabase.from("shifts").select("id,ends_at").in("event_id", ids).lt("ends_at", nowIso);
  const ended = ((sh ?? []) as { id: string }[]).map((s) => s.id);
  if (ended.length === 0) return null;
  const { data: su } = await session.supabase.from("signups").select("checked_in_at").in("shift_id", ended).eq("status", "confirmed").limit(5000);
  const rows = (su ?? []) as { checked_in_at: string | null }[];
  if (rows.length < 10) return null;
  const came = rows.filter((r) => r.checked_in_at).length;
  return { rate: came / rows.length, came, signed: rows.length };
}

/** Advice for the event form. Null when nearly everyone shows up, or there's nothing to go on. */
export function overbookHint(r: ShowRate | null): string | null {
  if (!r || r.rate >= 0.95 || r.rate <= 0) return null;
  const perTen = Math.round(r.rate * 10);
  if (perTen >= 10 || perTen < 1) return null;
  const need = Math.ceil(10 / r.rate);
  return `At your past events, about ${perTen} of every 10 people who signed up came on the day. To have 10 people there, offer about ${need} spots.`;
}

/** "Expect about 8 of the 10 signed up." for one upcoming event. Null when it would say nothing useful. */
export function expectLine(r: ShowRate | null, signedUp: number): string | null {
  if (!r || signedUp < 3 || r.rate >= 0.95 || r.rate <= 0) return null;
  const expected = Math.max(1, Math.round(signedUp * r.rate));
  if (expected >= signedUp) return null;
  return `Going by your past events, expect about ${expected} of the ${signedUp} signed up to come.`;
}
