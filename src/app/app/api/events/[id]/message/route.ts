import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { dailyEmailLimit, emailsInLastDay, pickAudience } from "@/lib/broadcast";
import { getOrg, getSession, type Event, type Shift, type Signup } from "@/lib/db";
import { loadOptouts } from "@/lib/emails/optout";
import { isEmailConfigured, sendBatch } from "@/lib/emails/send";
import { buildBroadcast } from "@/lib/emails/templates";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function go(request: NextRequest, path: string, params: Record<string, string> = {}) {
  const url = new URL(path, request.url);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url, { status: 303 });
}

/** A coordinator emails everyone signed up for one of their events, or for one shift of it. */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session) return go(request, "/app");
  const org = await getOrg(session);
  if (!org) return go(request, "/app/setup");
  const page = `/app/events/${id}/message`;
  const fail = (error: string) => go(request, page, { error });

  const { data: evRaw } = await session.supabase.from("events").select("*").eq("id", id).eq("org_id", org.id).maybeSingle();
  if (!evRaw) return go(request, "/app/events", { error: "That event doesn't exist." });
  const event = evRaw as Event;

  const form = await request.formData();
  const audience = String(form.get("audience") || "all");
  const subject = String(form.get("subject") || "").replace(/[\r\n]+/g, " ").trim();
  const body = String(form.get("body") || "").trim();
  if (!subject) return fail("Add a subject line.");
  if (subject.length > 120) return fail("Keep the subject under 120 characters.");
  if (!body) return fail("Write a message.");
  if (body.length > 3000) return fail("Keep the message under 3,000 characters.");

  const admin = createAdminClient();
  if (!admin || !isEmailConfigured()) return fail("Email isn't set up on this site yet.");

  const [{ data: sh }, { data: su }, optouts] = await Promise.all([
    session.supabase.from("shifts").select("*").eq("event_id", id).order("sort_order"),
    session.supabase.from("signups").select("*").eq("event_id", id).order("created_at"),
    loadOptouts(session.supabase, org.id),
  ]);
  const shifts = (sh ?? []) as Shift[];
  if (audience !== "all" && !shifts.some((s) => s.id === audience)) return fail("Pick who this goes to.");
  const { send, off } = pickAudience((su ?? []) as Signup[], shifts, audience, optouts);
  if (send.length === 0) {
    return fail(off.length ? "Everyone in that group has turned emails off." : "Nobody is signed up there yet, so there's no one to email.");
  }

  // The same message twice in ten minutes is almost always a double click.
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: recent } = await session.supabase
    .from("broadcasts")
    .select("id")
    .eq("event_id", id)
    .eq("subject", subject)
    .eq("body", body)
    .gte("created_at", tenMinAgo)
    .limit(1);
  if (recent && recent.length > 0) return fail("That exact message already went out a few minutes ago.");

  const limit = dailyEmailLimit();
  const used = await emailsInLastDay(admin);
  if (used + send.length > limit) {
    return fail(
      `This would send ${send.length} email${send.length === 1 ? "" : "s"}, but the email plan allows ${limit} a day and ${used} went out in the last 24 hours. Send to one shift, wait a day, or upgrade the email plan.`,
    );
  }

  const base = siteUrl();
  const emails = send.map(({ signup, shift }) => {
    const m = buildBroadcast({ subject, body, signup, event, shift: audience === "all" ? null : shift, org, siteUrl: base });
    return { to: signup.email!, subject: m.subject, html: m.html, text: m.text, replyTo: org.contact_email, headers: m.headers };
  });
  const key = createHash("sha256")
    .update([id, audience, subject, body, Math.floor(Date.now() / 600000)].join("|"))
    .digest("hex")
    .slice(0, 40);
  const result = await sendBatch(emails, `bc-${key}`);
  if (result.sent === 0) return fail(`The message didn't send. ${result.error || ""}`.trim());

  // Keep a record. If the table isn't there yet the email still went; say so.
  const { error: logError } = await admin.from("broadcasts").insert({
    org_id: org.id,
    event_id: id,
    shift_id: audience === "all" ? null : audience,
    subject,
    body,
    recipient_count: result.sent,
    skipped_count: off.length,
    sent_by: session.email,
  });

  const params: Record<string, string> = { sent: String(result.sent) };
  if (result.failed) params.failed = String(result.failed);
  if (logError) params.nolog = "1";
  return go(request, page, params);
}
