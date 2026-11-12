import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { trialFor, trialLine } from "@/lib/plan";
import { getOrg, getSession, withCounts, type Event, type Shift, type Signup } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { dateTile, fmtLongDate, fmtRange } from "@/lib/time";
import { attendance } from "@/lib/attendance";

export const metadata: Metadata = { title: "Overview — CivicKettle" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <AppShell active="overview">
        <div className="ap-card ap-notice">
          <h2>Workspace not connected yet</h2>
          <p>The database for CivicKettle hasn&apos;t been linked to this deployment.</p>
        </div>
      </AppShell>
    );
  }
  const session = await getSession();
  if (!session) redirect("/app");
  const org = await getOrg(session);
  if (!org) redirect("/app/setup");

  const nowIso = new Date().toISOString();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [{ data: upcoming }, { data: monthSignups }] = await Promise.all([
    session.supabase
      .from("events")
      .select("id,title,location,starts_at,ends_at,status,public_token")
      .eq("org_id", org.id)
      .neq("status", "cancelled")
      .gte("ends_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(5),
    session.supabase
      .from("signups")
      .select("id,created_at,status,event_id")
      .gte("created_at", monthStart.toISOString()),
  ]);

  const events = (upcoming ?? []) as Pick<Event, "id" | "title" | "location" | "starts_at" | "ends_at" | "status" | "public_token">[];
  const eventIds = events.map((e) => e.id);

  let shifts: Shift[] = [];
  let signups: Pick<Signup, "shift_id" | "status" | "event_id">[] = [];
  if (eventIds.length) {
    const [{ data: s }, { data: su }] = await Promise.all([
      session.supabase.from("shifts").select("*").in("event_id", eventIds),
      session.supabase.from("signups").select("shift_id,status,event_id").in("event_id", eventIds),
    ]);
    shifts = (s ?? []) as Shift[];
    signups = (su ?? []) as Pick<Signup, "shift_id" | "status" | "event_id">[];
  }

  const perEvent = events.map((e) => {
    const sc = withCounts(shifts.filter((s) => s.event_id === e.id), signups);
    const capacity = sc.reduce((a, s) => a + s.capacity, 0);
    const filled = sc.reduce((a, s) => a + s.confirmed, 0);
    return { event: e, shifts: sc, capacity, filled, open: Math.max(0, capacity - filled) };
  });

  const openSpots = perEvent.reduce((a, p) => a + p.open, 0);
  const understaffed = perEvent.filter((p) => p.capacity > 0 && p.filled / p.capacity < 0.5).length;
  const signupsThisMonth = (monthSignups ?? []).filter((x) => x.status === "confirmed").length;

  // Hours this month: every check-in since the 1st, closed at shift end if nobody checked out.
  const { data: attended } = await session.supabase
    .from("signups")
    .select("*")
    .eq("status", "confirmed")
    .gte("checked_in_at", monthStart.toISOString());
  const attendedRows = (attended ?? []) as Signup[];
  let hoursThisMonth = 0;
  if (attendedRows.length) {
    const { data: hs } = await session.supabase
      .from("shifts")
      .select("id,starts_at,ends_at")
      .in("id", [...new Set(attendedRows.map((r) => r.shift_id))]);
    const byId = new Map((hs ?? []).map((x) => [x.id as string, x as Pick<Shift, "starts_at" | "ends_at">]));
    for (const r of attendedRows) {
      const sh = byId.get(r.shift_id);
      if (!sh) continue;
      const a = attendance(r, sh);
      // A coordinator's edit on the Hours page wins over the check-in times.
      if (r.hours_override !== null && r.hours_override !== undefined) hoursThisMonth += Number(r.hours_override);
      else if (a.state === "done") hoursThisMonth += a.hours;
    }
  }
  const hoursLabel = Math.round(hoursThisMonth * 100) / 100;
  const trial = await trialFor(session, org);

  return (
    <AppShell active="overview" orgName={org.name} email={session.email}>
      <div className="ap-top">
        <div>
          <p className="ck-kicker">{fmtLongDate(nowIso, org.time_zone)}</p>
          <h1 className="ap-h1">Your week at a glance</h1>
        </div>
        <a className="ck-button" href="/app/events/new">New event <span aria-hidden="true">+</span></a>
      </div>

      {trial && <p className={trial.state === "active" ? "ap-flash" : "ap-error ap-error-top"}>{trialLine(trial)}</p>}

      <div className="ap-tiles">
        <div className="ap-tile"><span className="l">Upcoming events</span><span className="v">{events.length}</span><span className="d">{events[0] ? `Next: ${dateTile(events[0].starts_at, org.time_zone).dow} ${dateTile(events[0].starts_at, org.time_zone).day}` : "Nothing scheduled"}</span></div>
        <div className="ap-tile"><span className="l">Open spots</span><span className="v">{openSpots}</span><span className={understaffed ? "d warn" : "d"}>{understaffed ? `${understaffed} event${understaffed > 1 ? "s" : ""} under half full` : "All events on track"}</span></div>
        <div className="ap-tile"><span className="l">Sign-ups this month</span><span className="v">{signupsThisMonth}</span><span className="d">Confirmed volunteers</span></div>
        <div className="ap-tile"><span className="l">Hours logged this month</span><span className="v">{hoursLabel}</span><span className="d">{attendedRows.length ? `${attendedRows.length} check-in${attendedRows.length === 1 ? "" : "s"}` : "From QR check-ins"}</span></div>
      </div>

      <section className="ap-card">
        <div className="ap-card-h"><h2>Upcoming events</h2><a href="/app/events">All events ›</a></div>
        {perEvent.length === 0 ? (
          <div className="ap-empty">
            <p>No events yet. Create your first one and you&apos;ll get a sign-up link to share.</p>
            <a className="ck-button" href="/app/events/new">Create an event <span aria-hidden="true">↗</span></a>
          </div>
        ) : (
          perEvent.map(({ event, capacity, filled, shifts: sc }) => {
            const tile = dateTile(event.starts_at, org.time_zone);
            const pct = capacity ? Math.round((filled / capacity) * 100) : 0;
            return (
              <a key={event.id} href={`/app/events/${event.id}`} className="ap-ev">
                <span className="ap-date"><small>{tile.dow}</small><strong>{tile.day}</strong></span>
                <span>
                  <h3>{event.title}</h3>
                  <p>{fmtRange(event.starts_at, event.ends_at, org.time_zone)} · {sc.length} shift{sc.length === 1 ? "" : "s"}{event.location ? ` · ${event.location}` : ""}</p>
                </span>
                <span className="ap-cap">{filled} of {capacity} spots<span className="ap-bar"><i className={pct < 50 ? "low" : undefined} style={{ width: `${pct}%` }} /></span></span>
              </a>
            );
          })
        )}
      </section>
    </AppShell>
  );
}
