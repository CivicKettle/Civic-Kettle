import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getOrg, getSession } from "@/lib/db";
import { trialFor } from "@/lib/plan";
import { PRICE } from "@/lib/pricing";

export const metadata: Metadata = { title: "Cancel subscription | CivicKettle" };
export const dynamic = "force-dynamic";

/**
 * Where a subscription is cancelled. Payments aren't built yet, so today this
 * page tells people plainly that there is nothing to cancel and no card on
 * file. When billing exists, the cancel button goes here.
 */
export default async function CancelPage() {
  const session = await getSession();
  if (!session) redirect("/app");
  const org = await getOrg(session);
  if (!org || !session.hasPassword) redirect("/app/setup");
  const trial = await trialFor(session, org);

  return (
    <AppShell active="settings" orgName={org.name} email={session.email}>
      <div className="ap-top">
        <div>
          <p className="ck-kicker"><a href="/app/settings">Settings</a> › Plan</p>
          <h1 className="ap-h1">Cancel subscription</h1>
        </div>
      </div>
      <section className="ap-card ap-narrow">
        <div className="ap-card-h"><h2>There is nothing to cancel</h2></div>
        <div className="ap-card-b ap-cancel">
          {trial ? (
            <>
              <p>
                {trial.state === "active"
                  ? `${org.name} is on the free trial, with ${trial.daysLeft} day${trial.daysLeft === 1 ? "" : "s"} left.`
                  : `The free trial for ${org.name} ended on ${trial.endsOn}.`}{" "}
                You have not given us a card, so you are not being charged and you cannot be charged.
              </p>
              <p>CivicKettle is {PRICE} after the trial, and only if you choose to pay. Once you are paying, this is the page where you cancel, with one button. No phone call and no email.</p>
            </>
          ) : (
            <p>This is CivicKettle&apos;s own workspace, so it has no subscription.</p>
          )}
          <p>Your volunteers, events and hours stay yours. You can export them as spreadsheet files from the Volunteers and Hours pages at any time.</p>
          <a className="ck-button" href="/app/settings">Back to Settings <span aria-hidden="true">↗</span></a>
        </div>
      </section>
    </AppShell>
  );
}
