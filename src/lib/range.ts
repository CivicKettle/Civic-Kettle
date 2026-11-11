import { utcToZonedInputs, zonedToUtc } from "@/lib/time";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** A date range in the organization's time zone. Defaults to the current month to date. */
export function parseRange(from: string | undefined, to: string | undefined, tz: string) {
  const today = utcToZonedInputs(new Date().toISOString(), tz).date;
  let f = from && DAY.test(from) ? from : `${today.slice(0, 8)}01`;
  let t = to && DAY.test(to) ? to : today;
  if (f > t) [f, t] = [t, f];
  const start = zonedToUtc(f, "00:00", tz) ?? new Date(0);
  const endDay = zonedToUtc(t, "00:00", tz) ?? new Date();
  const end = new Date(endDay.getTime() + 24 * 3600 * 1000);
  return { from: f, to: t, startIso: start.toISOString(), endIso: end.toISOString() };
}

export function presets(tz: string) {
  const today = utcToZonedInputs(new Date().toISOString(), tz).date;
  const [y, m] = today.split("-").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const lastMonthEnd = new Date(Date.UTC(y, m - 1, 0));
  const ly = lastMonthEnd.getUTCFullYear();
  const lm = lastMonthEnd.getUTCMonth() + 1;
  return [
    { label: "This month", from: `${y}-${pad(m)}-01`, to: today },
    { label: "Last month", from: `${ly}-${pad(lm)}-01`, to: `${ly}-${pad(lm)}-${pad(lastMonthEnd.getUTCDate())}` },
    { label: "This year", from: `${y}-01-01`, to: today },
  ];
}
