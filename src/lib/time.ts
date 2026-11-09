/** Time helpers. All storage is UTC; display and input use the organization's time zone. */

export const DEFAULT_TZ = "America/Los_Angeles";

export const TIME_ZONES = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Phoenix",
  "America/Chicago",
  "America/New_York",
  "America/Anchorage",
  "Pacific/Honolulu",
];

/** Offset (ms) of `tz` from UTC at the given instant. */
function tzOffsetMs(date: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - date.getTime();
}

/** "2026-05-18" + "09:00" in `tz` → UTC Date. */
export function zonedToUtc(dateStr: string, timeStr: string, tz: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  const t = /^(\d{2}):(\d{2})$/.exec(timeStr);
  if (!m || !t) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +t[1], +t[2]);
  // Two passes handle DST edges well enough for event scheduling.
  let utc = guess - tzOffsetMs(new Date(guess), tz);
  utc = guess - tzOffsetMs(new Date(utc), tz);
  return new Date(utc);
}

/** UTC instant → { date: "YYYY-MM-DD", time: "HH:MM" } in `tz`, for form inputs. */
export function utcToZonedInputs(iso: string, tz: string): { date: string; time: string } {
  const d = new Date(iso);
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const p = Object.fromEntries(dtf.formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

export function fmtDate(iso: string, tz: string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
    ...opts,
  }).format(new Date(iso));
}

export function fmtTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" })
    .format(new Date(iso))
    .replace(":00", "");
}

export function fmtRange(startIso: string, endIso: string, tz: string): string {
  return `${fmtTime(startIso, tz)} to ${fmtTime(endIso, tz)}`;
}

export function fmtLongDate(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

/** Month/day pieces for the little date tile. */
export function dateTile(iso: string, tz: string): { dow: string; day: string } {
  const d = new Date(iso);
  return {
    dow: new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(d).toUpperCase(),
    day: new Intl.DateTimeFormat("en-US", { timeZone: tz, day: "numeric" }).format(d),
  };
}
