import type { Organization } from "@/lib/db";

/**
 * What an hour of volunteer time is worth, for the impact report.
 * Figures are Independent Sector's 2025 values, released April 21, 2026 with
 * the Do Good Institute at the University of Maryland.
 */
export const VALUE_SOURCE = {
  name: "Independent Sector, Value of Volunteer Time",
  released: "April 2026",
  url: "https://independentsector.org/research/value-of-volunteer-time/",
  california: 41.75,
  national: 36.14,
};

export const DEFAULT_HOUR_VALUE = VALUE_SOURCE.california;

export function hourValue(org: Pick<Organization, "hour_value">): number {
  const v = Number(org.hour_value);
  return Number.isFinite(v) && v >= 0 && org.hour_value !== null && org.hour_value !== undefined ? v : DEFAULT_HOUR_VALUE;
}

/** "$1,234" for whole totals, "$41.75" for rates. */
export function fmtMoney(amount: number, cents = false): string {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
}

/** One line saying where the default comes from, for Settings and the report. */
export function valueSourceLine(rate: number): string {
  if (rate === VALUE_SOURCE.california) return `${fmtMoney(rate, true)} an hour is the 2025 figure for California from ${VALUE_SOURCE.name} (${VALUE_SOURCE.released}).`;
  if (rate === VALUE_SOURCE.national) return `${fmtMoney(rate, true)} an hour is the 2025 national figure from ${VALUE_SOURCE.name} (${VALUE_SOURCE.released}).`;
  return `${fmtMoney(rate, true)} an hour is the value this organization has chosen. For reference, ${VALUE_SOURCE.name} (${VALUE_SOURCE.released}) puts California at ${fmtMoney(VALUE_SOURCE.california, true)} and the nation at ${fmtMoney(VALUE_SOURCE.national, true)}.`;
}
