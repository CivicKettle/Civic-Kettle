import type { Metadata } from "next";
import { KettleMark } from "@/components/AppShell";
import { cleanCode, fmtLetterHours, LETTER_COLUMNS, prettyCode, type Letter } from "@/lib/letters";
import { createAdminClient } from "@/lib/supabase/admin";
import { fmtDate } from "@/lib/time";

export const metadata: Metadata = { title: "Check an hours letter | CivicKettle", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Public: anyone holding an hours letter can confirm it here. Shows only what the letter itself says. */
export default async function VerifyLetterPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = cleanCode(decodeURIComponent(raw));
  const admin = createAdminClient();
  let letter: Letter | null = null;
  let org: { name: string; time_zone: string; contact_email: string | null } | null = null;
  if (code && admin) {
    const { data } = await admin.from("hours_letters").select(LETTER_COLUMNS).eq("code", code).in("status", ["approved", "cancelled"]).maybeSingle();
    letter = (data as Letter | null) ?? null;
    if (letter) {
      const { data: o } = await admin.from("organizations").select("name,time_zone,contact_email").eq("id", letter.org_id).maybeSingle();
      org = o ?? null;
    }
  }
  const tz = org?.time_zone || "America/Los_Angeles";
  const when = (iso: string | null) => (iso ? fmtDate(iso, tz, { year: "numeric" }) : "");

  return (
    <div className="pv">
      <header className="pv-head">
        <span className="pv-brand"><KettleMark />CivicKettle</span>
        <span className="pv-org">Hours letter check</span>
      </header>
      <main className="pv-body">
        {!letter || !org ? (
          <>
            <div className="pv-hero"><p className="pv-kicker">Hours letter check</p><h1 className="pv-h1">No letter matches that code</h1></div>
            <div className="pv-card pv-fields">
              <p className="pv-muted">Check the code printed at the bottom of the letter and try again. It is twelve letters and numbers, like 7KQ2-M9XA-4TRP. If the code is typed correctly and still fails, treat the letter as unconfirmed.</p>
              <form action="/verify" method="get" className="pv-fields">
                <label>Letter code<input name="code" required maxLength={20} autoCapitalize="characters" autoComplete="off" placeholder="XXXX-XXXX-XXXX" /></label>
                <button className="pv-button" type="submit">Check this code</button>
              </form>
            </div>
          </>
        ) : letter.status === "cancelled" ? (
          <>
            <div className="pv-hero"><p className="pv-kicker">Hours letter check</p><h1 className="pv-h1">This letter is no longer valid</h1></div>
            <div className="pv-card pv-fields">
              <p className="pv-error" role="alert">{org.name} cancelled letter {prettyCode(letter.code || "")} on {when(letter.decided_at)}. Do not rely on it.</p>
              {org.contact_email && <p className="pv-muted">Questions go to <a href={`mailto:${org.contact_email}`}>{org.contact_email}</a>.</p>}
            </div>
          </>
        ) : (
          <>
            <div className="pv-hero">
              <p className="pv-kicker">Hours letter check</p>
              <h1 className="pv-h1">This letter is real</h1>
              <p className="pv-meta">Letter code {prettyCode(letter.code || "")}</p>
            </div>
            <div className="pv-card pv-fields">
              <dl className="pv-facts">
                <div><dt>Volunteer</dt><dd>{letter.volunteer_name}</dd></div>
                <div><dt>Organization</dt><dd>{org.name}</dd></div>
                <div><dt>Hours</dt><dd>{fmtLetterHours(Number(letter.total_hours ?? 0))}</dd></div>
                <div><dt>Dates</dt><dd>{when(letter.first_date) === when(letter.last_date) ? when(letter.first_date) : `${when(letter.first_date)} to ${when(letter.last_date)}`}</dd></div>
                <div><dt>Approved by</dt><dd>{letter.signer_name}{letter.signer_title ? `, ${letter.signer_title}` : ""}, on {when(letter.decided_at)}</dd></div>
              </dl>
              <p className="pv-muted">If the paper or PDF you were given says anything different from this page, go by this page.</p>
            </div>
            <div className="pv-card">
              <table className="pv-table">
                <thead><tr><th>Date</th><th>Event</th><th className="n">Hours</th></tr></thead>
                <tbody>
                  {letter.lines.map((l, i) => (
                    <tr key={i}><td>{when(l.date)}</td><td>{l.title}<span className="s">{l.shift}</span></td><td className="n">{l.hours}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <a className="pv-button" href={`/verify/${letter.code}/pdf`}>Download the letter (PDF)</a>
          </>
        )}
      </main>
      <footer className="pv-foot">
        {org?.contact_email && <span>Questions? <a href={`mailto:${org.contact_email}`}>{org.contact_email}</a></span>}
        <span>Hours recorded by <a href="/">CivicKettle</a></span>
      </footer>
    </div>
  );
}
