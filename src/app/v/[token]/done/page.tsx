import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KettleMark } from "@/components/AppShell";
import CopyField from "@/components/CopyField";
import { googleCalendarUrl } from "@/lib/calendar";
import { loadSignupByCancelToken } from "@/lib/public";
import { siteUrl } from "@/lib/supabase/server";
import { fmtLongDate, fmtRange } from "@/lib/time";

export const metadata: Metadata = { title: "You're signed up | CivicKettle" };
export const dynamic = "force-dynamic";

export default async function DonePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ c?: string; again?: string }>;
}) {
  const { token } = await params;
  const { c, again } = await searchParams;
  const data = c ? await loadSignupByCancelToken(c) : null;
  if (!data || data.event.public_token !== token) notFound();
  const { signup, event, shift, org } = data;
  const tz = org.time_zone;
  const mineUrl = `${siteUrl()}/v/mine/${signup.cancel_token}`;
  const who = signup.is_minor ? signup.volunteer_name : "You're";
  const waiting = signup.status === "waitlist";

  return (
    <div className="pv">
      <header className="pv-head">
        <span className="pv-brand"><KettleMark />CivicKettle</span>
        <span className="pv-org">{org.name}</span>
      </header>
      <main className="pv-body">
        <div className="pv-hero">
          <p className="pv-kicker">{waiting ? "Waiting list" : again ? "Already on the list" : "Confirmed"}</p>
          <h1 className="pv-h1">{waiting ? (signup.is_minor ? `${who} is on the waiting list.` : "You're on the waiting list.") : signup.is_minor ? `${who} is signed up.` : "You're signed up."}</h1>
          <p className="pv-meta">
            <strong>{event.title}</strong><br />
            {fmtLongDate(event.starts_at, tz)}<br />
            {shift.name} · {fmtRange(shift.starts_at, shift.ends_at, tz)}
            {event.location && <><br />{event.location}</>}
          </p>
        </div>
        {waiting ? (
          <div className="pv-card pv-fields">
            <p className="pv-note">This shift is full right now. If a spot opens, {signup.is_minor ? signup.volunteer_name : "you"} will be moved in automatically and an email goes to {signup.email} right away. There&apos;s nothing else to do.</p>
            <a className="pv-button" href={`/v/mine/${signup.cancel_token}`}>See my shifts</a>
            <a className="pv-link" href={`/v/${token}`}>Pick a different shift</a>
            <a className="pv-link danger" href={`/v/cancel/${signup.cancel_token}`}>Leave the waiting list</a>
          </div>
        ) : (
          <div className="pv-card pv-fields">
          <p className="pv-note">Plans change? Switch to another shift or cancel from your shifts page, now or later. No login needed.</p>
          <a className="pv-button" href={`/v/mine/${signup.cancel_token}`}>See or change my shifts</a>
          <a className="pv-link" href={`/v/ics/${signup.cancel_token}`}>Add to my calendar</a>
          <a className="pv-textlink" href={googleCalendarUrl({ signup, event, shift, org, siteUrl: siteUrl() })} target="_blank" rel="noopener">Use Google Calendar? Add it there</a>
          <a className="pv-link" href={`/v/${token}`}>Sign up someone else</a>
          <a className="pv-link danger" href={`/v/cancel/${signup.cancel_token}`}>Cancel this sign-up</a>
          <p className="pv-muted">Keep this link to get back to your shifts any time:</p>
          <CopyField value={mineUrl} />
          {signup.is_minor && signup.guardian_name && (
            <p className="pv-muted">Guardian on file: {signup.guardian_name}{signup.guardian_phone ? `, ${signup.guardian_phone}` : ""}.</p>
          )}
          <p className="pv-fine">{signup.email ? `A confirmation is on its way to ${signup.email}, and reminders follow the day before and the morning of.` : "This page is your confirmation."} On the day, scan the QR code at the event to check in.</p>
        </div>
        )}
      </main>
      <footer className="pv-foot">
        {org.contact_email && <span>Questions? <a href={`mailto:${org.contact_email}`}>{org.contact_email}</a></span>}
        <span>Sign-ups by <a href="/">CivicKettle</a></span>
      </footer>
    </div>
  );
}
