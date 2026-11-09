import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KettleMark } from "@/components/AppShell";
import CopyField from "@/components/CopyField";
import { loadSignupByCancelToken } from "@/lib/public";
import { siteUrl } from "@/lib/supabase/server";
import { fmtLongDate, fmtRange } from "@/lib/time";

export const metadata: Metadata = { title: "You're signed up — CivicKettle" };
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
  const cancelUrl = `${siteUrl()}/v/cancel/${signup.cancel_token}`;
  const who = signup.is_minor ? signup.volunteer_name : "You're";

  return (
    <div className="pv">
      <header className="pv-head">
        <span className="pv-brand"><KettleMark />CivicKettle</span>
        <span className="pv-org">{org.name}</span>
      </header>
      <main className="pv-body">
        <div>
          <p className="pv-kicker">{again ? "Already on the list" : "Confirmed"}</p>
          <h1 className="pv-h1">{signup.is_minor ? `${who} is signed up.` : "You're signed up."}</h1>
          <p className="pv-meta">
            <strong>{event.title}</strong><br />
            {fmtLongDate(event.starts_at, tz)}<br />
            {shift.name} · {fmtRange(shift.starts_at, shift.ends_at, tz)}
            {event.location && <><br />{event.location}</>}
          </p>
        </div>
        <div className="pv-card pv-fields">
          <p className="pv-note">Save this page or copy the link below. It&apos;s how you cancel if plans change, and no login is needed.</p>
          <CopyField value={cancelUrl} />
          {signup.is_minor && signup.guardian_name && (
            <p className="pv-muted">Guardian on file: {signup.guardian_name}{signup.guardian_phone ? `, ${signup.guardian_phone}` : ""}.</p>
          )}
          <p className="pv-fine">Reminders by email and text arrive once those are switched on for {org.name}. Until then, this page is your confirmation.</p>
          <a className="pv-link" href={`/v/${token}`}>Sign up someone else ›</a>
        </div>
      </main>
      <footer className="pv-foot">
        {org.contact_email && <span>Questions? <a href={`mailto:${org.contact_email}`}>{org.contact_email}</a></span>}
        <span>Sign-ups by <a href="/">CivicKettle</a></span>
      </footer>
    </div>
  );
}
