import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getOrg, getRole, getSession } from "@/lib/db";
import { trialFor, trialLine } from "@/lib/plan";
import { loadInvites, loadTeam } from "@/lib/team";
import { fmtDate, TIME_ZONES } from "@/lib/time";

export const metadata: Metadata = { title: "Settings | CivicKettle" };
export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; teamError?: string; invited?: string; noEmail?: string; cancelled?: string; removed?: string; pw?: string; pwError?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/app");
  const org = await getOrg(session);
  if (!org || !session.hasPassword) redirect("/app/setup");
  const q = await searchParams;
  const { error } = q;
  const [role, team, invites] = await Promise.all([getRole(session, org.id), loadTeam(session, org), loadInvites(session, org)]);
  const owner = role === "owner";
  const trial = await trialFor(session, org);

  return (
    <AppShell active="settings" orgName={org.name} email={session.email}>
      <div className="ap-top">
        <div>
          <p className="ck-kicker">{org.name}</p>
          <h1 className="ap-h1">Settings</h1>
        </div>
      </div>
      <form action="/app/api/org" method="post" className="ap-card ap-form ap-narrow">
        <input type="hidden" name="intent" value="update" />
        <label htmlFor="name">Organization name</label>
        <input id="name" name="name" type="text" required maxLength={80} defaultValue={org.name} />
        <label htmlFor="contact_email">Contact email <span>Shown to volunteers</span></label>
        <input id="contact_email" name="contact_email" type="email" defaultValue={org.contact_email ?? ""} />
        <label htmlFor="tz">Time zone</label>
        <select id="tz" name="time_zone" defaultValue={org.time_zone}>
          {TIME_ZONES.map((tz) => <option key={tz} value={tz}>{tz.replace("_", " ")}</option>)}
        </select>
        {error && <p className="ap-error">{decodeURIComponent(error)}</p>}
        <button className="ck-button" type="submit">Save <span aria-hidden="true">↗</span></button>
      </form>

      {trial && (
        <section className="ap-card ap-narrow">
          <div className="ap-card-h"><h2>Plan</h2><span className="ap-muted">{trial.state === "active" ? "Free trial" : "Trial ended"}</span></div>
          <div className="ap-card-b"><p className="ap-plan">{trialLine(trial)}</p></div>
        </section>
      )}

      <section className="ap-card ap-narrow" id="team">
        <div className="ap-card-h"><h2>Team</h2><span className="ap-muted">{team.length} {team.length === 1 ? "coordinator" : "coordinators"}</span></div>
        {q.invited && (
          <p className="ap-flash ap-flash-in">
            {q.noEmail
              ? `${q.invited} is invited, but the invitation email didn't send. Tell them to sign in at civickettle.com/app with that address.`
              : `Invitation sent to ${q.invited}. They join the first time they sign in with that address.`}
          </p>
        )}
        {q.cancelled && <p className="ap-flash ap-flash-in">Invitation cancelled.</p>}
        {q.removed && <p className="ap-flash ap-flash-in">Removed. That person can no longer open this workspace.</p>}
        {q.teamError && <p className="ap-error ap-error-top ap-flash-in">{decodeURIComponent(q.teamError)}</p>}
        {team.map((m) => (
          <div className="ap-row" key={m.userId}>
            <div>
              <strong>{m.email}</strong>{m.you && <span className="ap-pill">You</span>}
              <div className="m">{m.role === "owner" ? "Owner · set up this workspace" : `Coordinator · joined ${fmtDate(m.joinedAt, org.time_zone, { year: "numeric" })}`}</div>
            </div>
            {owner && !m.you && m.role !== "owner" && (
              <form action="/app/api/team" method="post">
                <input type="hidden" name="intent" value="remove" />
                <input type="hidden" name="user_id" value={m.userId} />
                <button className="ap-link" type="submit">Remove</button>
              </form>
            )}
          </div>
        ))}
        {invites.map((i) => (
          <div className="ap-row" key={i.id}>
            <div>
              <strong>{i.email}</strong><span className="ap-pill sent">Invited</span>
              <div className="m">Joins the first time they sign in with this address</div>
            </div>
            {owner && (
              <form action="/app/api/team" method="post">
                <input type="hidden" name="intent" value="cancel" />
                <input type="hidden" name="id" value={i.id} />
                <button className="ap-link" type="submit">Cancel invitation</button>
              </form>
            )}
          </div>
        ))}
        {owner ? (
          <form action="/app/api/team" method="post" className="ap-card-b ap-form">
            <input type="hidden" name="intent" value="invite" />
            <label htmlFor="invite-email">Add a coordinator <span>They get an email with how to sign in</span></label>
            <input id="invite-email" name="email" type="email" required maxLength={200} placeholder="name@yourorganization.org" />
            <button className="ap-ghost sm" type="submit">Send invitation</button>
            <p className="ap-muted">Coordinators can do everything you can except change the team: create events, see volunteers, check people in, approve hours and send messages.</p>
          </form>
        ) : (
          <div className="ap-card-b"><p className="ap-muted">Only the workspace owner can add or remove coordinators.</p></div>
        )}
      </section>
      <section className="ap-card ap-narrow" id="password">
        <div className="ap-card-h"><h2>Change password</h2></div>
        {q.pw && <p className="ap-flash ap-flash-in">Password changed.</p>}
        {q.pwError && <p className="ap-error ap-error-top ap-flash-in">{decodeURIComponent(q.pwError)}</p>}
        <form action="/app/api/password" method="post" className="ap-card-b ap-form">
          <p className="ap-muted">You sign in as {session.email}. Your password is yours alone; other coordinators have their own.</p>
          <label htmlFor="pw-new">New password <span>At least 8 characters</span></label>
          <input id="pw-new" name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />
          <label htmlFor="pw-again">Type it again</label>
          <input id="pw-again" name="password_again" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />
          <button className="ap-ghost sm" type="submit">Save password</button>
          <p className="ap-muted">Forgot it later? Sign in with the emailed link and set a new one here.</p>
        </form>
      </section>

      <p className="ap-muted"><a className="ap-link" href="/app/inquiries">Inquiries from the website form ›</a></p>
    </AppShell>
  );
}
