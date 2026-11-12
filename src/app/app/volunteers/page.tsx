import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { fmtHours } from "@/lib/attendance";
import { getOrg, getSession } from "@/lib/db";
import { fmtDate } from "@/lib/time";
import { filterAndSort, loadVolunteers, type VolunteerSort } from "@/lib/volunteers";

export const metadata: Metadata = { title: "Volunteers — CivicKettle" };
export const dynamic = "force-dynamic";

const SORTS: { key: VolunteerSort; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "hours", label: "Most hours" },
  { key: "recent", label: "Most recent" },
];

export default async function VolunteersPage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string; deleted?: string; n?: string; error?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/app");
  const org = await getOrg(session);
  if (!org) redirect("/app/setup");
  const sp = await searchParams;
  const q = (sp.q || "").slice(0, 80);
  const sort: VolunteerSort = sp.sort === "hours" || sp.sort === "recent" ? sp.sort : "name";
  const tz = org.time_zone;

  const everyone = await loadVolunteers(session, org);
  const rows = filterAndSort(everyone, q, sort);
  const totalHours = Math.round(everyone.reduce((t, v) => t + v.hours, 0) * 100) / 100;
  const link = (s: VolunteerSort) => `/app/volunteers?sort=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
  const pill = (status: string) => (status === "No-show" || status === "Waiting list" ? "ap-pill amber" : status === "Cancelled" ? "ap-pill sent" : "ap-pill");

  return (
    <AppShell active="volunteers" orgName={org.name} email={session.email}>
      <div className="ap-top">
        <div>
          <p className="ck-kicker">{org.name}</p>
          <h1 className="ap-h1">Volunteers</h1>
        </div>
        {everyone.length > 0 && <a className="ap-ghost" href="/app/api/volunteers/export">Export CSV</a>}
      </div>

      {sp.deleted && <p className="ap-flash">Deleted {sp.deleted}&apos;s records{sp.n ? ` (${sp.n} sign-up${sp.n === "1" ? "" : "s"})` : ""}.</p>}
      {sp.error && <p className="ap-error ap-error-top">{decodeURIComponent(sp.error)}</p>}

      <div className="ap-tiles">
        <div className="ap-tile"><span className="l">Volunteers</span><span className="v">{everyone.length}</span><span className="d">Everyone who has signed up</span></div>
        <div className="ap-tile"><span className="l">Showed up at least once</span><span className="v">{everyone.filter((v) => v.attended > 0).length}</span><span className="d">Checked in to a shift</span></div>
        <div className="ap-tile"><span className="l">Signed up for something ahead</span><span className="v">{everyone.filter((v) => v.upcoming > 0).length}</span><span className="d">Upcoming shifts</span></div>
        <div className="ap-tile"><span className="l">Hours, all time</span><span className="v">{totalHours}</span><span className="d">From check-ins</span></div>
      </div>

      <form className="ap-range" method="get" action="/app/volunteers">
        <label>Search<input type="search" name="q" defaultValue={q} placeholder="Name, email or phone" /></label>
        <input type="hidden" name="sort" value={sort} />
        <button className="ap-ghost sm" type="submit">Search</button>
        {q && <a className="ap-link" href={`/app/volunteers?sort=${sort}`}>Clear</a>}
        <span className="ap-range-presets">
          {SORTS.map((s) => <a key={s.key} href={link(s.key)} className={s.key === sort ? "on" : undefined}>{s.label}</a>)}
        </span>
      </form>

      <section className="ap-card">
        <div className="ap-card-h">
          <h2>{q ? `${rows.length} of ${everyone.length} match "${q}"` : `${everyone.length} ${everyone.length === 1 ? "person" : "people"}`}</h2>
          <span className="ap-muted">Click a name for their history</span>
        </div>
        {everyone.length === 0 && <div className="ap-empty"><p>Nobody yet. People appear here the moment they sign up for one of your events.</p><a className="ck-button sm" href="/app/events">Go to events</a></div>}
        {everyone.length > 0 && rows.length === 0 && <div className="ap-empty"><p>No one matches that search.</p></div>}
        {rows.length > 0 && (
          <div className="ap-vhead" aria-hidden="true"><span>Volunteer</span><span>Events</span><span>Showed up</span><span>No-shows</span><span>Hours</span><span>Last or next shift</span></div>
        )}
        {rows.map((v) => (
          <details className="ap-vrow" key={v.key}>
            <summary>
              <span className="who">
                <strong>{v.name}</strong>
                {v.minor && <span className="ap-pill amber">Minor</span>}
                {v.emailOff && <span className="ap-pill sent">Emails off</span>}
                <span className="m">
                  {[v.email, v.phone].filter(Boolean).join(" · ") || "No contact details"}
                  {v.minor && v.guardian ? ` · guardian ${v.guardian}` : ""}
                </span>
              </span>
              <span className="n" data-l="Events">{v.events}</span>
              <span className="n" data-l="Showed up">{v.attended}</span>
              <span className="n" data-l="No-shows">{v.noShows || ""}</span>
              <span className="n" data-l="Hours">{v.hours || ""}</span>
              <span className="when" data-l="Shift">{v.nextAt ? `Next ${fmtDate(v.nextAt, tz)}` : v.lastAt ? `Last ${fmtDate(v.lastAt, tz, { year: "numeric" })}` : "Not yet"}</span>
            </summary>
            <div className="ap-vhist">
              {v.history.map((h, i) => (
                <div className="ap-row" key={i}>
                  <div>
                    <a href={`/app/events/${h.eventId}`}><strong>{h.title}</strong></a>
                    <div className="m">{h.shiftName} · {fmtDate(h.startsAt, tz, { year: "numeric" })}</div>
                  </div>
                  <span className={pill(h.status)}>{h.status}{h.hours !== null ? ` · ${fmtHours(h.hours)}` : ""}</span>
                </div>
              ))}
              <div className="ap-vfoot">
                <a className="ap-link" href={`/app/volunteers/delete?key=${encodeURIComponent(v.key)}`}>Delete {v.name}&apos;s records…</a>
                <span className="ap-muted">For when someone asks to have their information removed.</span>
              </div>
            </div>
          </details>
        ))}
      </section>
    </AppShell>
  );
}
