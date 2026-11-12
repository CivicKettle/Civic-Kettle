import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KettleMark } from "@/components/AppShell";
import { loadSignupByCancelToken } from "@/lib/public";
import { fmtLongDate, fmtRange } from "@/lib/time";

export const metadata: Metadata = { title: "Confirm your shift | CivicKettle", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Where the "Yes, I'll be there" button in the day-before email lands. */
export default async function ConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ cancelToken: string }>;
  searchParams: Promise<{ done?: string; error?: string; gone?: string }>;
}) {
  const { cancelToken } = await params;
  const { error } = await searchParams;
  const data = await loadSignupByCancelToken(cancelToken);
  if (!data) notFound();
  const { signup, event, shift, org } = data;
  const tz = org.time_zone;
  const first = signup.volunteer_name.split(" ")[0];
  const active = signup.status === "confirmed" && event.status !== "cancelled";
  const said = Boolean(signup.attending_confirmed_at);

  return (
    <div className="pv">
      <header className="pv-head">
        <span className="pv-brand"><KettleMark />CivicKettle</span>
        <span className="pv-org">{org.name}</span>
      </header>
      <main className="pv-body">
        <div className="pv-hero">
          <p className="pv-kicker">{!active ? "Not on the list" : said ? "Confirmed" : "Confirm your shift"}</p>
          <h1 className="pv-h1">
            {!active
              ? event.status === "cancelled" ? "This event was cancelled." : signup.status === "waitlist" ? "You're on the waiting list for this shift." : "This sign-up was cancelled."
              : said ? `Thanks, ${first}. ${org.name} knows you're coming.` : `Still coming, ${first}?`}
          </h1>
          <p className="pv-meta">
            <strong>{event.title}</strong><br />
            {fmtLongDate(shift.starts_at, tz)}<br />
            {shift.name} · {fmtRange(shift.starts_at, shift.ends_at, tz)}
            {event.location ? <><br />{event.location}</> : null}
          </p>
        </div>
        <div className="pv-card pv-fields">
          {!active ? (
            <>
              <p className="pv-note">There is nothing to confirm. You can see what else {org.name} needs help with on the event page.</p>
              <a className="pv-button" href={`/v/${event.public_token}`}>Open the event page ↗</a>
            </>
          ) : said ? (
            <>
              <p className="pv-note">When you arrive, scan the QR code at the event to check in. If your plans change, please cancel so someone else can take the spot.</p>
              <a className="pv-button" href={`/v/ics/${cancelToken}`}>Add to my calendar</a>
              <a className="pv-link" href={`/v/mine/${cancelToken}`}>See or change my shifts</a>
            </>
          ) : (
            <>
              <form action="/app/api/public/confirm" method="post" className="pv-fields">
                <input type="hidden" name="cancel_token" value={cancelToken} />
                {error && <p className="pv-error">That didn&apos;t save. Your spot is still held. Try the button again in a moment.</p>}
                <p className="pv-note">One tap tells {org.name} they can count on {signup.is_minor ? first : "you"}.</p>
                <button className="pv-button" type="submit">{signup.is_minor ? `Yes, ${first} will be there` : "Yes, I'll be there"}</button>
              </form>
              <a className="pv-link danger" href={`/v/cancel/${cancelToken}`}>I can&apos;t make it</a>
            </>
          )}
        </div>
      </main>
      <footer className="pv-foot">
        {org.contact_email && <span>Questions? <a href={`mailto:${org.contact_email}`}>{org.contact_email}</a></span>}
        <span>Sign-ups by <a href="/">CivicKettle</a></span>
      </footer>
    </div>
  );
}
