import type { SupabaseClient } from "@supabase/supabase-js";
import type { Event, Organization, Shift, Signup } from "@/lib/db";
import { siteUrl } from "@/lib/supabase/server";
import { buildMessage, recipient, type MessageKind } from "./templates";
import { loadOptouts, normEmail } from "./optout";
import { sendEmail } from "./send";

type Org = Pick<Organization, "name" | "time_zone" | "contact_email"> & { id?: string };

/**
 * Send one message for one sign-up and record it, unless it was already sent.
 * Uses the admin client (server-only). Returns what happened, never throws.
 */
export async function deliver(
  admin: SupabaseClient,
  kind: MessageKind,
  parts: { signup: Signup; event: Event; shift: Shift; org: Org },
  optouts?: Set<string>,
): Promise<"sent" | "skipped" | "no_address" | "failed" | "opted_out"> {
  const to = recipient(parts.signup);
  if (!to) return "no_address";

  // Reminders respect an unsubscribe. A confirmation or cancellation notice is
  // about a sign-up the person just made or changed, so it always goes.
  if (kind === "day_before" || kind === "morning_of") {
    const orgId = parts.org.id || parts.event.org_id;
    const off = optouts ?? (await loadOptouts(admin, orgId));
    if (off.has(normEmail(to))) return "opted_out";
  }

  // Already sent? (unique on signup_id + kind)
  const { data: existing } = await admin
    .from("messages")
    .select("id")
    .eq("signup_id", parts.signup.id)
    .eq("kind", kind)
    .maybeSingle();
  if (existing) return "skipped";

  const msg = buildMessage(kind, { ...parts, siteUrl: siteUrl() });
  const result = await sendEmail({
    to,
    subject: msg.subject,
    html: msg.html,
    text: msg.text,
    replyTo: parts.org.contact_email,
    headers: msg.headers,
  });
  if (!result.ok) {
    console.error(`[email] ${kind} to ${to} failed: ${result.error}`);
    return "failed";
  }
  await admin.from("messages").insert({
    signup_id: parts.signup.id,
    kind,
    channel: "email",
    to_address: to,
    provider_id: result.id,
  });
  return "sent";
}

/** Load everything deliver() needs for one sign-up id. */
export async function loadParts(admin: SupabaseClient, signupId: string) {
  const { data: s } = await admin.from("signups").select("*").eq("id", signupId).single();
  if (!s) return null;
  const signup = s as Signup;
  const [{ data: ev }, { data: sh }] = await Promise.all([
    admin.from("events").select("*").eq("id", signup.event_id).single(),
    admin.from("shifts").select("*").eq("id", signup.shift_id).single(),
  ]);
  if (!ev || !sh) return null;
  const { data: org } = await admin
    .from("organizations")
    .select("id,name,time_zone,contact_email")
    .eq("id", (ev as Event).org_id)
    .single();
  if (!org) return null;
  return { signup, event: ev as Event, shift: sh as Shift, org: org as Org };
}
