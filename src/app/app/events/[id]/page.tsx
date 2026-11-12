import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import ShareBar from "@/components/ShareBar";
import { attendance } from "@/lib/attendance";
import { getOrg, getSession, withCounts, type Event, type Shift, type Signup } from "@/lib/db";
import { siteUrl } from "@/lib/supabase/server";
import { fmtLongDate, fmtRange } from "@/lib/time";

export const metadata: Metadata = { title: "Event — CivicKettle" };
export const dynamic = "force-dynamic";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const flags = await searchParams;
  const session = await getSession();
  if (!session) redirect("/app");
  const org = await getOrg(session);
  if (!org || !session.hasPassword) redirect("/app/setup");

  const { data: evRaw } = await session.supabase.from("events").select("*").eq("id", id).eq("org_id", org.id).maybeSingle();
  if (!evRaw) notFound();
  const ev = evRaw as Event;

  const [{ data: shRaw }, { data: suRaw }] = await Promise.all([
    session.supabase.from("shifts").select("*").eq("event_id", id).order("sort_order"),
    session.supabase.from("signups").select("*").eq("event_id", id).order("created_at"),
  ]);
  const shifts = withCounts((shRaw ?? []) as Shift[], (suRaw ?? []) as Signup[]);
  const signups = (suRaw ?? []) as Signup[];
  const capacity = shifts.reduce((a, s) => a + s.capacity, 0);
  const filled = shifts.reduce((a, s) => a + s.confirmed, 0);
  const publicUrl = `${siteUrl()}/v/${ev.public_token}`;
  const tz = org.time_zone;

  return (
    <AppShell active="events" orgName={org.name} email={session.email}>
      <div className="ap-top">
        <div>
          <p className="ck-kicker"><a href="/app/events">Events</a> › {ev.title}</p>
          <h1 className="ap-h1">{ev.title}{ev.status === "cancelled" && <span className="ap-pill amber">Cancelled</span>}</h1>
          <p className="ap-meta">
            <span>{fmtLongDate(ev.starts_at, tz)}</span>
            <span>{fmtRange(ev.starts_at, ev.ends_at, tz)}</span>
            {ev.location && <span>{ev.location}</span>}
          </p>
        </div>
        <div className="ap-actions">
          {ev.status !== "cancelled" && <a className="ck-button" href={`/app/events/${id}/checkin`}>Check-in and QR code</a>}
          <a className="ap-ghost" href={`/app/events/${id}/message`}>Message volunteers</a>
          <a className="ap-ghost" href={`/app/events/${id}/summary`}>Summary</a>
          <a className="ap-ghost" href={`/app/events/${id}/edit`}>Edit event</a>
          <form action={`/app/api/events/${id}`} method="post">
            <input type="hidden" name="intent" value={ev.status === "cancelled" ? "restore" : "cancel"} />
            <button className="ap-ghost" type="submit">{ev.status === "cancelled" ? "Restore event" : "Cancel event"}</button>
          </form>
        </div>
      </div>

      {(flags.created || flags.saved) && (
        <p className="ap-flash">{flags.created ? "Event created. Share the sign-up link below." : "Changes saved."}</p>
      )}
      {flags.error && <p className="ap-error">{decodeURIComponent(flags.error)}</p>}
      {ev.status === "cancelled" && filled > 0 && (
        <p className="ap-flash">This event is cancelled. Volunteers aren&apos;t told automatically. <a href={`/app/events/${id}/message`}>Message the {filled} signed up ›</a></p>
      )}

      {ev.status !== "cancelled" && <ShareBar url={publicUrl} />}

      <div className="ap-grid-main">
        <section className="ap-card">
          <div className="ap-card-h"><h2>Shifts · {filled} of {capacity} spots filled</h2></div>
          {shifts.map((s) => {
            const people = signups.filter((x) => x.shift_id === s.id && x.status === "confirmed");
            const waiting = signups.filter((x) => x.shift_id === s.id && x.status === "waitlist");
            const pct = s.capacity ? Math.round((s.confirmed / s.capacity) * 100) : 0;
            return (
              <div className="ap-shift" key={s.id}>
                <div className="ap-shift-h">
                  <h3>{s.name}</h3>
                  <span className="t">{fmtRange(s.starts_at, s.ends_at, tz)} · {s.confirmed} of {s.capacity}{s.open === 0 ? " · Full" : ""}{waiting.length ? ` · ${waiting.length} waiting` : ""}</span>
                </div>
                <span className="ap-bar"><i className={pct < 50 ? "low" : undefined} style={{ width: `${pct}%` }} /></span>
                <div className="ap-people">
                  {people.map((p) => (
                    <form key={p.id} action={`/app/api/signups/${p.id}/cancel`} method="post" className={`ap-person${attendance(p, s).state !== "none" ? " in" : ""}`} title={attendance(p, s).state !== "none" ? "Checked in" : undefined}>
                      <input type="hidden" name="event_id" value={id} />
                      <i>{initials(p.volunteer_name)}</i>
                      <span>{p.volunteer_name}{p.is_minor ? " · minor" : ""}</span>
                      <button type="submit" aria-label={`Cancel ${p.volunteer_name}'s sign-up`} title="Cancel this sign-up">×</button>
                    </form>
                  ))}
                  {Array.from({ length: s.open }).map((_, i) => (
                    <span key={`open-${i}`} className="ap-person open"><i>+</i>Open spot</span>
                  ))}
                </div>
                {waiting.length > 0 && (
                  <div className="ap-waiting">
                    <span className="ap-waiting-k">Waiting list, first in line first</span>
                    <div className="ap-people">
                      {waiting.map((p) => (
                        <form key={p.id} action={`/app/api/signups/${p.id}/cancel`} method="post" className="ap-person wait">
                          <input type="hidden" name="event_id" value={id} />
                          <i>{initials(p.volunteer_name)}</i>
                          <span>{p.volunteer_name}{p.is_minor ? " · minor" : ""}</span>
                          <button type="submit" aria-label={`Remove ${p.volunteer_name} from the waiting list`} title="Remove from the waiting list">×</button>
                        </form>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {shifts.length === 0 && <div className="ap-empty"><p>No shifts yet. <a href={`/app/events/${id}/edit`}>Add some.</a></p></div>}
        </section>

        <div className="ap-stack">
          <section className="ap-card">
            <div className="ap-card-h"><h2>Sign-ups</h2></div>
            <div className="ap-list">
              {signups.length === 0 && <div className="ap-empty"><p>No one yet.</p></div>}
              {signups.map((p) => (
                <div key={p.id} className={`ap-row${p.status === "cancelled" ? " dim" : ""}`}>
                  <div>
                    <strong>{p.volunteer_name}</strong>
                    <div className="m">
                      {shifts.find((s) => s.id === p.shift_id)?.name}
                      {p.phone ? ` · ${p.phone}` : ""}
                      {p.is_minor && p.guardian_name ? ` · Guardian: ${p.guardian_name}${p.guardian_phone ? ` ${p.guardian_phone}` : ""}` : ""}
                    </div>
                  </div>
                  <span className={`ap-pill${p.status === "cancelled" ? " sent" : p.status === "waitlist" ? " amber" : ""}`}>{p.status === "cancelled" ? "Cancelled" : p.status === "waitlist" ? "Waiting list" : "Confirmed"}</span>
                </div>
              ))}
            </div>
          </section>

          {(ev.description || ev.notes_for_volunteers) && (
            <section className="ap-card">
              <div className="ap-card-h"><h2>Details volunteers see</h2></div>
              <div className="ap-card-b ap-prose">
                {ev.description && <p>{ev.description}</p>}
                {ev.notes_for_volunteers && <p><strong>Morning-of note:</strong> {ev.notes_for_volunteers}</p>}
              </div>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}
