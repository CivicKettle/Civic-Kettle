import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Limits on repeated attempts at the public forms, so a script can't flood an
 * event with fake sign-ups, hammer a password, or use up the day's emails.
 *
 * The limits are set well above what real people do (a class signing up on
 * the same school Wi-Fi, a parent signing up three children), and everything
 * fails open: if the table is missing or the database is slow, the attempt
 * is allowed. Being too strict would hurt real volunteers more than a
 * flood would.
 */
export type Limit = {
  /** What is being limited, e.g. "signup-ip". */
  action: string;
  /** Who is being counted: an email address or a connection (IP address). */
  who: string;
  /** How many attempts are allowed... */
  max: number;
  /** ...within this many minutes. */
  minutes: number;
};

/** The visitor's connection, as reported by the host. */
export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  return forwarded.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}

/** Scrambled, so the table never holds an email or IP address. */
function keyFor(limit: Limit): string {
  return `${limit.action}:${createHash("sha256").update(`${limit.action}|${limit.who.toLowerCase()}`).digest("hex").slice(0, 32)}`;
}

/**
 * True if every limit still has room, and records the attempt against each.
 * False if any limit is already used up (nothing is recorded then).
 */
export async function withinLimits(limits: Limit[]): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return true;
  try {
    const checks = await Promise.all(
      limits.map(async (limit) => {
        const since = new Date(Date.now() - limit.minutes * 60 * 1000).toISOString();
        const { data, error } = await admin.from("rate_hits").select("id").eq("key", keyFor(limit)).gte("at", since).limit(limit.max);
        if (error) return true; // table not there yet, or the database hiccuped
        return (data ?? []).length < limit.max;
      }),
    );
    if (checks.includes(false)) return false;
    const at = new Date().toISOString();
    await admin.from("rate_hits").insert(limits.map((limit) => ({ key: keyFor(limit), at })));
    return true;
  } catch {
    return true;
  }
}

/** Clear attempts older than two days. Called by the daily reminder job. */
export async function clearOldAttempts(): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  try {
    await admin.from("rate_hits").delete().lte("at", new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString());
  } catch {
    /* nothing to clear, or the table isn't there yet */
  }
}
