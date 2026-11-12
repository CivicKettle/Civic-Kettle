import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import ShareBar from "@/components/ShareBar";
import { getOrg, getSession, withCounts, type Event, type Shift, type Signup } from "@/lib/db";
import { siteUrl } from "@/lib/supabase/server";
import { dateTile, fmtDate, fmtRange } from "@/lib/time";

export const metadata: Metadata = { title: "Events — CivicKettle" };
export const dynamic = "force-dynamic";

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ created?: string; error?: string }> }) {
  const flags = await searchParams;
  const session = await getSession();
  if (!session) redirect("/app");
  const org = await getOrg(session);
  if (!org) redirect("/app/setup");

  const { data: evs } = await session.supabase
    .from("events")
    .select("id,title,location,starts_at,ends_at,status,public_token")
    .eq("org_id", org.id)
    .order("starts_at", { ascending: false })
    .limit(100);
  const events = (evs ?? []) as Pick<Event, "id" | "title" | "location" | "starts_at" | "ends_at" | "status" | "public_token">[];
  const ids = events.map((e) => e.id);

  let shifts: Shift[] = [];
  let signups: Pick<Signup, "shift_id" | "status">[] = [];
  if (ids.length) {
    const [{ data: s }, { data: su }] = await Promise.all([
      session.supabase.from("shifts").select("*").in("event_id", ids),
      session.supabase.from("signups").select("shift_id,status,event_id").in("event_id", ids),
    ]);
    shifts = (s ?? []) as Shift[];
    signups = (su ?? []) as Pick<Signup, "shift_id" | "status">[];
  }

  const now = Date.now();
  const rows = events.map((e) => {
    const sc = withCounts(shifts.filter((s) => s.event_id === e.id), signups);
    const capacity = sc.reduce((a, s) => a + s.capacity, 0);
    const filled = sc.reduce((a, s) => a + s.confirmed, 0);
    return { e, capacity, filled, past: new Date(e.ends_at).getTime() < now };
  });
  const upcoming = rows.filter((r) => !r.past).reverse();
  const past = rows.filter((r) => r.past);

  const List = ({ items, title }: { items: typeof rows; title: string }) => (
    <section className="ap-card">
      <div className="ap-card-h"><h2>{title}</h2></div>
      {items.length === 0 ? (
        <div className="ap-empty"><p>Nothing here yet.</p></div>
      ) : (
        items.map(({ e, capacity, filled }) => {
          const tile = dateTile(e.starts_at, org.time_zone);
          const pct = capacity ? Math.round((filled / capacity) * 100) : 0;
          return (
            <a key={e.id} href={`/app/events/${e.id}`} className="ap-ev">
              <span className="ap-date"><small>{tile.dow}</small><strong>{tile.day}</strong></span>
              <span>
                <h3>{e.title}{e.status === "cancelled" && <span className="ap-pill amber">Cancelled</span>}</h3>
                <p>{fmtDate(e.starts_at, org.time_zone, { month: "long" })} · {fmtRange(e.starts_at, e.ends_at, org.time_zone)}{e.location ? ` · ${e.location}` : ""}</p>
              </span>
              <span className="ap-cap">{filled} of {capacity} spots<span className="ap-bar"><i className={pct < 50 ? "low" : undefined} style={{ width: `${pct}%` }} /></span></span>
            </a>
          );
        })
      )}
    </section>
  );

  return (
    <AppShell active="events" orgName={org.name} email={session.email}>
      <div className="ap-top">
        <div>
          <p className="ck-kicker">{org.name}</p>
          <h1 className="ap-h1">Events</h1>
        </div>
        <a className="ck-button" href="/app/events/new">New event <span aria-hidden="true">+</span></a>
      </div>

      {flags.created && <p className="ap-flash">Created {flags.created} events, one for each date. They&apos;re all on your organization&apos;s page.</p>}
      {flags.error && <p className="ap-error ap-error-top">{decodeURIComponent(flags.error)}</p>}
      <ShareBar
        url={`${siteUrl()}/o/${org.slug}`}
        label="Your organization's page"
        sub="One link that lists every upcoming event. Put it on your website or social profile so volunteers can see everything you need help with."
        openLabel="Open the page"
      />
      <List items={upcoming} title="Upcoming" />
      {past.length > 0 && <List items={past} title="Past" />}
    </AppShell>
  );
}
