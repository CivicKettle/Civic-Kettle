import { after, NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildCheckinLink } from "@/lib/emails/templates";
import { sendEmail } from "@/lib/emails/send";
import { clientIp, withinLimits } from "@/lib/rateLimit";
import { siteUrl } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Public: "find my sign-up" on a phone that didn't make it.
 *
 * Typing an email address proves nothing about who is typing it, so this never
 * links the sign-up to the phone directly. It emails a check-in link to the
 * address already on the sign-up, and only the person who can read that inbox
 * can use it. The page says the same thing whether or not a sign-up exists,
 * and the lookup runs after the reply is sent, so a stranger can't use this to
 * learn who has signed up.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const token = String(form.get("token") || "");
  const who = String(form.get("who") || "").trim().toLowerCase();
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url), { status: 303 });
  if (!/^[a-f0-9]{8,16}$/i.test(token)) return to("/");
  const page = `/v/${token}/checkin`;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(who) || who.length > 254) return to(`${page}?bademail=1`);

  const admin = createAdminClient();
  if (!admin) return to(`${page}?error=${encodeURIComponent("Check-in links aren't switched on yet. See the coordinator.")}`);

  const { data: ev } = await admin.from("events").select("id,title,org_id").eq("public_token", token).maybeSingle();
  if (!ev) return to("/");

  // Counted against the typed address whether or not it has a sign-up, so the
  // limit itself gives nothing away.
  const allowed = await withinLimits([
    { action: "find-ip", who: clientIp(request), max: 10, minutes: 15 },
    { action: "find-email", who: `${ev.id}|${who}`, max: 3, minutes: 30 },
  ]);
  if (!allowed) return to(`${page}?error=${encodeURIComponent("That's a lot of tries. Wait a few minutes, or see the coordinator.")}`);

  after(async () => {
    try {
      const { data: rows } = await admin
        .from("signups")
        .select("cancel_token,volunteer_name")
        .eq("event_id", ev.id)
        .eq("status", "confirmed")
        .eq("email", who)
        .order("created_at", { ascending: true });
      if (!rows || rows.length === 0) return;
      const { data: org } = await admin.from("organizations").select("name,contact_email").eq("id", ev.org_id).maybeSingle();
      const base = siteUrl();
      const msg = buildCheckinLink({
        orgName: org?.name || "CivicKettle",
        eventTitle: ev.title,
        names: rows.map((r) => r.volunteer_name),
        url: `${base}/v/here/${rows[0].cancel_token}`,
        siteUrl: base,
      });
      const result = await sendEmail({ to: who, subject: msg.subject, html: msg.html, text: msg.text, replyTo: org?.contact_email });
      if (!result.ok) console.error(`[email] check-in link failed: ${result.error}`);
    } catch (err) {
      console.error("[find] lookup failed", err);
    }
  });

  return to(`${page}?sent=1`);
}
