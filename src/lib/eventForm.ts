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
    const blank = !name && !start && !end && !capRaw;
    if (blank) continue;
    if (!name || !start || !end || !capRaw) {
      return { ok: false, error: `Shift ${i + 1} needs a name, start, end and number of spots.` };
    }
    const s = zonedToUtc(date, start, tz);
    let e = zonedToUtc(date, end, tz);
    if (!s || !e) return { ok: false, error: `Shift ${i + 1} has an invalid time.` };
    if (e.getTime() <= s.getTime()) e = new Date(e.getTime() + 24 * 3600 * 1000); // past midnight
    const capacity = Math.max(1, Math.min(500, parseInt(capRaw, 10) || 0));
    if (!capacity) return { ok: false, error: `Shift ${i + 1} needs at least one spot.` };
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
