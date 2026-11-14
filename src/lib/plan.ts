import type { Organization, Session } from "@/lib/db";
import { PRICE, PRICE_YEARLY, TRIAL_DAYS } from "@/lib/pricing";
import { fmtDate } from "@/lib/time";

export type Trial = { state: "active" | "ended"; daysLeft: number; endsOn: string };

/**
 * Where an organization stands in its free trial. Nothing is locked when a
 * trial ends: payments aren't built yet, so this only tells people the date.
 * Returns null for CivicKettle's own workspace.
 */
export async function trialFor(session: Session, org: Organization): Promise<Trial | null> {
  if (!org.created_at) return null;
  try {
    const { data } = await session.supabase.rpc("is_platform_member");
    if (data === true) return null;
  } catch {
    /* older database: treat as a normal organization */
  }
  const end = new Date(org.created_at).getTime() + TRIAL_DAYS * 86400000;
  const daysLeft = Math.ceil((end - Date.now()) / 86400000);
  return { state: daysLeft > 0 ? "active" : "ended", daysLeft: Math.max(0, daysLeft), endsOn: fmtDate(new Date(end).toISOString(), org.time_zone, { year: "numeric" }) };
}

/** One sentence for the dashboard and Settings. */
export function trialLine(t: Trial): string {
  return t.state === "active"
    ? `Free trial: ${t.daysLeft} day${t.daysLeft === 1 ? "" : "s"} left, until ${t.endsOn}. After that CivicKettle is ${PRICE} or ${PRICE_YEARLY}. Nothing is charged automatically.`
    : `Your free trial ended on ${t.endsOn}. CivicKettle is ${PRICE} or ${PRICE_YEARLY}. Paying isn't set up yet, so nothing changes for you right now.`;
}
