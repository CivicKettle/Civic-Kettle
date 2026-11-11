import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KettleMark } from "@/components/AppShell";
import { loadOptouts, normEmail } from "@/lib/emails/optout";
import { loadSignupByCancelToken } from "@/lib/public";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Email settings — CivicKettle", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string; on?: string; error?: string }>;
}) {
  const { token } = await params;
  const q = await searchParams;
  const data = await loadSignupByCancelToken(token);
  const admin = createAdminClient();
  if (!data || !admin || !data.signup.email) notFound();
  const { signup, event, org } = data;
  const off = (await loadOptouts(admin, event.org_id)).has(normEmail(signup.email));
  const action = `/api/unsubscribe/${token}`;

  return (
    <div className="pv">
      <header className="pv-head">
        <span className="pv-brand"><KettleMark />CivicKettle</span>
        <span className="pv-org">{org.name}</span>
      </header>
      <main className="pv-body">
        <div>
          <p className="pv-kicker">Email settings</p>
          <h1 className="pv-h1">{off ? `Emails from ${org.name} are off.` : `Stop emails from ${org.name}?`}</h1>
          <p className="pv-meta">{signup.email}</p>
        </div>
        <div className="pv-card pv-fields">
          {q.error && <p className="pv-error">That didn&apos;t save. Try again in a minute{org.contact_email ? `, or write to ${org.contact_email}` : ""}.</p>}
          {off ? (
            <form action={action} method="post" className="pv-fields">
              <input type="hidden" name="from" value="page" />
              <input type="hidden" name="intent" value="on" />
              <p className="pv-note">
                {q.done ? "Done. " : ""}No more reminder emails or messages from {org.name} will go to this address. Your sign-ups haven&apos;t changed, and you&apos;ll still get a confirmation when you sign up for something or cancel.
              </p>
              <button className="pv-button" type="submit">Turn emails back on</button>
              <a className="pv-link" href={`/v/cancel/${signup.cancel_token}`}>Cancel my sign-up for {event.title} instead ›</a>
            </form>
          ) : (
            <form action={action} method="post" className="pv-fields">
              <input type="hidden" name="from" value="page" />
              <input type="hidden" name="intent" value="off" />
              <p className="pv-note">
                {q.on ? "Emails are back on. " : ""}This stops the day-before and morning-of reminders, and any messages {org.name} sends about its events. Your sign-ups stay as they are, and you&apos;ll still get a confirmation when you sign up for something or cancel.
              </p>
              <button className="pv-button danger" type="submit">Stop these emails</button>
              <a className="pv-link" href={`/v/${event.public_token}`}>Keep them, take me to the event ›</a>
            </form>
          )}
        </div>
      </main>
      <footer className="pv-foot">
        {org.contact_email && <span>Questions? <a href={`mailto:${org.contact_email}`}>{org.contact_email}</a></span>}
        <span>Sign-ups by <a href="/">CivicKettle</a> · <a href="/privacy">Privacy</a></span>
      </footer>
    </div>
  );
}
