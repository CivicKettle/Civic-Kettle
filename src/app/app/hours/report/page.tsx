import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import PrintButton from "@/components/PrintButton";
import { arrivedOnTime, fmtHours } from "@/lib/attendance";
import { getOrg, getSession } from "@/lib/db";
import { sumHours } from "@/lib/hours";
import { loadEntries } from "@/lib/hoursData";
import { parseRange, presets } from "@/lib/range";
import { fmtDate } from "@/lib/time";
import { fmtMoney, hourValue, VALUE_SOURCE, valueSourceLine } from "@/lib/value";

export const metadata: Metadata = { title: "Impact report | CivicKettle" };
export const dynamic = "force-dynamic";

/** One printable page for a grant application or a board meeting. Counts approved hours only. */
export default async function ImpactReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/app");
  const org = await getOrg(session);
  if (!org || !session.hasPassword) redirect("/app/setup");
  const q = await searchParams;
  const tz = org.time_zone;
  const range = parseRange(q.from, q.to, tz);
  const entries = await loadEntries(session, org, range.startIso, range.endIso);

  const counted = entries.filter((e) => e.hours !== null);
  const approved = counted.filter((e) => e.approved);
  const pending = counted.filter((e) => !e.approved);
  const hours = sumHours(approved);
  const rate = hourValue(org);
  const value = Math.round(hours * rate);

  const person = (e: (typeof approved)[number]) => `${e.signup.volunteer_name.trim().toLowerCase()}|${(e.signup.email || "").toLowerCase()}`;
  const people = new Set(approved.map(person));
  const youth = new Set(approved.filter((e) => e.signup.is_minor).map(person));
  const onTime = approved.filter((e) => arrivedOnTime(e.signup, e.shift)).length;

  const byEvent = new Map<string, { title: string; at: string; people: Set<string>; hours: number }>();
  for (const e of approved) {
    const row = byEvent.get(e.event.id) ?? { title: e.event.title, at: e.event.starts_at, people: new Set<string>(), hours: 0 };
    row.people.add(person(e));
    row.hours += e.hours ?? 0;
    byEvent.set(e.event.id, row);
  }
  const events = [...byEvent.values()].sort((a, b) => a.at.localeCompare(b.at));

  const first = fmtDate(range.startIso, tz, { year: "numeric" });
  const last = fmtDate(new Date(new Date(range.endIso).getTime() - 1000).toISOString(), tz, { year: "numeric" });
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  return (
    <AppShell active="hours" orgName={org.name} email={session.email}>
      <div className="ap-top ap-noprint">
        <div>
          <p className="ck-kicker"><a href={`/app/hours?from=${range.from}&to=${range.to}`}>← Hours</a></p>
          <h1 className="ap-h1">Impact report</h1>
        </div>
        <PrintButton label="Print or save as PDF" />
      </div>

      <form className="ap-range ap-noprint" method="get" action="/app/hours/report">
        <label>From<input type="date" name="from" defaultValue={range.from} /></label>
        <label>To<input type="date" name="to" defaultValue={range.to} /></label>
        <button className="ap-ghost sm" type="submit">Show</button>
        <span className="ap-range-presets">
          {presets(tz).map((p) => (
            <a key={p.label} href={`/app/hours/report?from=${p.from}&to=${p.to}`} className={p.from === range.from && p.to === range.to ? "on" : undefined}>{p.label}</a>
          ))}
        </span>
      </form>

      <article className="rp">
        <header className="rp-head">
          <h1>{org.name}</h1>
          <p>Volunteer impact, {first} to {last}</p>
        </header>

        {approved.length === 0 ? (
          <div className="ap-card"><div className="ap-empty">
            <p>No approved hours in these dates yet.{pending.length > 0 ? ` ${fmtHours(sumHours(pending))} are waiting for approval on the Hours page.` : " Pick different dates, or approve hours on the Hours page first."}</p>
          </div></div>
        ) : (
          <>
            <div className="rp-value">
              <span className="n">{fmtMoney(value)}</span>
              <span className="l">Value of volunteer time: {hours} approved {hours === 1 ? "hour" : "hours"} at {fmtMoney(rate, true)} an hour</span>
            </div>

            <div className="rp-stats">
              <div className="ap-tile"><span className="l">Hours given</span><span className="v">{hours}</span><span className="d">Checked in, checked out and approved</span></div>
              <div className="ap-tile"><span className="l">Volunteers</span><span className="v">{people.size}</span><span className="d">{youth.size > 0 ? `${youth.size} under 18` : "Different people"}</span></div>
              <div className="ap-tile"><span className="l">Events</span><span className="v">{events.length}</span><span className="d">{plural(approved.length, "shift worked", "shifts worked")}</span></div>
              <div className="ap-tile"><span className="l">Arrived on time</span><span className="v">{Math.round((onTime / approved.length) * 100)}%</span><span className="d">{onTime} of {approved.length} check-ins</span></div>
            </div>

            <section className="ap-card">
              <div className="ap-card-h"><h2>By event</h2></div>
              <div className="ap-table-wrap">
                <table className="ap-table">
                  <thead><tr><th>Event</th><th>Date</th><th className="n">Volunteers</th><th className="n">Hours</th><th className="n">Value</th></tr></thead>
                  <tbody>
                    {events.map((e) => (
                      <tr key={`${e.title}|${e.at}`}>
                        <td><strong>{e.title}</strong></td>
                        <td>{fmtDate(e.at, tz, { year: "numeric" })}</td>
                        <td className="n">{e.people.size}</td>
                        <td className="n">{Math.round(e.hours * 100) / 100}</td>
                        <td className="n">{fmtMoney(Math.round(e.hours * rate))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr><td>Total</td><td /><td className="n">{people.size}</td><td className="n"><strong>{hours}</strong></td><td className="n"><strong>{fmtMoney(value)}</strong></td></tr></tfoot>
                </table>
              </div>
            </section>

            <p className="rp-note">
              How this is counted: hours run from each volunteer&apos;s check-in to their check-out at the event, and only hours a coordinator has approved are included.
              {pending.length > 0 ? ` ${fmtHours(sumHours(pending))} in these dates are still waiting for approval and are not counted here.` : ""}{" "}
              {valueSourceLine(rate)} <a href={VALUE_SOURCE.url}>{VALUE_SOURCE.url.replace("https://", "")}</a>
            </p>
            <p className="rp-note ap-noprint">Change the hourly value in <a href="/app/settings#value">Settings</a>.</p>
          </>
        )}
      </article>
    </AppShell>
  );
}
