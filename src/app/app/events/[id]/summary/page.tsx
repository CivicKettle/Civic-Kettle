import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import PrintButton from "@/components/PrintButton";
import { fmtHours } from "@/lib/attendance";
import { getOrg, getSession, type Event, type Shift, type Signup } from "@/lib/db";
import { sumHours, toEntry } from "@/lib/hours";
import { fmtLongDate, fmtRange, fmtTime } from "@/lib/time";

export const metadata: Metadata = { title: "Event summary — CivicKettle" };
export const dynamic = "force-dynamic";

export default async function EventSummaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/app");
  const org = await getOrg(session);
  if (!org || !session.hasPassword) redirect("/app/setup");

  const { data: evRaw } = await session.supabase.from("events").select("*").eq("id", id).eq("org_id", org.id).maybeSingle();
  if (!evRaw) notFound();
  const ev = evRaw as Event;
  const [{ data: sh }, { data: su }] = await Promise.all([
    session.supabase.from("shifts").select("*").eq("event_id", id).order("sort_order"),
    session.supabase.from("signups").select("*").eq("event_id", id).order("volunteer_name"),
  ]);
  const shifts = (sh ?? []) as Shift[];
  const signups = (su ?? []) as Signup[];
  const tz = org.time_zone;
  const now = Date.now();
  const ended = new Date(ev.ends_at).getTime() < now;
  const started = new Date(ev.starts_at).getTime() < now;

  const confirmed = signups.filter((s) => s.status === "confirmed");
  const cancelled = signups.filter((s) => s.status === "cancelled");
  const entries = confirmed.flatMap((s) => {
    const shift = shifts.find((x) => x.id === s.shift_id);
    return shift ? [toEntry(s, shift, ev, now)] : [];
  });
  const attended = entries.filter((e) => e.a.state !== "none");
  const noShows = entries.filter((e) => e.a.state === "none" && new Date(e.shift.ends_at).getTime() < now);
  const capacity = shifts.reduce((t, s) => t + s.capacity, 0);
  const showRate = confirmed.length ? Math.round((attended.length / confirmed.length) * 100) : 0;
  const unapproved = attended.filter((e) => e.hours !== null && !e.approved).length;

  return (
    <AppShell active="events" orgName={org.name} email={session.email}>
      <div className="ap-top">
        <div>
          <p className="ck-kicker"><a href="/app/events">Events</a> › <a href={`/app/events/${id}`}>{ev.title}</a> › Summary</p>
          <h1 className="ap-h1">{ev.title}</h1>
          <p className="ap-meta">
            <span>{fmtLongDate(ev.starts_at, tz)}</span>
            <span>{fmtRange(ev.starts_at, ev.ends_at, tz)}</span>
            {ev.location && <span>{ev.location}</span>}
          </p>
        </div>
        <div className="ap-actions ap-noprint">
          <a className="ap-ghost" href={`/app/api/events/${id}/export`}>Export CSV</a>
          <PrintButton label="Print summary" />
        </div>
      </div>

      {error && <p className="ap-error ap-error-top">{decodeURIComponent(error)}</p>}
      {!ended && (
        <p className="ap-flash">{started ? "This event is under way. The numbers below update as people check in and out." : "This event hasn't happened yet. The summary fills in on the day."}</p>
      )}

      <div className="ap-tiles">
        <div className="ap-tile"><span className="l">Signed up</span><span className="v">{confirmed.length}</span><span className="d">of {capacity} spots{cancelled.length ? ` · ${cancelled.length} cancelled` : ""}</span></div>
        <div className="ap-tile"><span className="l">Showed up</span><span className="v">{attended.length}</span><span className="d">{confirmed.length ? `${showRate}% of sign-ups` : "No sign-ups"}</span></div>
        <div className="ap-tile"><span className="l">No-shows</span><span className="v">{noShows.length}</span><span className={noShows.length ? "d warn" : "d"}>{ended ? (noShows.length ? "Signed up, never checked in" : "Everyone came") : "Counted as shifts end"}</span></div>
        <div className="ap-tile"><span className="l">Hours</span><span className="v">{sumHours(attended)}</span><span className={unapproved ? "d warn" : "d"}>{unapproved ? `${unapproved} awaiting approval` : attended.some((e) => e.hours !== null) ? "All approved" : "From check-ins"}</span></div>
      </div>

      <section className="ap-card">
        <div className="ap-card-h"><h2>By shift</h2></div>
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead><tr><th>Shift</th><th>Time</th><th className="n">Signed up</th><th className="n">Showed up</th><th className="n">No-shows</th><th className="n">Hours</th></tr></thead>
            <tbody>
              {shifts.map((s) => {
                const es = entries.filter((e) => e.shift.id === s.id);
                const at = es.filter((e) => e.a.state !== "none");
                const ns = es.filter((e) => e.a.state === "none" && new Date(s.ends_at).getTime() < now);
                return (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td>{fmtRange(s.starts_at, s.ends_at, tz)}</td>
                    <td className="n">{es.length} of {s.capacity}</td>
                    <td className="n">{at.length}</td>
                    <td className="n">{ns.length || ""}</td>
                    <td className="n">{sumHours(at) || ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="ap-grid-main">
        <section className="ap-card">
          <div className="ap-card-h">
            <h2>Who came</h2>
            {unapproved > 0 && <a className="ap-noprint" href="/app/hours">Approve hours ›</a>}
          </div>
          {attended.length === 0 && <div className="ap-empty"><p>No check-ins yet.</p></div>}
          {attended.map((e) => (
            <div className="ap-row" key={e.signup.id}>
              <div>
                <strong>{e.signup.volunteer_name}</strong>{e.signup.is_minor && <span className="ap-pill amber">Minor</span>}
                <div className="m">
                  {e.shift.name} · {e.a.state === "done" ? `${fmtTime(e.a.inAt, tz)} to ${fmtTime(e.a.outAt, tz)}${e.a.auto ? " (closed at shift end)" : ""}` : e.a.state === "in" ? `In at ${fmtTime(e.a.inAt, tz)}` : ""}
                  {e.edited ? " · edited" : ""}
                </div>
              </div>
              <span className={`ap-pill${e.approved ? "" : " sent"}`}>{e.hours === null ? "On shift" : fmtHours(e.hours)}</span>
            </div>
          ))}
        </section>

        <div className="ap-stack">
          <section className="ap-card">
            <div className="ap-card-h"><h2>No-shows</h2></div>
            {noShows.length === 0 && <div className="ap-empty"><p>{ended ? "None. Everyone who signed up came." : "None so far."}</p></div>}
            {noShows.map((e) => (
              <div className="ap-row" key={e.signup.id}>
                <div>
                  <strong>{e.signup.volunteer_name}</strong>
                  <div className="m">{e.shift.name}{e.signup.email ? ` · ${e.signup.email}` : ""}</div>
                </div>
              </div>
            ))}
          </section>

          <section className="ap-card">
            <div className="ap-card-h"><h2>Notes</h2></div>
            <form action={`/app/api/events/${id}`} method="post" className="ap-card-b ap-form">
              <input type="hidden" name="intent" value="notes" />
              <label htmlFor="summary_notes" className="ap-noprint">What went well, what to change next time</label>
              <textarea id="summary_notes" name="summary_notes" rows={5} maxLength={4000} defaultValue={ev.summary_notes ?? ""} placeholder="Ran short on cleanup. Ask for four next time." />
              <button className="ap-ghost sm ap-noprint" type="submit">Save notes</button>
            </form>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
