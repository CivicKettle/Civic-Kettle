import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getOrg, getSession } from "@/lib/db";

export const metadata: Metadata = { title: "Send feedback | CivicKettle" };
export const dynamic = "force-dynamic";

/** One box for telling CivicKettle what is confusing, broken or missing. It arrives as an email. */
export default async function FeedbackPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { sent, error } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/app");
  const org = await getOrg(session);
  if (!org || !session.hasPassword) redirect("/app/setup");

  return (
    <AppShell active="feedback" orgName={org.name} email={session.email}>
      <div className="ap-top">
        <div>
          <p className="ck-kicker">Help us make this better</p>
          <h1 className="ap-h1">Send feedback</h1>
        </div>
      </div>
      <section className="ap-card ap-narrow">
        <div className="ap-card-h"><h2>What should we know?</h2></div>
        <div className="ap-card-b">
          {sent ? (
            <>
              <p className="ap-flash">Thank you. Your note was sent, and we read every one.</p>
              <p className="ap-muted">We will reply to {session.email} if we have a question.</p>
              <a className="ck-button" href="/app/dashboard">Back to Overview</a>
            </>
          ) : (
            <form action="/app/api/feedback" method="post" className="ap-form">
              {error && <p className="ap-error" role="alert">{error}</p>}
              <label htmlFor="message">Anything confusing, broken, missing, or good</label>
              <textarea id="message" name="message" rows={7} required minLength={3} maxLength={4000} placeholder="For example: I couldn&apos;t find where to print the QR code." />
              <p className="ap-muted">This goes straight to the people who build CivicKettle, along with your organization&apos;s name and your email so we can reply.</p>
              <button className="ck-button" type="submit">Send feedback</button>
            </form>
          )}
        </div>
      </section>
    </AppShell>
  );
}
