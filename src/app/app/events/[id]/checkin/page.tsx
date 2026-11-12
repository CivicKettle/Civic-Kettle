import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import AppShell from "@/components/AppShell";
import AutoRefresh from "@/components/AutoRefresh";
import { attendance, fmtHours } from "@/lib/attendance";
import { getOrg, getSession, type Event, type Shift, type Signup } from "@/lib/db";
import { siteUrl } from "@/lib/supabase/server";
import { fmtLongDate, fmtRange, fmtTime } from "@/lib/time";

export const metadata: Metadata = { title: "Check-in | CivicKettle" };
export const dynamic = "force-dynamic";

export default async function EventCheckinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/app");
  const org = await getOrg(session);
  if (!org || !session.hasPassword) redirect("/app/setup");

  const { data: evRaw } = await session.supabase.from("events").select("*").eq("id", id).eq("org_id", org.id).maybeSingle();
  if (!evRaw) notFound();
  const ev = evRaw as Event;
  const [{ data: shRaw }, { data: suRaw }] = await Promise.all([
    session.supabase.from("shifts").select("*").eq("event_id", id).order("sort_order"),
    session.supabase.from("signups").select("*").eq("event_id", id).eq("status", "confirmed").order("volunteer_name"),
  ]);
  const shifts = (shRaw ?? []) as Shift[];
  const signups = (suRaw ?? []) as Signup[];
  const tz = org.time_zone;
  const publicUrl = `${siteUrl()}/v/${ev.public_token}`;
  const qrSvg = await QRCode.toString(publicUrl, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#1f2a24", light: "#ffffff" },
  });

  const rows = signups.map((s) => {
    const shift = shifts.find((x) => x.id === s.shift_id)!;
    return { s, shift, a: shift ? attendance(s, shift) : ({ state: "none" } as const) };
  });
  const here = rows.filter((r) => r.a.state !== "none").length;
  const totalHours = rows.reduce((sum, r) => sum + (r.a.state === "done" ? r.a.hours : 0), 0);

  const Mark = ({ sid, intent, label, kind }: { sid: string; intent: "in" | "out" | "undo"; label: string; kind?: "primary" | "ghost" | "link" }) => (
    <form action={`/app/api/signups/${sid}/attendance`} method="post">
      <input type="hidden" name="event_id" value={id} />
      <input type="hidden" name="intent" value={intent} />
      <button type="submit" className={kind === "link" ? "ap-link" : kind === "ghost" ? "ap-ghost sm" : "ck-button sm"}>{label}</button>
    </form>
  );

  return (
    <AppShell active="events" orgName={org.name} email={session.email}>
      <AutoRefresh seconds={20} />
      <div className="ap-top">
        <div>
          <p className="ck-kicker"><a href="/app/events">Events</a> › <a href={`/app/events/${id}`}>{ev.title}</a> › Check-in</p>
          <h1 className="ap-h1">Check-in</h1>
          <p className="ap-meta">
            <span>{fmtLongDate(ev.starts_at, tz)}</span>
            <span>{fmtRange(ev.starts_at, ev.ends_at, tz)}</span>
            <span>{here} of {signups.length} here</span>
            {totalHours > 0 && <span>{fmtHours(totalHours)} logged</span>}
          </p>
        </div>
        <div className="ap-actions">
          <a className="ap-ghost" href={`/app/events/${id}`}>Back to event</a>
        </div>
      </div>

      <div className="ap-grid-main">
        <section className="ap-card">
          <div className="ap-card-h"><h2>Roster</h2><span className="ap-muted">Updates on its own every 20 seconds</span></div>
          {signups.length === 0 && <div className="ap-empty"><p>No confirmed sign-ups yet.</p></div>}
          {shifts.map((shift) => {
            const group = rows.filter((r) => r.s.shift_id === shift.id);
            if (group.length === 0) return null;
            return (
              <div className="ap-shift" key={shift.id}>
                <div className="ap-shift-h">
                  <h3>{shift.name}</h3>
                  <span className="t">{fmtRange(shift.starts_at, shift.ends_at, tz)} · {group.filter((r) => r.a.state !== "none").length} of {group.length} here</span>
                </div>
                <div className="ap-roster">
                  {group.map(({ s, a }) => (
                    <div className={`ap-roster-row ${a.state}`} key={s.id}>
                      <div className="who">
                        <strong>{s.volunteer_name}</strong>{s.is_minor && <span className="ap-pill amber">Minor</span>}
                        <div className="m">
                          {a.state === "none" && "Not here yet"}
                          {a.state === "in" && `In at ${fmtTime(a.inAt, tz)}`}
                          {a.state === "done" && `${fmtTime(a.inAt, tz)} to ${fmtTime(a.outAt, tz)} · ${fmtHours(a.hours)}${a.auto ? " · closed at shift end" : ""}`}
                        </div>
                      </div>
                      <div className="acts">
                        {a.state === "none" && <Mark sid={s.id} intent="in" label="Check in" />}
                        {a.state === "in" && <><Mark sid={s.id} intent="out" label="Check out" kind="ghost" /><Mark sid={s.id} intent="undo" label="Undo" kind="link" /></>}
                        {a.state === "done" && (a.auto
                          ? <Mark sid={s.id} intent="undo" label="Undo check-in" kind="link" />
                          : <Mark sid={s.id} intent="undo" label="Undo check-out" kind="link" />)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <div className="ap-stack">
          <section className="ap-card">
            <div className="ap-card-h"><h2>Event QR code</h2></div>
            <div className="ap-card-b ap-qr">
              <div className="ap-qr-img" role="img" aria-label="QR code for this event's sign-up and check-in page" dangerouslySetInnerHTML={{ __html: qrSvg }} />
              <p className="ap-muted">One code, two jobs. Before the event it signs people up. From an hour before start, the same scan checks them in, and scanning again checks them out.</p>
              <div className="ap-actions">
                <a className="ck-button sm" href={`/app/events/${id}/poster`} target="_blank" rel="noreferrer">Print a door sign</a>
                <a className="ap-ghost sm" href={`/app/api/events/${id}/qr`}>Download PNG</a>
              </div>
            </div>
          </section>
          <section className="ap-card">
            <div className="ap-card-h"><h2>How hours are counted</h2></div>
            <div className="ap-card-b ap-prose">
              <p>From check-in to check-out. Anyone who forgets to check out is closed at the end of their shift. Marking someone in after their shift has ended counts the whole shift.</p>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
