import { NextResponse, type NextRequest } from "next/server";
import { getOrg, getSession } from "@/lib/db";
import { toCsv } from "@/lib/hours";
import { utcToZonedInputs } from "@/lib/time";
import { filterAndSort, loadVolunteers } from "@/lib/volunteers";

export const dynamic = "force-dynamic";

/** The volunteer list, one row per person. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/app", request.url), { status: 303 });
  const org = await getOrg(session);
  if (!org) return NextResponse.redirect(new URL("/app/setup", request.url), { status: 303 });
  const tz = org.time_zone;
  const day = (iso: string | null) => (iso ? utcToZonedInputs(iso, tz).date : "");
  const people = filterAndSort(await loadVolunteers(session, org), "", "name");
  const rows: (string | number | null)[][] = [
    ["Volunteer", "Email", "Phone", "Minor", "Guardian", "Emails", "Events", "Showed up", "No-shows", "Upcoming shifts", "Hours", "First signed up", "Last shift", "Next shift"],
    ...people.map((v) => [
      v.name,
      v.email,
      v.phone,
      v.minor ? "Yes" : "No",
      v.guardian,
      v.emailOff ? "Off" : "On",
      v.events,
      v.attended,
      v.noShows,
      v.upcoming,
      v.hours,
      day(v.firstAt),
      day(v.lastAt),
      day(v.nextAt),
    ]),
  ];
  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="civickettle-volunteers-${day(new Date().toISOString())}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
