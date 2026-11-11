import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { fmtHours } from "@/lib/attendance";
import { getOrg, getSession } from "@/lib/db";
import { byVolunteer, sumHours, type HoursEntry } from "@/lib/hours";
import { loadEntries } from "@/lib/hoursData";
import { parseRange, presets } from "@/lib/range";
import { fmtDate, fmtTime } from "@/lib/time";

export const metadata: Metadata = { title: "Hours — CivicKettle" };
export const dynamic = "force-dynamic";

export default async function HoursPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/app");
  const org = await getOrg(session);
  if (!org) redirect("/app/setup");
  const q = await searchParams;
  const tz = org.time_zone;
  const range = parseRange(q.from, q.to, tz);
  const entries = await loadEntries(session, org, range.startIso, range.endIso);
  const here = `/app/hours?from=${range.from}&to=${range.to}`;

  const stillIn = entries.filter((e) => e.hours === null);
  const counted = entries.filter((e) => e.hours !== null);
  const pending = counted.filter((e) => !e.approved);
  const approved = counted.filter((e) => e.approved);
  const people = byVolunteer(counted);

  const times = (e: HoursEntry) =>
    e.a.state === "done"
      ? `${fmtTime(e.a.inAt, tz)} to ${fmtTime(e.a.outAt, tz)}${e.a.auto ? " (closed at shift end)" : ""}`
      : e.a.state === "in"
        ? `In at ${fmtTime(e.a.inAt, tz)}`
        : "";

  const Row = ({ e }: { e: HoursEntry }) => (
    <div className="ap-hrow">
      <div className="who">
        <strong>{e.signup.volunteer_name}</strong>
        {e.signup.is_minor && <span className="ap-pill amber">Minor</span>}
        {e.edited && <span className="ap-pill sent">Edited</span>}
        <div className="m">
          <a href={`/app/events/${e.event.id}/summary`}>{e.event.title}</a> · {e.shift.name} · {fmtDate(e.shift.starts_at, tz)} · {times(e)}
        </div>
      </div>
      <div className="hrs">{e.hours === null ? "On shift" : fmtHours(e.hours)}</div>
      <div className="acts">
        {e.hours !== null && (
          <form action="/app/api/hours" method="post">
            <input type="hidden" name="back" value={here} />
            <input type="hidden" name="id" value={e.signup.id} />
            <input type="hidden" name="intent" value={e.approved ? "unapprove" : "approve"} />
            <button type="submit" className={e.approved ? "ap-link" : "ck-button sm"}>{e.approved ? "Undo approval" : "Approve"}</button>
          </form>
        )}
        <details className="ap-edit">
          <summary>Edit</summary>
          <form action="/app/api/hours" method="post">
            <input type="hidden" name="back" value={here} />
            <input type="hidden" name="id" value={e.signup.id} />
            <input type="hidden" name="intent" value="edit" />
            <label>
              Hours
              <input name="hours" type="number" min={0} max={24} step={0.25} defaultValue={e.hours ?? ""} aria-label={`Hours for ${e.signup.volunteer_name}`} />
            </label>
            <button type="submit" className="ap-ghost sm">Save</button>
            <span className="ap-muted">Leave blank to go back to the check-in times.</span>
          </form>
        </details>
      </div>
    </div>
  );

  return (
    <AppShell active="hours" orgName={org.name} email={session.email}>
      <div className="ap-top">
        <div>
          <p className="ck-kicker">{org.name}</p>
          <h1 className="ap-h1">Hours</h1>
        </div>
        <a className="ap-ghost" href={`/app/api/hours/export?from=${range.from}&to=${range.to}`}>Export CSV</a>
      </div>

      {q.error && <p className="ap-error ap-error-top">{decodeURIComponent(q.error)}</p>}

      <form className="ap-range" method="get" action="/app/hours">
        <label>From<input type="date" name="from" defaultValue={range.from} /></label>
        <label>To<input type="date" name="to" defaultValue={range.to} /></label>
        <button className="ap-ghost sm" type="submit">Show</button>
        <span className="ap-range-presets">
          {presets(tz).map((p) => (
            <a key={p.label} href={`/app/hours?from=${p.from}&to=${p.to}`} className={p.from === range.from && p.to === range.to ? "on" : undefined}>{p.label}</a>
          ))}
        </span>
      </form>

      <div className="ap-tiles">
        <div className="ap-tile"><span className="l">Hours in this range</span><span className="v">{sumHours(counted)}</span><span className="d">{counted.length} check-in{counted.length === 1 ? "" : "s"}</span></div>
        <div className="ap-tile"><span className="l">Volunteers</span><span className="v">{people.length}</span><span className="d">With logged hours</span></div>
        <div className="ap-tile"><span className="l">Awaiting approval</span><span className="v">{pending.length}</span><span className={pending.length ? "d warn" : "d"}>{pending.length ? fmtHours(sumHours(pending)) : "All approved"}</span></div>
        <div className="ap-tile"><span className="l">Approved</span><span className="v">{sumHours(approved)}</span><span className="d">Hours ready to report</span></div>
      </div>

      <section className="ap-card">
        <div className="ap-card-h">
          <h2>Awaiting approval</h2>
          {pending.length > 0 && (
            <form action="/app/api/hours" method="post">
              <input type="hidden" name="back" value={here} />
              <input type="hidden" name="intent" value="approve" />
              {pending.map((e) => <input key={e.signup.id} type="hidden" name="id" value={e.signup.id} />)}
              <button className="ck-button sm" type="submit">Approve all {pending.length}</button>
            </form>
          )}
        </div>
        {pending.length === 0 && stillIn.length === 0 && <div className="ap-empty"><p>Nothing waiting. Hours appear here as volunteers check in and out.</p></div>}
        {stillIn.map((e) => <Row key={e.signup.id} e={e} />)}
        {pending.map((e) => <Row key={e.signup.id} e={e} />)}
      </section>

      <section className="ap-card">
        <div className="ap-card-h"><h2>By volunteer</h2><span className="ap-muted">{fmtDate(range.startIso, tz, { year: "numeric" })} to {fmtDate(new Date(new Date(range.endIso).getTime() - 1000).toISOString(), tz, { year: "numeric" })}</span></div>
        {people.length === 0 ? (
          <div className="ap-empty"><p>No hours in this range.</p></div>
        ) : (
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead><tr><th>Volunteer</th><th>Events</th><th className="n">Approved</th><th className="n">Pending</th><th className="n">Total</th></tr></thead>
              <tbody>
                {people.map((p) => (
                  <tr key={`${p.name}|${p.email}`}>
                    <td><strong>{p.name}</strong>{p.minor && <span className="ap-pill amber">Minor</span>}{p.email && <div className="m">{p.email}</div>}</td>
                    <td>{p.events}</td>
                    <td className="n">{p.approved || ""}</td>
                    <td className="n">{p.pending || ""}</td>
                    <td className="n"><strong>{Math.round((p.approved + p.pending) * 100) / 100}</strong></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><td>Total</td><td /><td className="n">{sumHours(approved) || ""}</td><td className="n">{sumHours(pending) || ""}</td><td className="n"><strong>{sumHours(counted)}</strong></td></tr></tfoot>
            </table>
          </div>
        )}
      </section>

      {approved.length > 0 && (
        <section className="ap-card">
          <div className="ap-card-h"><h2>Approved</h2><span className="ap-muted">{approved.length} entr{approved.length === 1 ? "y" : "ies"}</span></div>
          {approved.map((e) => <Row key={e.signup.id} e={e} />)}
        </section>
      )}
    </AppShell>
  );
}
