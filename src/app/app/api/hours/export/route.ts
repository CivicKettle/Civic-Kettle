import { NextResponse, type NextRequest } from "next/server";
import { getOrg, getSession } from "@/lib/db";
import { toCsv } from "@/lib/hours";
import { loadEntries } from "@/lib/hoursData";
import { parseRange } from "@/lib/range";
import { fmtTime, utcToZonedInputs } from "@/lib/time";

export const dynamic = "force-dynamic";

/** Hours report for a date range, one row per check-in. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/app", request.url), { status: 303 });
  const org = await getOrg(session);
  if (!org) return NextResponse.redirect(new URL("/app/setup", request.url), { status: 303 });
  const q = request.nextUrl.searchParams;
  const range = parseRange(q.get("from") ?? undefined, q.get("to") ?? undefined, org.time_zone);
  const entries = await loadEntries(session, org, range.startIso, range.endIso);
  const tz = org.time_zone;

  const rows: (string | number | null)[][] = [
    ["Volunteer", "Email", "Minor", "Guardian", "Event", "Shift", "Date", "Checked in", "Checked out", "Hours", "Hours source", "Approved"],
    ...entries.map((e) => [
      e.signup.volunteer_name,
      e.signup.email,
      e.signup.is_minor ? "Yes" : "No",
      e.signup.guardian_name,
      e.event.title,
      e.shift.name,
      utcToZonedInputs(e.shift.starts_at, tz).date,
      e.a.state !== "none" ? fmtTime(e.a.inAt, tz) : "",
      e.a.state === "done" ? fmtTime(e.a.outAt, tz) : "",
      e.hours,
      e.edited ? "Edited by coordinator" : e.a.state === "done" ? (e.a.auto ? "Closed at shift end" : "Check-in to check-out") : "Still checked in",
      e.approved ? "Yes" : "No",
    ]),
  ];
  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="civickettle-hours-${range.from}-to-${range.to}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
