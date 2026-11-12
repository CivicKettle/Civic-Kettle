import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { KettleMark } from "@/components/AppShell";
import { attendance, canSelfCheckIn, canSelfCheckOut, checkinWindowOpen, fmtHours, CHECKIN_OPENS_MIN } from "@/lib/attendance";
import { DEVICE_COOKIE, parseTokens } from "@/lib/device";
import { loadDeviceSignups, loadPublicEvent } from "@/lib/public";
import { fmtLongDate, fmtRange, fmtTime } from "@/lib/time";

export const metadata: Metadata = { title: "Check in | CivicKettle" };
export const dynamic = "force-dynamic";

export default async function CheckinPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ ok?: string; error?: string; notfound?: string }>;
}) {
  const { token } = await params;
  const flags = await searchParams;
  const data = await loadPublicEvent(token);
  if (!data) notFound();
  const { org, event, shifts } = data;
  const tz = org.time_zone;

  const jar = await cookies();
  const mine = await loadDeviceSignups(event.id, parseTokens(jar.get(DEVICE_COOKIE)?.value));
  const open = checkinWindowOpen(event);
  const opensAt = new Date(new Date(event.starts_at).getTime() - CHECKIN_OPENS_MIN * 60000).toISOString();
  const ended = new Date(event.ends_at).getTime() < Date.now();

  return (
    <div className="pv">
      <header className="pv-head">
        <span className="pv-brand"><KettleMark />CivicKettle</span>
        <span className="pv-org">{org.name}</span>
      </header>
      <main className="pv-body">
        <div className="pv-hero">
          <p className="pv-kicker">Check in</p>
          <h1 className="pv-h1">{event.title}</h1>
          <p className="pv-meta">
            {fmtLongDate(event.starts_at, tz)} · {fmtRange(event.starts_at, event.ends_at, tz)}
            {event.location && <><br />{event.location}</>}
          </p>
        </div>

        {flags.error && <p className="pv-error">{decodeURIComponent(flags.error)}</p>}

        {event.status === "cancelled" ? (
          <div className="pv-card"><h2>This event has been cancelled</h2></div>
        ) : !open && !ended ? (
          <div className="pv-card pv-fields">
            <p className="pv-note">Check-in opens at {fmtTime(opensAt, tz)} on {fmtLongDate(event.starts_at, tz)}. Come back to this page then, or scan the code at the event.</p>
            <a className="pv-link" href={`/v/${token}?signup=1`}>Not signed up yet? Sign up</a>
          </div>
        ) : mine.length > 0 ? (
          <>
            {mine.map((s) => {
              const shift = shifts.find((x) => x.id === s.shift_id);
              if (!shift) return null;
              const a = attendance(s, shift);
              const first = s.volunteer_name.split(/\s+/)[0];
              return (
                <div className="pv-card pv-fields pv-checkin" key={s.id}>
                  <div>
                    <p className="pv-hi">{a.state === "none" ? `Hi ${first}.` : a.state === "in" ? `You're checked in, ${first}.` : `Thanks, ${first}.`}</p>
                    <p className="pv-muted">{s.volunteer_name} · {shift.name} · {fmtRange(shift.starts_at, shift.ends_at, tz)}</p>
                  </div>
                  {a.state === "none" && (
                    canSelfCheckIn(shift) ? (
                      <form action="/app/api/public/checkin" method="post">
                        <input type="hidden" name="token" value={token} />
                        <input type="hidden" name="signup_id" value={s.id} />
                        <input type="hidden" name="action" value="in" />
                        <button className="pv-button big" type="submit">I&apos;m here. Check me in</button>
                      </form>
                    ) : (
                      <p className="pv-note">{new Date(shift.ends_at).getTime() < Date.now() ? "This shift has ended." : `Check-in for this shift opens ${CHECKIN_OPENS_MIN} minutes before it starts.`}</p>
                    )
                  )}
                  {a.state === "in" && (
                    <>
                      <p className="pv-note">Checked in at {fmtTime(a.inAt, tz)}. When you leave, scan the code again or tap below.</p>
                      {canSelfCheckOut(shift) && (
                        <form action="/app/api/public/checkin" method="post">
                          <input type="hidden" name="token" value={token} />
                          <input type="hidden" name="signup_id" value={s.id} />
                          <input type="hidden" name="action" value="out" />
                          <button className="pv-button ghost big" type="submit">I&apos;m leaving. Check me out</button>
                        </form>
                      )}
                    </>
                  )}
                  {a.state === "done" && (
                    <p className="pv-note">{fmtTime(a.inAt, tz)} to {fmtTime(a.outAt, tz)} · {fmtHours(a.hours)} logged{a.auto ? " (closed at the end of the shift)" : ""}. {org.name} appreciates it.</p>
                  )}
                </div>
              );
            })}
            <a className="pv-link" href={`/v/${token}?signup=1`}>Sign up someone else</a>
          </>
        ) : (
          <form action="/app/api/public/find" method="post" className="pv-card pv-fields">
            <input type="hidden" name="token" value={token} />
            <p className="pv-hi">Find your sign-up</p>
            <p className="pv-muted">This phone doesn&apos;t have a sign-up for this event. Enter the email or mobile number used when signing up.</p>
            <label>Email or mobile<input name="who" type="text" required autoComplete="email" inputMode="email" placeholder="you@example.com" /></label>
            {flags.notfound && <p className="pv-error">No sign-up found for that. Check the spelling, or see the coordinator.</p>}
            <button className="pv-button" type="submit">Find me</button>
            {!ended && <a className="pv-link" href={`/v/${token}?signup=1`}>Not signed up yet? Sign up now</a>}
          </form>
        )}
      </main>
      <footer className="pv-foot">
        {org.contact_email && <span>Questions? <a href={`mailto:${org.contact_email}`}>{org.contact_email}</a></span>}
        <span>Sign-ups by <a href="/">CivicKettle</a></span>
      </footer>
    </div>
  );
}
