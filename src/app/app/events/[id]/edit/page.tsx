import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import EventForm from "@/components/EventForm";
import { getOrg, getSession, type Event, type Shift } from "@/lib/db";

export const metadata: Metadata = { title: "Edit event — CivicKettle" };
export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/app");
  const org = await getOrg(session);
  if (!org) redirect("/app/setup");

  const { data: ev } = await session.supabase.from("events").select("*").eq("id", id).eq("org_id", org.id).maybeSingle();
  if (!ev) notFound();
  const { data: sh } = await session.supabase.from("shifts").select("*").eq("event_id", id).order("sort_order");

  return (
    <AppShell active="events" orgName={org.name} email={session.email}>
      <div className="ap-top">
        <div>
          <p className="ck-kicker"><a href="/app/events">Events</a> › <a href={`/app/events/${id}`}>{(ev as Event).title}</a> › Edit</p>
          <h1 className="ap-h1">Edit event</h1>
        </div>
      </div>
      <EventForm tz={org.time_zone} event={ev as Event} shifts={(sh ?? []) as Shift[]} error={error} />
    </AppShell>
  );
}
