import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import EventForm from "@/components/EventForm";
import { getOrg, getSession } from "@/lib/db";

export const metadata: Metadata = { title: "New event | CivicKettle" };
export const dynamic = "force-dynamic";

export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/app");
  const org = await getOrg(session);
  if (!org || !session.hasPassword) redirect("/app/setup");
  const { error } = await searchParams;

  return (
    <AppShell active="events" orgName={org.name} email={session.email}>
      <div className="ap-top">
        <div>
          <p className="ck-kicker"><a href="/app/events">Events</a> › New</p>
          <h1 className="ap-h1">Create an event</h1>
        </div>
      </div>
      <EventForm tz={org.time_zone} error={error} />
    </AppShell>
  );
}
