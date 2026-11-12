import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { fmtHours } from "@/lib/attendance";
import { getOrg, getSession } from "@/lib/db";
import { fmtDate } from "@/lib/time";
import { loadVolunteers } from "@/lib/volunteers";

export const metadata: Metadata = { title: "Delete records — CivicKettle" };
export const dynamic = "force-dynamic";

export default async function DeleteVolunteerPage({ searchParams }: { searchParams: Promise<{ key?: string; error?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/app");
  const org = await getOrg(session);
  if (!org || !session.hasPassword) redirect("/app/setup");
  const q = await searchParams;
  const person = (await loadVolunteers(session, org)).find((v) => v.key === (q.key || ""));
  if (!person) redirect("/app/volunteers");
  const tz = org.time_zone;
  const n = person.signupIds.length;

  return (
    <AppShell active="volunteers" orgName={org.name} email={session.email}>
      <div className="ap-top">
        <div>
          <p className="ck-kicker"><a href="/app/volunteers">Volunteers</a> › Delete records</p>
          <h1 className="ap-h1">Delete {person.name}&apos;s records?</h1>
          <p className="ap-meta"><span>{[person.email, person.phone].filter(Boolean).join(" · ") || "No contact details"}</span></p>
        </div>
      </div>

      {q.error && <p className="ap-error ap-error-top">{decodeURIComponent(q.error)}</p>}

      <div className="ap-grid-main">
        <form className="ap-card ap-form" action="/app/api/volunteers/delete" method="post">
          <input type="hidden" name="key" value={person.key} />
          <div className="ap-notes">
            <p>This is for when someone asks you to remove their information. It permanently deletes:</p>
            <ul>
              <li><strong>{n}</strong> sign-up{n === 1 ? "" : "s"} across {person.events || 1} event{person.events === 1 ? "" : "s"}, including any that were cancelled</li>
              <li>Their name, email address and phone number{person.minor ? ", and their guardian's details" : ""}</li>
              <li>Their check-in times and <strong>{fmtHours(person.hours)}</strong> of recorded hours</li>
              <li>The log of reminder emails sent to them</li>
            </ul>
            <p>Event totals and hours reports will no longer include them. Any upcoming spots they held open up. This can&apos;t be undone.</p>
            <p className="ap-muted">If your organization needs a record of their hours, export it first: <a className="ap-link" href="/app/api/volunteers/export">Export volunteers CSV</a></p>
          </div>
          <label className="ap-check"><input type="checkbox" name="confirm" value="yes" required /> I understand this permanently deletes {person.name}&apos;s records.</label>
          <div className="ap-actions">
            <button className="ck-button danger" type="submit">Delete {n} sign-up{n === 1 ? "" : "s"}</button>
            <a className="ap-ghost" href="/app/volunteers">Keep them</a>
          </div>
        </form>

        <section className="ap-card">
          <div className="ap-card-h"><h2>What will be deleted</h2></div>
          {person.history.map((h, i) => (
            <div className="ap-row" key={i}>
              <div>
                <strong>{h.title}</strong>
                <div className="m">{h.shiftName} · {fmtDate(h.startsAt, tz, { year: "numeric" })}</div>
              </div>
              <span className={h.status === "No-show" ? "ap-pill amber" : h.status === "Cancelled" ? "ap-pill sent" : "ap-pill"}>{h.status}{h.hours !== null ? ` · ${fmtHours(h.hours)}` : ""}</span>
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
