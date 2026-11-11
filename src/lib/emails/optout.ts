import type { SupabaseClient } from "@supabase/supabase-js";

/** Email addresses are compared trimmed and lower-cased everywhere. */
export function normEmail(email: string | null | undefined): string {
  return (email || "").trim().toLowerCase();
}

/**
 * Addresses that asked this organization to stop reminders and coordinator
 * messages. Fails soft: if the table isn't there yet, nobody is opted out.
 */
export async function loadOptouts(client: SupabaseClient, orgId: string): Promise<Set<string>> {
  try {
    const { data, error } = await client.from("email_optouts").select("email").eq("org_id", orgId);
    if (error) return new Set();
    return new Set((data ?? []).map((r) => normEmail(r.email as string)));
  } catch {
    return new Set();
  }
}

/** Turn emails off (or back on) for one address at one organization. Needs the admin client. */
export async function setOptout(admin: SupabaseClient, orgId: string, email: string, off: boolean): Promise<{ ok: boolean; error?: string }> {
  const address = normEmail(email);
  if (!address) return { ok: false, error: "No email address on this sign-up." };
  const r = off
    ? await admin.from("email_optouts").upsert({ org_id: orgId, email: address }, { onConflict: "org_id,email", ignoreDuplicates: true })
    : await admin.from("email_optouts").delete().eq("org_id", orgId).eq("email", address);
  return r.error ? { ok: false, error: r.error.message } : { ok: true };
}

/** The page where a person confirms they want to stop emails. */
export function unsubscribeUrl(siteUrl: string, cancelToken: string): string {
  return `${siteUrl}/u/${cancelToken}`;
}

/** Headers that give mail apps (Gmail, Yahoo, Apple Mail) a one-click unsubscribe button. */
export function unsubscribeHeaders(siteUrl: string, cancelToken: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${siteUrl}/api/unsubscribe/${cancelToken}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
