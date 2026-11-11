import type { Event, Shift, Signup } from "@/lib/db";

/** Check-in opens this many minutes before a shift starts. */
export const CHECKIN_OPENS_MIN = 60;
/** Self check-out is accepted this long after a shift ends; after that the shift end is used. */
export const CHECKOUT_GRACE_MIN = 120;

const MIN = 60 * 1000;

export type Attendance =
  | { state: "none" }
  | { state: "in"; inAt: string }
  | { state: "done"; inAt: string; outAt: string; auto: boolean; hours: number };

/**
 * Where a volunteer stands for their shift. Anyone who checked in but never
 * checked out is closed automatically at the end of the shift.
 */
export function attendance(
  signup: Pick<Signup, "checked_in_at" | "checked_out_at">,
  shift: Pick<Shift, "starts_at" | "ends_at">,
  now: number = Date.now(),
): Attendance {
  if (!signup.checked_in_at) return { state: "none" };
  const inAt = signup.checked_in_at;
  const shiftEnd = new Date(shift.ends_at).getTime();
  let outAt = signup.checked_out_at;
  let auto = false;
  if (!outAt && now > shiftEnd) {
    outAt = shift.ends_at;
    auto = true;
  }
  if (!outAt) return { state: "in", inAt };
  const ms = Math.max(0, new Date(outAt).getTime() - new Date(inAt).getTime());
  return { state: "done", inAt, outAt, auto, hours: Math.round((ms / 3600000) * 100) / 100 };
}

export function canSelfCheckIn(shift: Pick<Shift, "starts_at" | "ends_at">, now: number = Date.now()): boolean {
  const opens = new Date(shift.starts_at).getTime() - CHECKIN_OPENS_MIN * MIN;
  return now >= opens && now <= new Date(shift.ends_at).getTime();
}

export function canSelfCheckOut(shift: Pick<Shift, "ends_at">, now: number = Date.now()): boolean {
  return now <= new Date(shift.ends_at).getTime() + CHECKOUT_GRACE_MIN * MIN;
}

/** The event-day window in which the public link behaves as a check-in page. */
export function checkinWindowOpen(event: Pick<Event, "starts_at" | "ends_at" | "status">, now: number = Date.now()): boolean {
  if (event.status === "cancelled") return false;
  const opens = new Date(event.starts_at).getTime() - CHECKIN_OPENS_MIN * MIN;
  const closes = new Date(event.ends_at).getTime() + CHECKOUT_GRACE_MIN * MIN;
  return now >= opens && now <= closes;
}

export function fmtHours(h: number): string {
  const rounded = Math.round(h * 10) / 10;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)} hr${rounded === 1 ? "" : "s"}`;
}
