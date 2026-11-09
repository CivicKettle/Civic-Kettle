import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getOrg, getSession } from "@/lib/db";

export const metadata: Metadata = { title: "Volunteers — CivicKettle" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/app");
  const org = await getOrg(session);
  if (!org) redirect("/app/setup");
  return (
    <AppShell active="volunteers" orgName={org.name} email={session.email}>
      <div className="ap-top"><div><p className="ck-kicker">{org.name}</p><h1 className="ap-h1">Volunteers</h1></div></div>
      <div className="ap-card ap-notice"><h2>Coming next</h2><p>Everyone who has signed up for any of your events, in one list.</p></div>
    </AppShell>
  );
}
