import type { Metadata } from "next";
import { redirect } from "next/navigation";
import FormMemory from "@/components/FormMemory";
import { KettleMark } from "@/components/AppShell";
import { getOrg, getSession } from "@/lib/db";
import { TIME_ZONES } from "@/lib/time";

export const metadata: Metadata = { title: "Finish setting up | CivicKettle" };
export const dynamic = "force-dynamic";

/**
 * The one stop between a first sign-in and the workspace: name the
 * organization (unless you were invited into one) and choose a password.
 */
export default async function SetupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/app");
  const org = await getOrg(session);
  if (org && session.hasPassword) redirect("/app/dashboard");
  const { error } = await searchParams;
  const needsOrg = !org;
  const needsPassword = !session.hasPassword;

  const passwordFields = (
    <>
      <label htmlFor="pw-new">Create a password <span>At least 8 characters</span></label>
      <input id="pw-new" name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />
      <label htmlFor="pw-again">Type it again</label>
      <input id="pw-again" name="password_again" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />
    </>
  );

  return (
    <div className="ap-center">
      <a className="ap-brand" href="/">
        <KettleMark />
        CivicKettle
      </a>
      <div className="ap-card ap-form ap-narrow">
        <p className="ck-kicker">{needsOrg ? "One last step" : "Almost there"}</p>
        <h1 className="ap-h1">{needsOrg ? "Set up your workspace" : "Create your password"}</h1>
        <p className="ap-muted">
          {needsOrg
            ? "Your organization's name is what volunteers see on sign-up pages and reminders. You can change it later in Settings."
            : `You're joining ${org!.name}. Choose a password so you can sign in from any device.`}
        </p>
        {needsOrg ? (
          <form id="setup-form" action="/app/api/org" method="post" className="ap-form">
            <FormMemory formId="setup-form" storageKey="ck-setup" restore={Boolean(error)} />
            <input type="hidden" name="intent" value="create" />
            <label htmlFor="name">Organization name</label>
            <input id="name" name="name" type="text" required maxLength={80} placeholder="Maple Street Community Garden" autoFocus />
            <label htmlFor="tz">Time zone</label>
            <select id="tz" name="time_zone" defaultValue="America/Los_Angeles">
              {TIME_ZONES.map((tz) => (
                <option key={tz} value={tz}>{tz.replace("_", " ")}</option>
              ))}
            </select>
            {needsPassword && passwordFields}
            {error && <p className="ap-error">{decodeURIComponent(error)}</p>}
            <button className="ck-button" type="submit">Create workspace <span aria-hidden="true">↗</span></button>
          </form>
        ) : (
          <form action="/app/api/password" method="post" className="ap-form">
            <input type="hidden" name="from" value="setup" />
            {passwordFields}
            {error && <p className="ap-error">{decodeURIComponent(error)}</p>}
            <button className="ck-button" type="submit">Save and continue <span aria-hidden="true">↗</span></button>
          </form>
        )}
        <p className="ap-muted">Signed in as {session.email}. You&apos;ll use this email and your password to sign in from now on.</p>
      </div>
    </div>
  );
}
