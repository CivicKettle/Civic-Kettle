import type { Event, Organization, Shift, Signup } from "@/lib/db";
import { fmtLongDate, fmtRange } from "@/lib/time";
import { unsubscribeHeaders, unsubscribeUrl } from "./optout";

export type MessageKind = "confirmation" | "day_before" | "morning_of" | "cancelled";

export type MessageContext = {
  signup: Signup;
  event: Event;
  shift: Shift;
  org: Pick<Organization, "name" | "time_zone" | "contact_email">;
  siteUrl: string;
};

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
      lead = `A quick reminder that ${who === "you" ? "you're" : `${signup.volunteer_name} is`} volunteering tomorrow with ${org.name}.`;
      note = event.description || "";
      break;
    case "morning_of":
      subject = `Today: ${event.title} at ${fmtRange(shift.starts_at, shift.ends_at, tz).split(" to ")[0]}`;
      lead = `It's today. ${org.name} is looking forward to seeing ${who}.`;
      note = event.notes_for_volunteers || event.description || "";
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
  const cancelLine = kind === "cancelled" ? `Changed your mind? Sign up again: ${eventUrl}` : `Can't make it? Cancel in one tap: ${cancelUrl}`;

  const text = [
    hi,
    "",
    lead,
    "",
    ...details.map(([k, v]) => `${k}: ${v}`),
    note ? `\n${note}` : "",
    arrive ? `\n${arrive}` : "",
    "",
    cancelLine,
    "",
    contact,
    "",
    `Sent by CivicKettle on behalf of ${org.name}. ${siteUrl}`,
    `Stop reminder emails and messages from ${org.name}: ${offUrl}`,
  ].join("\n");

  const html = `<!doctype html><html><body style="margin:0;background:#f2f0e9;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#252b25">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f0e9"><tr><td align="center" style="padding:28px 16px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px">
  <tr><td style="padding:0 4px 14px;font-size:13px;color:#626b60">${esc(org.name)}</td></tr>
  <tr><td style="background:#faf8f2;border:1px solid #d5d3c9;padding:28px 28px 24px">
    <p style="margin:0 0 14px;font-size:16px">${esc(hi)}</p>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.55">${esc(lead)}</p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="font-size:15px;line-height:1.5">
      ${details.map(([k, v]) => `<tr><td style="padding:3px 16px 3px 0;color:#626b60;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:3px 0"><strong style="font-weight:600">${esc(v)}</strong></td></tr>`).join("")}
    </table>
    ${note ? `<p style="margin:18px 0 0;padding:12px 14px;background:#e9eee2;font-size:14px;line-height:1.55;color:#2b3c30">${esc(note)}</p>` : ""}
    ${arrive ? `<p style="margin:18px 0 0;font-size:14px;line-height:1.55">On arrival, scan the QR code at the event to check in, or <a href="${eventUrl}" style="color:#2b3c30">open the event page</a>.</p>` : ""}
    <p style="margin:22px 0 0;font-size:14px;line-height:1.55">${kind === "cancelled" ? `Changed your mind? <a href="${eventUrl}" style="color:#2b3c30">Sign up again</a>.` : `Can't make it? <a href="${cancelUrl}" style="color:#2b3c30">Cancel in one tap</a>.`}</p>
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
    "",
    contact,
    "",
    `Sent by ${org.name} through CivicKettle. ${siteUrl}`,
    `Stop reminder emails and messages from ${org.name}: ${offUrl}`,
  ].join("\n");

  const html = `<!doctype html><html><body style="margin:0;background:#f2f0e9;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#252b25">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f0e9"><tr><td align="center" style="padding:28px 16px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px">
  <tr><td style="padding:0 4px 14px;font-size:13px;color:#626b60">${esc(org.name)}</td></tr>
  <tr><td style="background:#faf8f2;border:1px solid #d5d3c9;padding:28px 28px 24px">
    <p style="margin:0 0 14px;font-size:16px">${esc(hi)}</p>
    ${paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.55">${esc(p).replace(/\n/g, "<br>")}</p>`).join("")}
    <p style="margin:18px 0 0;padding:12px 14px;background:#e9eee2;font-size:14px;line-height:1.55;color:#2b3c30">${esc(about)}<br><a href="${eventUrl}" style="color:#2b3c30">Open the event page</a></p>
    <p style="margin:14px 0 0;font-size:13px;line-height:1.55;color:#626b60">${esc(contact)}</p>
  </td></tr>
  <tr><td style="padding:14px 4px 0;font-size:12px;color:#8a8d83;line-height:1.5">Sent by ${esc(org.name)} through <a href="${siteUrl}" style="color:#626b60">CivicKettle</a>, because of a volunteer sign-up. <a href="${offUrl}" style="color:#626b60">Stop reminder emails and messages from ${esc(org.name)}</a>.</td></tr>
</table></td></tr></table></body></html>`;

  return { subject: ctx.subject, html, text, headers: unsubscribeHeaders(siteUrl, signup.cancel_token) };
}
