import type { Event, Organization, Shift, Signup } from "@/lib/db";

type Parts = { signup: Pick<Signup, "id" | "cancel_token" | "volunteer_name" | "is_minor">; event: Pick<Event, "title" | "location" | "description">; shift: Pick<Shift, "name" | "starts_at" | "ends_at">; org: Pick<Organization, "name">; siteUrl: string };

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Lines over 75 bytes are folded, as the calendar format requires. */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 73) {
    out.push(rest.slice(0, 73));
    rest = " " + rest.slice(73);
  }
  out.push(rest);
  return out.join("\r\n");
}

function title(p: Parts): string {
  return `Volunteer: ${p.event.title} (${p.shift.name})`;
}

function details(p: Parts): string {
  return [
    `${p.signup.is_minor ? `${p.signup.volunteer_name} is` : "You're"} volunteering with ${p.org.name}.`,
    p.event.description || "",
    `See or change your shifts: ${p.siteUrl}/v/mine/${p.signup.cancel_token}`,
  ].filter(Boolean).join("\n\n");
}

/** A calendar file for one shift. Opens in Apple Calendar, Outlook, and most other calendar apps. */
export function icsFor(p: Parts): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CivicKettle//Volunteer shift//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${p.signup.id}@civickettle.com`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(p.shift.starts_at)}`,
    `DTEND:${stamp(p.shift.ends_at)}`,
    `SUMMARY:${esc(title(p))}`,
    p.event.location ? `LOCATION:${esc(p.event.location)}` : "",
    `DESCRIPTION:${esc(details(p))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** A link that opens Google Calendar with the shift filled in. */
export function googleCalendarUrl(p: Parts): string {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: title(p),
    dates: `${stamp(p.shift.starts_at)}/${stamp(p.shift.ends_at)}`,
    details: details(p),
  });
  if (p.event.location) q.set("location", p.event.location);
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}
