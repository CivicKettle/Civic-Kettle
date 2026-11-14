import { CONTACT_EMAIL } from "@/lib/contact";
import { buildNewOrgNotice } from "@/lib/emails/templates";
import { sendEmail } from "@/lib/emails/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/supabase/server";

/** Where CivicKettle's own notices go. Set NOTIFY_EMAIL to change it. */
function noticeAddress(): string {
  return (process.env.NOTIFY_EMAIL || "").trim() || CONTACT_EMAIL;
}

/**
 * Tell CivicKettle that an organization just created a workspace, so a new
 * sign-up is never missed. Never throws and never blocks the sign-up: if the
 * email fails, the workspace still exists.
 */
export async function notifyNewOrg(org: { name: string; timeZone: string }, coordinatorEmail: string): Promise<void> {
  try {
    const to = noticeAddress();
    // Creating a workspace from the notice address itself is a test, not news.
    if (coordinatorEmail.trim().toLowerCase() === to.toLowerCase()) {
      console.log("[notify] skipped: the workspace was created from the notice address itself");
      return;
    }

    let total: number | null = null;
    const admin = createAdminClient();
    if (admin) {
      const { data } = await admin.from("organizations").select("id");
      if (data) total = data.length;
    }
    const when = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Los_Angeles" }).format(new Date()) + " Pacific";
    const msg = buildNewOrgNotice({ orgName: org.name, email: coordinatorEmail, timeZone: org.timeZone, when, total, siteUrl: siteUrl() });
    const result = await sendEmail({ to, subject: msg.subject, html: msg.html, text: msg.text, replyTo: coordinatorEmail });
    // Shows up in the host's logs, so a notice that didn't arrive can be traced.
    if (result.ok) console.log(`[notify] new workspace notice sent for "${org.name}"`);
    else console.error(`[notify] new workspace notice failed for "${org.name}": ${result.error}`);
  } catch (err) {
    console.error("[notify] new workspace notice crashed:", err);
  }
}
