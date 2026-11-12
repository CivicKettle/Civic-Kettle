import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KettleMark } from "@/components/AppShell";
import { fmtHours } from "@/lib/attendance";
import { loadMine } from "@/lib/mine";
import { fmtLongDate, fmtRange } from "@/lib/time";

export const metadata: Metadata = { title: "My shifts | CivicKettle", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MyShiftsPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ cancelled?: string; switched?: string; error?: string }>;
}) {
  const { token } = await params;
  const q = await searchParams;
  const data = await loadMine(token);
  if (!data) notFound();
  const { org, upcoming } = data;
  const tz = org.time_zone;
  const names = new Set(upcoming.map((r) => r.signup.volunteer_name.trim().toLowerCase()));

  return (
    <div className="pv">
      <header className="pv-head">
        <span className="pv-brand"><KettleMark />CivicKettle</span>
        <span className="pv-org">{org.name}</span>
      </header>
      <main className="pv-body">
        <div className="pv-hero">
          <p className="pv-kicker">My shifts</p>
          <h1 className="pv-h1">Your shifts with {org.name}</h1>
          <p className="pv-meta">{data.email}</p>
        </div>

        {q.cancelled && <p className="pv-note">Cancelled. The spot is open for someone else.</p>}
        {q.switched && <p className="pv-note">Switched. A new confirmation is on its way to your email.</p>}
        {q.error && <p className="pv-error" role="alert">{decodeURIComponent(q.error)}</p>}

        {upcoming.length === 0 && (
          <div className="pv-card pv-fields">
            <p className="pv-muted">You have no upcoming shifts.</p>
            <a className="pv-button" href={`/o/${org.slug}`}>See what {org.name} needs help with</a>
          </div>
        )}

        {upcoming.map((r) => (
          <div className="pv-card pv-mine" key={r.signup.id}>
            <div className="pv-mine-top">
              <p className="pv-mine-title">{r.event.title}</p>
              <p className="pv-mine-when">{fmtLongDate(r.shift.starts_at, tz)}</p>
              <p className="pv-mine-shift">{r.shift.name}, {fmtRange(r.shift.starts_at, r.shift.ends_at, tz)}</p>
              {r.event.location && <p className="pv-mine-where">{r.event.location}</p>}
              {(names.size > 1 || r.signup.is_minor) && <p className="pv-mine-who">For {r.signup.volunteer_name}</p>}
            </div>
            {r.waiting && r.event.status !== "cancelled" ? (
              <div className="pv-mine-actions">
                <p className="pv-mine-wait">On the waiting list. If a spot opens you&apos;re moved in automatically and emailed.</p>
                <a className="pv-link danger" href={`/v/cancel/${r.signup.cancel_token}?mine=${token}`}>Leave the waiting list</a>
              </div>
            ) : r.event.status === "cancelled" ? (
              <p className="pv-mine-flag">The organizer cancelled this event.</p>
            ) : r.signup.checked_in_at ? (
              <p className="pv-mine-flag">Checked in. Thanks for being there.</p>
            ) : (
              <div className="pv-mine-actions">
                <a className="pv-link" href={`/v/ics/${r.signup.cancel_token}`}>Add to my calendar</a>
                {r.alternatives.length > 0 && (
                  <details className="pv-switch">
                    <summary>Switch shift</summary>
                    <form action="/app/api/public/switch" method="post">
                      <input type="hidden" name="cancel_token" value={r.signup.cancel_token} />
                      <input type="hidden" name="mine" value={token} />
                      {r.alternatives.map((s, i) => (
                        <label className="pv-opt" key={s.id}>
                          <input type="radio" name="shift_id" value={s.id} required defaultChecked={i === 0 && r.alternatives.length === 1} />
                          <span className="t"><b>{s.name}</b><span>{fmtRange(s.starts_at, s.ends_at, tz)}</span></span>
                          <span className={s.open <= 2 ? "n low" : "n"}>{s.open} {s.open === 1 ? "spot" : "spots"} left</span>
                        </label>
                      ))}
                      <button className="pv-button" type="submit">Switch to this shift</button>
                    </form>
                  </details>
                )}
                <a className="pv-link danger" href={`/v/cancel/${r.signup.cancel_token}?mine=${token}`}>Cancel this shift</a>
              </div>
            )}
          </div>
        ))}

        <div className="pv-mine-more">
          {data.pastShifts > 0 && <p>So far with {org.name}: {data.pastShifts} {data.pastShifts === 1 ? "shift" : "shifts"}, {fmtHours(data.pastHours)}.</p>}
          {upcoming.length > 0 && <a className="pv-link" href={`/o/${org.slug}`}>See everything {org.name} needs help with</a>}
          <a className="pv-textlink" href={`/u/${token}`}>Email settings</a>
        </div>
      </main>
      <footer className="pv-foot">
        {org.contact_email && <span>Questions? <a href={`mailto:${org.contact_email}`}>{org.contact_email}</a></span>}
        <span>Sign-ups by <a href="/">CivicKettle</a></span>
      </footer>
    </div>
  );
}
