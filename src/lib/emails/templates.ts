import type { Event, Organization, Shift, Signup } from "@/lib/db";
import { fmtLongDate, fmtRange } from "@/lib/time";
import { unsubscribeHeaders, unsubscribeUrl } from "./optout";

export type MessageKind = "confirmation" | "day_before" | "morning_of" | "cancelled" | "waitlist" | "promoted";

export type MessageContext = {
  signup: Signup;
  event: Event;
  shift: Shift;
  org: Pick<Organization, "name" | "time_zone" | "contact_email">;
  siteUrl: string;
};

/** A button that survives email apps: a padded link, no images. */
function button(href: string, label: string, kind: "solid" | "outline" | "danger" = "solid"): string {
  const style =
    kind === "solid"
      ? "background:#2b3c30;color:#f7f5ee;border:1.5px solid #2b3c30"
      : kind === "danger"
        ? "background:#faf8f2;color:#a64d32;border:1.5px solid #a64d32"
        : "background:#faf8f2;color:#2b3c30;border:1.5px solid #2b3c30";
  return `<a href="${href}" style="display:inline-block;margin:0 8px 8px 0;padding:12px 18px;border-radius:4px;font-size:15px;font-weight:600;text-decoration:none;${style}">${label}</a>`;
}

/** The green band at the top of every email, with the organization's name. */
function band(name: string): string {
  return `<tr><td style="background:#2b3c30;border-bottom:4px solid #e3b04b;padding:16px 28px;font-size:15px;font-weight:600;color:#f4f2e9">${esc(name)}</td></tr>`;
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Who the message addresses: the guardian for a minor, otherwise the volunteer. */
export function salutation(signup: Signup): string {
  if (signup.is_minor && signup.guardian_name) return signup.guardian_name.split(/\s+/)[0];
  return signup.volunteer_name.split(/\s+/)[0];
}

/** Where the message goes. Minors: the email on file is the guardian's. */
export function recipient(signup: Signup): string | null {
  return signup.email;
}

export function buildMessage(kind: MessageKind, ctx: MessageContext): { subject: string; html: string; text: string; headers: Record<string, string> } {
  const { signup, event, shift, org, siteUrl } = ctx;
  const tz = org.time_zone;
  const who = signup.is_minor ? signup.volunteer_name : "you";
  const whoCap = signup.is_minor ? signup.volunteer_name : "You";
  const cancelUrl = `${siteUrl}/v/cancel/${signup.cancel_token}`;
  const eventUrl = `${siteUrl}/v/${event.public_token}`;
  const offUrl = unsubscribeUrl(siteUrl, signup.cancel_token);
  const mineUrl = `${siteUrl}/v/mine/${signup.cancel_token}`;
  const confirmUrl = `${siteUrl}/v/confirm/${signup.cancel_token}`;
  const when = `${fmtLongDate(shift.starts_at, tz)}, ${fmtRange(shift.starts_at, shift.ends_at, tz)}`;

  const details = [
    ["Event", event.title],
    ["Shift", shift.name],
    ["When", when],
    event.location ? ["Where", event.location] : null,
  ].filter(Boolean) as [string, string][];

  let subject = "";
  let lead = "";
  let note = "";
  switch (kind) {
    case "confirmation":
      subject = `${whoCap === "You" ? "You're" : `${signup.volunteer_name} is`} signed up: ${event.title}`;
      lead = `${whoCap === "You" ? "You're" : `${signup.volunteer_name} is`} on the list for ${event.title} with ${org.name}. Here's everything in one place.`;
      note = event.description || "";
      break;
    case "day_before":
      subject = `Tomorrow: ${event.title}, ${shift.name}`;
      lead = `A quick reminder that ${who === "you" ? "you're" : `${signup.volunteer_name} is`} volunteering tomorrow with ${org.name}. Please let them know ${who === "you" ? "you're" : `${signup.volunteer_name} is`} coming.`;
      note = event.description || "";
      break;
    case "morning_of":
      subject = `Today: ${event.title} at ${fmtRange(shift.starts_at, shift.ends_at, tz).split(" to ")[0]}`;
      lead = `It's today. ${org.name} is looking forward to seeing ${who}.`;
      note = event.notes_for_volunteers || event.description || "";
      break;
    case "waitlist":
      subject = `You're on the waiting list: ${event.title}`;
      lead = `${shift.name} is full right now, so ${who === "you" ? "you're" : `${signup.volunteer_name} is`} on the waiting list for ${event.title} with ${org.name}. If a spot opens, ${who === "you" ? "you'll" : "they'll"} be moved in automatically and you'll get an email right away. There's nothing else to do.`;
      break;
    case "promoted":
      subject = `A spot opened: ${whoCap === "You" ? "you're" : `${signup.volunteer_name} is`} in for ${event.title}`;
      lead = `Good news. A spot opened up, and ${who === "you" ? "you're" : `${signup.volunteer_name} is`} now signed up for ${event.title} with ${org.name}.`;
      note = event.description || "";
      break;
    case "cancelled":
      subject = `Cancelled: ${event.title}, ${shift.name}`;
      lead = `${whoCap === "You" ? "Your" : `${signup.volunteer_name}'s`} sign-up for ${event.title} has been cancelled and the spot is open for someone else. Thanks for letting ${org.name} know.`;
      break;
  }

  const arrive = kind === "morning_of" || kind === "day_before"
    ? `On arrival, scan the QR code at the event to check in, or open ${eventUrl}`
    : "";
  const hi = `Hi ${salutation(signup)},`;
  const contact = org.contact_email ? `Questions? Reply to this email or write to ${org.contact_email}.` : "Questions? Reply to this email.";
  const cancelLine = kind === "cancelled" ? `Changed your mind? Sign up again: ${eventUrl}` : kind === "waitlist" ? `Don't want to wait? Leave the waiting list: ${cancelUrl}` : `Can't make it? Cancel in one tap: ${cancelUrl}`;

  const text = [
    hi,
    "",
    lead,
    "",
    ...details.map(([k, v]) => `${k}: ${v}`),
    note ? `\n${note}` : "",
    arrive ? `\n${arrive}` : "",
    "",
    kind === "day_before" ? `Confirm ${who === "you" ? "you're" : `${signup.volunteer_name} is`} coming: ${confirmUrl}` : "",
    cancelLine,
    `See or change all your shifts: ${mineUrl}`,
    kind === "cancelled" || kind === "waitlist" ? "" : `Add to your calendar: ${siteUrl}/v/ics/${signup.cancel_token}`,
    "",
    contact,
    "",
    `Sent by CivicKettle on behalf of ${org.name}. ${siteUrl}`,
    `Stop reminder emails and messages from ${org.name}: ${offUrl}`,
  ].join("\n");

  const html = `<!doctype html><html><body style="margin:0;background:#f2f0e9;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#252b25">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f0e9"><tr><td align="center" style="padding:28px 16px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px">
  ${band(org.name)}
  <tr><td style="background:#faf8f2;border:1px solid #d5d3c9;border-top:0;padding:28px 28px 24px">
    <p style="margin:0 0 14px;font-size:16px">${esc(hi)}</p>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.55">${esc(lead)}</p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="font-size:15px;line-height:1.5">
      ${details.map(([k, v]) => `<tr><td style="padding:3px 16px 3px 0;color:#626b60;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:3px 0"><strong style="font-weight:600">${esc(v)}</strong></td></tr>`).join("")}
    </table>
    ${note ? `<p style="margin:18px 0 0;padding:12px 14px;background:#e9eee2;font-size:14px;line-height:1.55;color:#2b3c30">${esc(note)}</p>` : ""}
    ${kind === "day_before" ? `<p style="margin:22px 0 0">${button(confirmUrl, who === "you" ? "Yes, I'll be there" : `Yes, ${esc(signup.volunteer_name.split(" ")[0])} will be there`)}</p>` : ""}
    ${arrive ? `<p style="margin:18px 0 0;font-size:14px;line-height:1.55">On arrival, scan the QR code at the event to check in, or <a href="${eventUrl}" style="color:#2b3c30">open the event page</a>.</p>` : ""}
    <p style="margin:24px 0 10px;font-size:14px;line-height:1.55;color:#4a514a">${kind === "cancelled" ? "Changed your mind?" : kind === "waitlist" ? "Don't want to wait?" : "Plans change? Switch shifts or cancel, no login needed."}</p>
    <p style="margin:0">${kind === "cancelled" ? button(eventUrl, "Sign up again") + button(mineUrl, "See my shifts", "outline") : kind === "waitlist" ? button(mineUrl, "See my shifts") + button(cancelUrl, "Leave the waiting list", "danger") : kind === "day_before" ? button(mineUrl, "See or change my shifts", "outline") + button(cancelUrl, "Cancel this shift", "danger") : button(mineUrl, "See or change my shifts") + button(`${siteUrl}/v/ics/${signup.cancel_token}`, "Add to calendar", "outline") + button(cancelUrl, "Cancel this shift", "danger")}</p>
    <p style="margin:14px 0 0;font-size:13px;line-height:1.55;color:#626b60">${esc(contact)}</p>
  </td></tr>
  <tr><td style="padding:14px 4px 0;font-size:12px;color:#8a8d83;line-height:1.5">Sent by <a href="${siteUrl}" style="color:#626b60">CivicKettle</a> on behalf of ${esc(org.name)}, because of a volunteer sign-up. <a href="${offUrl}" style="color:#626b60">Stop reminder emails and messages from ${esc(org.name)}</a>.</td></tr>
</table></td></tr></table></body></html>`;

  return { subject, html, text, headers: unsubscribeHeaders(siteUrl, signup.cancel_token) };
}

/** A coordinator's own message to the people signed up for an event. */
export function buildBroadcast(ctx: {
  subject: string;
  body: string;
  signup: Signup;
  event: Event;
  shift: Shift | null;
  org: Pick<Organization, "name" | "time_zone" | "contact_email">;
  siteUrl: string;
}): { subject: string; html: string; text: string; headers: Record<string, string> } {
  const { signup, event, shift, org, siteUrl } = ctx;
  const tz = org.time_zone;
  const offUrl = unsubscribeUrl(siteUrl, signup.cancel_token);
  const eventUrl = `${siteUrl}/v/${event.public_token}`;
  const hi = `Hi ${salutation(signup)},`;
  const about = shift
    ? `${event.title}, ${shift.name}: ${fmtLongDate(shift.starts_at, tz)}, ${fmtRange(shift.starts_at, shift.ends_at, tz)}`
    : `${event.title}: ${fmtLongDate(event.starts_at, tz)}`;
  const paragraphs = ctx.body.replace(/\r\n?/g, "\n").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const contact = org.contact_email ? `Reply to this email to reach ${org.name}, or write to ${org.contact_email}.` : `Reply to this email to reach ${org.name}.`;

  const text = [
    hi,
    "",
    ...paragraphs.flatMap((p) => [p, ""]),
    `About: ${about}`,
    `Event page: ${eventUrl}`,
    `Your shifts: ${siteUrl}/v/mine/${signup.cancel_token}`,
    "",
    contact,
    "",
    `Sent by ${org.name} through CivicKettle. ${siteUrl}`,
    `Stop reminder emails and messages from ${org.name}: ${offUrl}`,
  ].join("\n");

  const html = `<!doctype html><html><body style="margin:0;background:#f2f0e9;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#252b25">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f0e9"><tr><td align="center" style="padding:28px 16px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px">
  ${band(org.name)}
  <tr><td style="background:#faf8f2;border:1px solid #d5d3c9;border-top:0;padding:28px 28px 24px">
    <p style="margin:0 0 14px;font-size:16px">${esc(hi)}</p>
    ${paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.55">${esc(p).replace(/\n/g, "<br>")}</p>`).join("")}
    <p style="margin:18px 0 0;padding:12px 14px;background:#e9eee2;font-size:14px;line-height:1.55;color:#2b3c30">${esc(about)}</p>
    <p style="margin:16px 0 0">${button(`${siteUrl}/v/mine/${signup.cancel_token}`, "See or change my shifts")}${button(eventUrl, "Open the event page", "outline")}</p>
    <p style="margin:14px 0 0;font-size:13px;line-height:1.55;color:#626b60">${esc(contact)}</p>
  </td></tr>
  <tr><td style="padding:14px 4px 0;font-size:12px;color:#8a8d83;line-height:1.5">Sent by ${esc(org.name)} through <a href="${siteUrl}" style="color:#626b60">CivicKettle</a>, because of a volunteer sign-up. <a href="${offUrl}" style="color:#626b60">Stop reminder emails and messages from ${esc(org.name)}</a>.</td></tr>
