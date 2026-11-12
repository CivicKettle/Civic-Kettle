import { zonedToUtc } from "@/lib/time";

export type ParsedShift = {
  id?: string;
  name: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  sort_order: number;
};

export type ParsedEvent = {
  title: string;
  description: string | null;
  location: string | null;
  notes_for_volunteers: string | null;
  starts_at: string;
  ends_at: string;
  shifts: ParsedShift[];
};

/** Turn the event form into clean data, or an error message. */
export function parseEventForm(form: FormData, tz: string): { ok: true; data: ParsedEvent } | { ok: false; error: string } {
  const title = String(form.get("title") || "").trim();
  const date = String(form.get("date") || "");
  if (title.length < 2) return { ok: false, error: "Give the event a title." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: "Pick a date." };

  const shifts: ParsedShift[] = [];
  for (let i = 0; i < 5; i++) {
    const name = String(form.get(`shift_name_${i}`) || "").trim();
    const start = String(form.get(`shift_start_${i}`) || "");
    const end = String(form.get(`shift_end_${i}`) || "");
    const capRaw = String(form.get(`shift_capacity_${i}`) || "");
    const id = String(form.get(`shift_id_${i}`) || "") || undefined;
    const blank = !name && !start && !end;
    if (blank) continue;
    if (!name || !start || !end) {
      const missing = [!name && "a name", !start && "a start time", !end && "an end time"].filter(Boolean).join(", ");
      return { ok: false, error: `Shift ${i + 1} is missing ${missing}.` };
    }
    const s = zonedToUtc(date, start, tz);
    let e = zonedToUtc(date, end, tz);
    if (!s || !e) return { ok: false, error: `Shift ${i + 1} has an invalid time.` };
    if (e.getTime() <= s.getTime()) e = new Date(e.getTime() + 24 * 3600 * 1000); // past midnight
    const capacity = Math.max(1, Math.min(500, parseInt(capRaw, 10) || 8));
    shifts.push({ id, name, starts_at: s.toISOString(), ends_at: e.toISOString(), capacity, sort_order: i });
  }
  if (shifts.length === 0) return { ok: false, error: "Add at least one shift so volunteers have something to sign up for." };

  const starts_at = shifts.map((s) => s.starts_at).sort()[0];
  const ends_at = shifts.map((s) => s.ends_at).sort().slice(-1)[0];

  return {
    ok: true,
    data: {
      title,
      description: String(form.get("description") || "").trim() || null,
      location: String(form.get("location") || "").trim() || null,
      notes_for_volunteers: String(form.get("notes_for_volunteers") || "").trim() || null,
      starts_at,
      ends_at,
      shifts,
    },
  };
}

/** Which automatic reminders the form asked for, or null if the form didn't include the choice. */
export function reminderChoice(form: FormData): { remind_day_before: boolean; remind_morning_of: boolean } | null {
  if (!form.get("reminders_present")) return null;
  return { remind_day_before: form.get("remind_day_before") !== null, remind_morning_of: form.get("remind_morning_of") !== null };
}

export type Repeat = "none" | "weekly" | "biweekly" | "monthly";

/**
 * The dates of a repeating event, as YYYY-MM-DD strings, starting with the
 * first. Monthly keeps the day of the month (the 31st becomes the last day of
 * a shorter month). At most 12 dates in total.
 */
export function repeatDates(first: string, repeat: Repeat, more: number): string[] {
  const out = [first];
  if (repeat === "none" || !/^\d{4}-\d{2}-\d{2}$/.test(first)) return out;
  const [y, m, d] = first.split("-").map(Number);
  const n = Math.max(0, Math.min(11, Math.floor(more) || 0));
  for (let i = 1; i <= n; i++) {
    let dt: Date;
    if (repeat === "monthly") {
      const lastDay = new Date(Date.UTC(y, m - 1 + i + 1, 0)).getUTCDate();
      dt = new Date(Date.UTC(y, m - 1 + i, Math.min(d, lastDay)));
    } else {
      dt = new Date(Date.UTC(y, m - 1, d + i * (repeat === "weekly" ? 7 : 14)));
    }
    out.push(dt.toISOString().slice(0, 10));
  }
  return out;
}
