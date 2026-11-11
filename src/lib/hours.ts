import { attendance, type Attendance } from "@/lib/attendance";
import type { Event, Shift, Signup } from "@/lib/db";

export type HoursEntry = {
  signup: Signup;
  shift: Shift;
  event: Pick<Event, "id" | "title" | "starts_at">;
  a: Attendance;
  /** Hours that count: the coordinator's correction if there is one, else check-in to check-out. Null while still on shift. */
  hours: number | null;
  edited: boolean;
  approved: boolean;
};

export function toEntry(signup: Signup, shift: Shift, event: Pick<Event, "id" | "title" | "starts_at">, now: number = Date.now()): HoursEntry {
  const a = attendance(signup, shift, now);
  const override = signup.hours_override;
  const edited = override !== null && override !== undefined;
  const hours = edited ? Number(override) : a.state === "done" ? a.hours : null;
  return { signup, shift, event, a, hours, edited, approved: Boolean(signup.hours_approved_at) };
}

export function sumHours(entries: HoursEntry[]): number {
  return Math.round(entries.reduce((t, e) => t + (e.hours ?? 0), 0) * 100) / 100;
}

/** One line per person, keyed by email (or name when there is no email). */
export function byVolunteer(entries: HoursEntry[]) {
  const map = new Map<string, { name: string; email: string | null; minor: boolean; events: Set<string>; approved: number; pending: number }>();
  for (const e of entries) {
    const key = `${e.signup.volunteer_name.trim().toLowerCase()}|${(e.signup.email || "").toLowerCase()}`;
    const row = map.get(key) ?? { name: e.signup.volunteer_name, email: e.signup.email, minor: e.signup.is_minor, events: new Set<string>(), approved: 0, pending: 0 };
    row.events.add(e.event.id);
    if (e.approved) row.approved += e.hours ?? 0;
    else row.pending += e.hours ?? 0;
    map.set(key, row);
  }
  return [...map.values()]
    .map((r) => ({ ...r, events: r.events.size, approved: Math.round(r.approved * 100) / 100, pending: Math.round(r.pending * 100) / 100 }))
    .sort((x, y) => y.approved + y.pending - (x.approved + x.pending) || x.name.localeCompare(y.name));
}

/** CSV with Excel-friendly quoting. Cells that could be read as formulas are neutralized. */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  const cell = (v: string | number | null | undefined) => {
    let s = v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s) && typeof v !== "number") s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
