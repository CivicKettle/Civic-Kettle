import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getOrg, getSession } from "@/lib/db";
import { approvedLines, fmtLetterHours, LETTER_COLUMNS, prettyCode, type Letter } from "@/lib/letters";
import { fmtDate } from "@/lib/time";

export const metadata: Metadata = { title: "Hours letters | CivicKettle" };
export const dynamic = "force-dynamic";

export default async function LettersPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/app");
  const org = await getOrg(session);
  if (!org || !session.hasPassword) redirect("/app/setup");
  const q = await searchParams;
  const tz = org.time_zone;

  const { data, error } = await session.supabase.from("hours_letters").select(LETTER_COLUMNS).eq("org_id", org.id).order("requested_at", { ascending: false }).limit(300);
  const letters = (data ?? []) as Letter[];
  const waiting = letters.filter((l) => l.status === "requested");
  const issued = letters.filter((l) => l.status === "approved" || l.status === "cancelled");
  const now = await Promise.all(waiting.map((l) => approvedLines(session.supabase, org.id, l.volunteer_name, l.volunteer_email)));
  const signerReady = Boolean((org.signer_name || "").trim());

  return (
    <AppShell active="hours" orgName={org.name} email={session.email}>
      <div className="ap-top">
        <div>
          <p className="ck-kicker"><a href="/app/hours">← Hours</a></p>
          <h1 className="ap-h1">Hours letters</h1>
        </div>
      </div>

      {q.ok && <p className="ap-flash" role="status">{decodeURIComponent(q.ok)}</p>}
      {q.error && <p className="ap-error ap-error-top">{decodeURIComponent(q.error)}</p>}

      {error ? (
        <section className="ap-card"><div className="ap-empty"><p>Hours letters need database step 12 to be run in Supabase. Nothing else on the site is affected.</p></div></section>
      ) : (
        <>
          <p className="ap-muted ap-lede">
            A volunteer asks for a letter from their My shifts page. Nothing goes out until you approve it here. Each letter lists their approved hours, names who approved it,
            and carries a code that a school or employer can check at civickettle.com/verify.
          </p>
          {!signerReady && (
            <p className="ap-hint">Before you can approve a letter, add the name and title that approve letters, plus your address and phone for the letterhead. <a href="/app/settings#letterhead">Open Settings</a>.</p>
          )}

          <section className="ap-card">
            <div className="ap-card-h"><h2>Waiting for you</h2><span className="ap-muted">{waiting.length}</span></div>
            {waiting.length === 0 && <div className="ap-empty"><p>No requests right now.</p></div>}
            {waiting.map((l, i) => (
              <div className="ap-hrow" key={l.id}>
                <div className="who">
                  <strong>{l.volunteer_name}</strong>
                  <div className="m">{l.volunteer_email} · asked {fmtDate(l.requested_at, tz, { year: "numeric" })} · {now[i].lines.length} approved {now[i].lines.length === 1 ? "shift" : "shifts"}</div>
                </div>
                <div className="hrs">{fmtLetterHours(now[i].total)}</div>
                <div className="acts">
                  <form action="/app/api/letters" method="post">
                    <input type="hidden" name="id" value={l.id} /><input type="hidden" name="intent" value="approve" />
                    <button type="submit" className="ck-button sm" disabled={!signerReady || now[i].total <= 0}>Approve and send</button>
                  </form>
                  <form action="/app/api/letters" method="post">
                    <input type="hidden" name="id" value={l.id} /><input type="hidden" name="intent" value="decline" />
                    <button type="submit" className="ap-link">Decline</button>
                  </form>
                </div>
              </div>
            ))}
          </section>

          <section className="ap-card">
            <div className="ap-card-h"><h2>Issued</h2><span className="ap-muted">{issued.length}</span></div>
            {issued.length === 0 ? (
              <div className="ap-empty"><p>Letters you approve are listed here, with a way to cancel one.</p></div>
            ) : (
              <div className="ap-table-wrap">
                <table className="ap-table">
                  <thead><tr><th>Volunteer</th><th>Approved</th><th className="n">Hours</th><th>Code</th><th /></tr></thead>
                  <tbody>
                    {issued.map((l) => (
                      <tr key={l.id}>
                        <td><strong>{l.volunteer_name}</strong><div className="m">{l.volunteer_email}</div></td>
                        <td>{l.decided_at ? fmtDate(l.decided_at, tz, { year: "numeric" }) : ""}{l.status === "cancelled" && <span className="ap-pill amber">Cancelled</span>}</td>
                        <td className="n">{Number(l.total_hours ?? 0)}</td>
                        <td>{l.status === "approved" ? <a href={`/verify/${l.code}`} target="_blank" rel="noopener noreferrer">{prettyCode(l.code || "")}</a> : prettyCode(l.code || "")}</td>
                        <td className="n">
                          {l.status === "approved" && (
                            <form action="/app/api/letters" method="post">
                              <input type="hidden" name="id" value={l.id} /><input type="hidden" name="intent" value="cancel" />
                              <button type="submit" className="ap-link">Cancel letter</button>
                            </form>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