</table></td></tr></table></body></html>`;

  return { subject: ctx.subject, html, text, headers: unsubscribeHeaders(siteUrl, signup.cancel_token) };
}


/** Invitation for a second coordinator to join an organization's workspace. */
export function buildInvite(ctx: { orgName: string; invitedBy: string; email: string; siteUrl: string }): { subject: string; html: string; text: string } {
  const { orgName, invitedBy, email, siteUrl } = ctx;
  const signIn = `${siteUrl}/app?new=1&email=${encodeURIComponent(email)}`;
  const subject = `You've been added as a coordinator for ${orgName}`;
  const lead = `${invitedBy} added you as a volunteer coordinator for ${orgName} on CivicKettle, where the team keeps its sign-ups, check-ins and volunteer hours.`;
  const how = `To get in, open the link below and ask for a sign-in link at this email address (${email}). When you open that link you'll choose a password, and after that you sign in with your email and password.`;
  const text = ["Hi,", "", lead, "", how, "", `Sign in: ${signIn}`, "", "If you weren't expecting this, you can ignore it and nothing will happen.", "", `CivicKettle. ${siteUrl}`].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#f2f0e9;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#252b25">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f0e9"><tr><td align="center" style="padding:28px 16px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px">
  ${band(orgName)}
  <tr><td style="background:#faf8f2;border:1px solid #d5d3c9;border-top:0;padding:28px 28px 24px">
    <p style="margin:0 0 14px;font-size:16px">Hi,</p>
    <p style="margin:0 0 14px;font-size:16px;line-height:1.55">${esc(lead)}</p>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.55">${esc(how)}</p>
    <p style="margin:0">${button(signIn, "Get started")}</p>
    <p style="margin:20px 0 0;font-size:13px;line-height:1.55;color:#626b60">If you weren't expecting this, you can ignore it and nothing will happen.</p>
  </td></tr>
  <tr><td style="padding:14px 4px 0;font-size:12px;color:#8a8d83;line-height:1.5"><a href="${siteUrl}" style="color:#626b60">CivicKettle</a></td></tr>
