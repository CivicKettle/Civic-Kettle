import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getOrg, getSession } from "@/lib/db";
import { TIME_ZONES } from "@/lib/time";

export const metadata: Metadata = { title: "Settings — CivicKettle" };
export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/app");
  const org = await getOrg(session);
  if (!org) redirect("/app/setup");
  const { error } = await searchParams;

  return (
    <AppShell active="settings" orgName={org.name} email={session.email}>
      <div className="ap-top">
        <div>
          <p className="ck-kicker">{org.name}</p>
          <h1 className="ap-h1">Settings</h1>
        </div>
      </div>
      <form action="/app/api/org" method="post" className="ap-card ap-form ap-narrow">
        <input type="hidden" name="intent" value="update" />
        <label htmlFor="name">Organization name</label>
        <input id="name" name="name" type="text" required maxLength={80} defaultValue={org.name} />
        <label htmlFor="contact_email">Contact email <span>Shown to volunteers</span></label>
        <input id="contact_email" name="contact_email" type="email" defaultValue={org.contact_email ?? ""} />
        <label htmlFor="tz">Time zone</label>
        <select id="tz" name="time_zone" defaultValue={org.time_zone}>
          {TIME_ZONES.map((tz) => <option key={tz} value={tz}>{tz.replace("_", " ")}</option>)}
        </select>
        {error && <p className="ap-error">{decodeURIComponent(error)}</p>}
        <button className="ck-button" type="submit">Save <span aria-hidden="true">↗</span></button>
      </form>
      <p className="ap-muted">Coordinator: {session.email}. Adding more coordinators comes later.</p>
    </AppShell>
  );
}
