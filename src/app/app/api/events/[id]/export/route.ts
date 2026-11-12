import { NextResponse, type NextRequest } from "next/server";
import { getOrg, getSession, slugify, type Event, type Shift, type Signup } from "@/lib/db";
import { toCsv, toEntry } from "@/lib/hours";
import { fmtTime, utcToZonedInputs } from "@/lib/time";

export const dynamic = "force-dynamic";

/** Everything about one event's sign-ups and attendance, as CSV. */
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/app", request.url), { status: 303 });
  const org = await getOrg(session);
  if (!org) return NextResponse.redirect(new URL("/app/setup", request.url), { status: 303 });

  const { data: evRaw } = await session.supabase.from("events").select("*").eq("id", id).eq("org_id", org.id).maybeSingle();
  if (!evRaw) return new NextResponse("Not found", { status: 404 });
  const ev = evRaw as Event;
  const [{ data: sh }, { data: su }] = await Promise.all([
    session.supabase.from("shifts").select("*").eq("event_id", id).order("sort_order"),
    session.supabase.from("signups").select("*").eq("event_id", id).order("volunteer_name"),
  ]);
  const shifts = (sh ?? []) as Shift[];
  const tz = org.time_zone;
  const now = Date.now();

  const rows: (string | number | null)[][] = [
    ["Volunteer", "Email", "Mobile", "Minor", "Guardian", "Guardian mobile", "Shift", "Date", "Shift time", "Status", "Checked in", "Checked out", "Hours", "Approved"],
  ];
  for (const s of (su ?? []) as Signup[]) {
    const shift = shifts.find((x) => x.id === s.shift_id);
    if (!shift) continue;
    const e = toEntry(s, shift, ev, now);
    const ended = new Date(shift.ends_at).getTime() < now;
    const status = s.status === "cancelled" ? "Cancelled" : s.status === "waitlist" ? "Waiting list" : e.a.state !== "none" ? "Attended" : ended ? "No-show" : "Signed up";
    rows.push([
      s.volunteer_name, s.email, s.phone, s.is_minor ? "Yes" : "No", s.guardian_name, s.guardian_phone,
      shift.name, utcToZonedInputs(shift.starts_at, tz).date, `${fmtTime(shift.starts_at, tz)} to ${fmtTime(shift.ends_at, tz)}`,
      status,
      e.a.state !== "none" ? fmtTime(e.a.inAt, tz) : "",
      e.a.state === "done" ? fmtTime(e.a.outAt, tz) : "",
      s.status === "confirmed" ? e.hours : null,
      e.approved ? "Yes" : "No",
    ]);
  }
  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="civickettle-${slugify(ev.title)}-${utcToZonedInputs(ev.starts_at, tz).date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
