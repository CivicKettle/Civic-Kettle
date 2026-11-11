import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import FormMemory from "@/components/FormMemory";
import { dailyEmailLimit, pickAudience, type Broadcast } from "@/lib/broadcast";
import { getOrg, getSession, type Event, type Shift, type Signup } from "@/lib/db";
import { loadOptouts } from "@/lib/emails/optout";
import { fmtDate, fmtLongDate, fmtRange, fmtTime } from "@/lib/time";

export const metadata: Metadata = { title: "Message volunteers — CivicKettle" };
export const dynamic = "force-dynamic";

export default async function MessagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; sent?: string; failed?: string; nolog?: string }>;
}) {
  const { id } = await params;
  const q = await searchParams;
  const session = await getSession();
  if (!session) redirect("/app");
  const org = await getOrg(session);
  if (!org) redirect("/app/setup");

  const { data: evRaw } = await session.supabase.from("events").select("*").eq("id", id).eq("org_id", org.id).maybeSingle();
  if (!evRaw) notFound();
  const ev = evRaw as Event;
  const [{ data: sh }, { data: su }, { data: bc }, optouts] = await Promise.all([
    session.supabase.from("shifts").select("*").eq("event_id", id).order("sort_order"),
    session.supabase.from("signups").select("*").eq("event_id", id).order("created_at"),
    session.supabase.from("broadcasts").select("*").eq("event_id", id).order("created_at", { ascending: false }).limit(20),
    loadOptouts(session.supabase, org.id),
  ]);
  const shifts = (sh ?? []) as Shift[];
  const signups = (su ?? []) as Signup[];
  const history = (bc ?? []) as Broadcast[];
  const tz = org.time_zone;
  const all = pickAudience(signups, shifts, "all", optouts);
  const perShift = shifts.map((s) => ({ shift: s, n: pickAudience(signups, shifts, s.id, optouts).send.length }));
  const cancelled = ev.status === "cancelled";
  const sent = Number(q.sent || 0);

  return (
    <AppShell active="events" orgName={org.name} email={session.email}>
      <div className="ap-top">
        <div>
          <p className="ck-kicker"><a href="/app/events">Events</a> › <a href={`/app/events/${id}`}>{ev.title}</a> › Message</p>
          <h1 className="ap-h1">Message volunteers</h1>
          <p className="ap-meta">
            <span>{ev.title}</span>
            <span>{fmtLongDate(ev.starts_at, tz)}</span>
            <span>{fmtRange(ev.starts_at, ev.ends_at, tz)}</span>
          </p>
        </div>
      </div>

      {sent > 0 && (
        <p className="ap-flash">
          Sent to {sent} {sent === 1 ? "person" : "people"}.
          {q.failed ? ` ${q.failed} could not be delivered.` : ""}
          {q.nolog ? " It isn't listed under Sent messages because the database needs the latest setup (v5)." : ""}
        </p>
      )}
      {q.error && <p className="ap-error ap-error-top">{decodeURIComponent(q.error)}</p>}
      {cancelled && <p className="ap-flash">This event is cancelled. Volunteers aren&apos;t told automatically, so this is the place to let them know.</p>}

      <div className="ap-grid-main">
        <form id="message-form" className="ap-card ap-form" action={`/app/api/events/${id}/message`} method="post">
          <FormMemory formId="message-form" storageKey={`ck-message-${id}`} restore={Boolean(q.error)} />
          <label htmlFor="audience">Send to</label>
          <select id="audience" name="audience" defaultValue="all">
            <option value="all">Everyone signed up ({all.send.length})</option>
            {perShift.map(({ shift, n }) => (
              <option key={shift.id} value={shift.id}>{shift.name} only ({n})</option>
            ))}
          </select>
          <label htmlFor="subject">Subject</label>
          <input id="subject" name="subject" type="text" required maxLength={120} placeholder={cancelled ? `Cancelled: ${ev.title}` : `Update: ${ev.title}`} />
          <label htmlFor="body">Message</label>
          <textarea id="body" name="body" rows={9} required maxLength={3000} placeholder={"We moved to field 2, by the north parking lot. Same time.\n\nSee you there."} />
          <p className="ap-muted">
            Each email starts with &quot;Hi&quot; and the person&apos;s first name, and ends with the event details.
            {org.contact_email ? ` Replies go to ${org.contact_email}.` : " Add a contact email in Settings so replies reach you."}
          </p>
          <button className="ck-button" type="submit" disabled={all.send.length === 0}>Send email <span aria-hidden="true">↗</span></button>
          {all.send.length === 0 && <p className="ap-muted">Nobody to email yet. This turns on once someone signs up.</p>}
        </form>

        <div className="ap-stack">
          <section className="ap-card">
            <div className="ap-card-h"><h2>Who gets it</h2></div>
            <div className="ap-card-b ap-notes">
              <p><strong>{all.send.length}</strong> {all.send.length === 1 ? "person" : "people"} signed up with an email address. A parent who signed up two children gets one email.</p>
              {all.off.length > 0 && (
                <>
                  <p><strong>{all.off.length}</strong> turned emails off and won&apos;t get this. Reach them another way:</p>
                  <ul>
                    {all.off.map((s) => (
                      <li key={s.id}>{s.volunteer_name}{s.phone || s.guardian_phone ? ` · ${s.phone || s.guardian_phone}` : " · no phone on file"}</li>
                    ))}
                  </ul>
                </>
              )}
              <p className="ap-muted">Your email plan sends up to {dailyEmailLimit()} emails a day, counting confirmations and reminders.</p>
            </div>
          </section>

          <section className="ap-card">
            <div className="ap-card-h"><h2>Sent messages</h2></div>
            {history.length === 0 && <div className="ap-empty"><p>Nothing sent for this event yet.</p></div>}
            {history.map((b) => (
              <details className="ap-sent" key={b.id}>
                <summary>
                  <strong>{b.subject}</strong>
                  <span className="m">
                    {fmtDate(b.created_at, tz)} at {fmtTime(b.created_at, tz)} · {b.recipient_count} {b.recipient_count === 1 ? "person" : "people"}
                    {b.shift_id ? ` · ${shifts.find((s) => s.id === b.shift_id)?.name ?? "one shift"} only` : ""}
                  </span>
                </summary>
                <p>{b.body}</p>
              </details>
            ))}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
