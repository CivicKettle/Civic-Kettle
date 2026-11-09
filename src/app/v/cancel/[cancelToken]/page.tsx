import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KettleMark } from "@/components/AppShell";
import { loadSignupByCancelToken } from "@/lib/public";
import { fmtLongDate, fmtRange } from "@/lib/time";

export const metadata: Metadata = { title: "Cancel sign-up — CivicKettle" };
export const dynamic = "force-dynamic";

export default async function CancelPage({
  params,
  searchParams,
}: {
  params: Promise<{ cancelToken: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { cancelToken } = await params;
  const { done } = await searchParams;
  const data = await loadSignupByCancelToken(cancelToken);
  if (!data) notFound();
  const { signup, event, shift, org } = data;
  const tz = org.time_zone;
  const cancelled = signup.status === "cancelled";

  return (
    <div className="pv">
      <header className="pv-head">
        <span className="pv-brand"><KettleMark />CivicKettle</span>
        <span className="pv-org">{org.name}</span>
      </header>
      <main className="pv-body">
        <div>
          <p className="pv-kicker">{cancelled ? "Cancelled" : "Cancel sign-up"}</p>
          <h1 className="pv-h1">{cancelled ? (done ? "Done. Your spot is open for someone else." : "This sign-up was already cancelled.") : `Can't make it, ${signup.volunteer_name.split(" ")[0]}?`}</h1>
          <p className="pv-meta">
            <strong>{event.title}</strong><br />
            {fmtLongDate(event.starts_at, tz)}<br />
            {shift.name} · {fmtRange(shift.starts_at, shift.ends_at, tz)}
          </p>
        </div>
        <div className="pv-card pv-fields">
          {cancelled ? (
            <>
              <p className="pv-note">Thanks for letting {org.name} know. Changed your mind? You can sign up again from the event page.</p>
              <a className="pv-button" href={`/v/${event.public_token}`}>Back to the event ↗</a>
            </>
          ) : (
            <form action="/app/api/public/cancel" method="post" className="pv-fields">
              <input type="hidden" name="cancel_token" value={cancelToken} />
              <p className="pv-note">No hard feelings. Cancelling frees the spot right away so someone else can take it.</p>
              <button className="pv-button danger" type="submit">Yes, cancel my sign-up</button>
              <a className="pv-link" href={`/v/${event.public_token}`}>Keep it, take me back ›</a>
            </form>
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
