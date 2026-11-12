import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { KettleMark } from "@/components/AppShell";
import SignupForm from "@/components/SignupForm";
import { checkinWindowOpen } from "@/lib/attendance";
import { DEVICE_COOKIE, parseTokens } from "@/lib/device";
import { loadDeviceSignups, loadPublicEvent } from "@/lib/public";
import { isAdminConfigured } from "@/lib/supabase/admin";
import { fmtLongDate, fmtRange } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const data = await loadPublicEvent(token);
  return { title: data ? `${data.event.title} — ${data.org.name}` : "Volunteer sign-up — CivicKettle" };
}

export default async function PublicEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string; shift?: string; signup?: string }>;
}) {
  const { token } = await params;
  const { error, shift, signup: wantsSignup } = await searchParams;

  if (!isAdminConfigured()) {
    return (
      <div className="pv">
        <header className="pv-head"><span className="pv-brand"><KettleMark />CivicKettle</span></header>
        <main className="pv-body"><div className="pv-card"><h2>Sign-up pages aren&apos;t switched on yet</h2><p className="pv-muted">The server is missing its secret key. The coordinator will have this sorted shortly.</p></div></main>
      </div>
    );
  }

  const data = await loadPublicEvent(token);
  if (!data) notFound();
  const { org, event, shifts } = data;
  const tz = org.time_zone;
  const past = new Date(event.ends_at).getTime() < Date.now();

  // On the day, the same link (and QR code) is the check-in page. A phone that
  // already holds a sign-up for this event goes straight there.
  const checkinOpen = checkinWindowOpen(event);
  if (checkinOpen && !wantsSignup && !error) {
    const jar = await cookies();
    const mine = await loadDeviceSignups(event.id, parseTokens(jar.get(DEVICE_COOKIE)?.value));
    if (mine.length > 0) redirect(`/v/${token}/checkin`);
  }

  return (
    <div className="pv">
      <header className="pv-head">
        <span className="pv-brand"><KettleMark />CivicKettle</span>
        <span className="pv-org">{org.name}</span>
      </header>
      <main className="pv-body">
        <div>
          <p className="pv-kicker">Volunteer sign-up</p>
          <h1 className="pv-h1">{event.title}</h1>
          <p className="pv-meta">
            {fmtLongDate(event.starts_at, tz)} · {fmtRange(event.starts_at, event.ends_at, tz)}
            {event.location && <><br />{event.location}</>}
          </p>
          {event.description && <p className="pv-desc">{event.description}</p>}
        </div>

        {checkinOpen && (
          <div className="pv-card pv-fields pv-today">
            <p className="pv-hi">Here to volunteer today?</p>
            <a className="pv-button big" href={`/v/${token}/checkin`}>Check in</a>
          </div>
        )}

        {event.status === "cancelled" ? (
          <div className="pv-card"><h2>This event has been cancelled</h2><p className="pv-muted">Sorry about that. {org.contact_email ? <>Questions: <a href={`mailto:${org.contact_email}`}>{org.contact_email}</a>.</> : null}</p></div>
        ) : past ? (
          <div className="pv-card"><h2>This event has already happened</h2><p className="pv-muted">Thanks for your interest. Watch for the next one from {org.name}.</p></div>
        ) : (
          <SignupForm token={token} shifts={shifts} tz={tz} error={error} prefillShift={shift} />
        )}
      </main>
      <footer className="pv-foot">
        {org.contact_email && <span>Questions? <a href={`mailto:${org.contact_email}`}>{org.contact_email}</a></span>}
        {org.slug && <span><a href={`/o/${org.slug}`}>More from {org.name}</a></span>}
        <span>Sign-ups by <a href="/">CivicKettle</a></span>
      </footer>
    </div>
  );
}
