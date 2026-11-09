import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOrg, getSession } from "@/lib/db";
import { TIME_ZONES } from "@/lib/time";
import { KettleMark } from "@/components/AppShell";

export const metadata: Metadata = { title: "Set up your organization — CivicKettle" };
export const dynamic = "force-dynamic";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/app");
  const org = await getOrg(session);
  if (org) redirect("/app/dashboard");
  const { error } = await searchParams;

  return (
    <div className="ap-center">
      <a className="ap-brand" href="/">
        <KettleMark />
        CivicKettle
      </a>
      <div className="ap-card ap-form ap-narrow">
        <p className="ck-kicker">One last thing</p>
        <h1 className="ap-h1">Name your organization</h1>
        <p className="ap-muted">
          This is what volunteers see on sign-up pages and reminders. You can change it later in Settings.
        </p>
        <form action="/app/api/org" method="post" className="ap-form">
          <input type="hidden" name="intent" value="create" />
          <label htmlFor="name">Organization name</label>
          <input id="name" name="name" type="text" required maxLength={80} placeholder="Maple Street Community Garden" autoFocus />
          <label htmlFor="tz">Time zone</label>
          <select id="tz" name="time_zone" defaultValue="America/Los_Angeles">
            {TIME_ZONES.map((tz) => (
              <option key={tz} value={tz}>{tz.replace("_", " ")}</option>
            ))}
          </select>
          {error && <p className="ap-error">{decodeURIComponent(error)}</p>}
          <button className="ck-button" type="submit">Create workspace <span aria-hidden="true">↗</span></button>
        </form>
        <p className="ap-muted">Signed in as {session.email}</p>
      </div>
    </div>
  );
}