</table></td></tr></table></body></html>`;
  return { subject, html, text };
}

/** A note to CivicKettle itself when a new organization creates a workspace. */
export function buildNewOrgNotice(ctx: { orgName: string; email: string; timeZone: string; when: string; total: number | null; siteUrl: string }): { subject: string; html: string; text: string } {
  const { orgName, email, timeZone, when, total, siteUrl } = ctx;
  const subject = `New workspace: ${orgName}`;
  const count = total === null ? "" : total === 1 ? "That makes 1 workspace in total." : `That makes ${total} workspaces in total.`;
  const rows: [string, string][] = [["Organization", orgName], ["Coordinator", email], ["Time zone", timeZone], ["Created", when]];
  const text = [`${orgName} just created a workspace on CivicKettle.`, "", ...rows.map(([l, v]) => `${l}: ${v}`), "", count, "Reply to this email to write to the coordinator directly.", "", `CivicKettle. ${siteUrl}`].filter((line, i, all) => !(line === "" && all[i - 1] === "")).join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#f2f0e9;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#252b25">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f0e9"><tr><td align="center" style="padding:28px 16px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px">
  ${band("CivicKettle")}
  <tr><td style="background:#faf8f2;border:1px solid #d5d3c9;border-top:0;padding:28px 28px 24px">
    <p style="margin:0 0 18px;font-size:16px;line-height:1.55"><strong>${esc(orgName)}</strong> just created a workspace.</p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="font-size:15px;line-height:1.5">
      ${rows.map(([l, v]) => `<tr><td style="padding:3px 18px 3px 0;color:#626b60;vertical-align:top">${l}</td><td style="padding:3px 0;font-weight:600">${esc(v)}</td></tr>`).join("\n      ")}
    </table>
    ${count ? `<p style="margin:18px 0 0;font-size:15px;line-height:1.55">${count}</p>` : ""}
    <p style="margin:18px 0 0;font-size:13px;line-height:1.55;color:#626b60">Reply to this email to write to the coordinator directly.</p>
  </td></tr>
</table></td></tr></table></body></html>`;
  return { subject, html, text };
}
