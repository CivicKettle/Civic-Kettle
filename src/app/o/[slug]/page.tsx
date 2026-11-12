import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KettleMark } from "@/components/AppShell";
import { loadOrgPage } from "@/lib/public";
import { dateTile, fmtLongDate, fmtRange } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadOrgPage(slug);
  return data
    ? { title: `Volunteer with ${data.org.name}`, description: `Upcoming events from ${data.org.name} that need volunteers. Pick one and sign up, no account needed.` }
    : { title: "Volunteer events — CivicKettle" };
}

/** One link for everything an organization needs help with. */
export default async function OrgPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await loadOrgPage(slug);
  if (!data) notFound();
  const { org, events } = data;
  const tz = org.time_zone;

  return (
    <div className="pv">
      <header className="pv-head">
        <span className="pv-brand"><KettleMark />CivicKettle</span>
        <span className="pv-org">{org.name}</span>
      </header>
      <main className="pv-body">
        <div className="pv-hero">
          <p className="pv-kicker">Volunteer</p>
          <h1 className="pv-h1">{org.name}</h1>
          <p className="pv-meta">
            {events.length > 0 ? "Here is what we need help with. Pick an event to sign up. It takes under a minute and you don't need an account." : "Nothing is scheduled right now. Check back soon."}
          </p>
        </div>

        {events.map(({ event, open, capacity, shifts }) => {
          const tile = dateTile(event.starts_at, tz);
          return (
            <a className="pv-card pv-event" key={event.id} href={`/v/${event.public_token}`}>
              <span className="pv-date"><small>{tile.dow}</small><strong>{tile.day}</strong></span>
              <span className="pv-event-main">
                <strong>{event.title}</strong>
                <span>{fmtLongDate(event.starts_at, tz)}, {fmtRange(event.starts_at, event.ends_at, tz)}</span>
                {event.location && <span>{event.location}</span>}
                <span className={open === 0 ? "pv-event-spots full" : open <= 3 ? "pv-event-spots low" : "pv-event-spots"}>
                  {open === 0 ? "Full" : `${open} of ${capacity} spots open`}{shifts > 1 ? `, ${shifts} shifts` : ""}
                </span>
              </span>
              <span className="pv-event-go">{open === 0 ? "View" : "Sign up"}</span>
            </a>
          );
        })}
      </main>
      <footer className="pv-foot">
        {org.contact_email && <span>Questions? <a href={`mailto:${org.contact_email}`}>{org.contact_email}</a></span>}
        <span>Sign-ups by <a href="/">CivicKettle</a></span>
      </footer>
    </div>
  );
}
