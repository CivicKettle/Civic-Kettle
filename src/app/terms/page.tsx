import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { TRIAL_DAYS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Terms of Use — CivicKettle",
  description: "The terms for organizations and volunteers using CivicKettle.",
};

const CONTACT = "civickettle@gmail.com";

export default function TermsPage() {
  return (
    <LegalPage kicker="Terms" title="Terms of Use" updated="November 11, 2026">
      <p className="ck-legal-lead">
        These terms cover the CivicKettle website and the volunteer sign-up, reminder, check-in and hours tools that run on it. By using CivicKettle, as a coordinator or as a volunteer, you agree to them. If you don&apos;t agree, please don&apos;t use it.
      </p>

      <h2>What CivicKettle is</h2>
      <p>
        CivicKettle is software that organizations use to manage their own volunteers. We provide the tool. The organization runs its events, chooses its volunteers and is responsible for them.
        We aren&apos;t a party to the arrangement between an organization and a volunteer, and we don&apos;t supervise, screen or vouch for either.
      </p>

      <h2>An early product</h2>
      <p>
        CivicKettle is new and still changing. Features may be added, changed or removed, and there may be interruptions. We&apos;ll try to give notice of changes that affect how you work.
      </p>

      <h2>Cost</h2>
      <p>
        Volunteers never pay to use CivicKettle. A new organization can use CivicKettle free for {TRIAL_DAYS} days. After that it costs $19 a month.
        Nothing is charged automatically: we don&apos;t ask for a card to start, and an organization is not charged unless it has agreed to continue.
      </p>

      <h2>If you coordinate volunteers</h2>
      <ul>
        <li>Give accurate information about your organization, and keep your sign-in email secure. You&apos;re responsible for what happens in your workspace.</li>
        <li>Use volunteers&apos; contact details only for your volunteer work. Messages you send through CivicKettle should be about your events and shifts, not advertising or fundraising appeals unrelated to them.</li>
        <li>Respect a volunteer&apos;s choice to stop emails. CivicKettle handles this for messages sent through it.</li>
        <li>For volunteers under 18, make sure a parent or guardian has agreed, and follow the child-safety rules and other laws that apply to your organization. CivicKettle records a guardian&apos;s consent to the sign-up; it does not replace your own policies or waivers.</li>
        <li>Hours in CivicKettle come from check-in and check-out times and from corrections you make. You&apos;re responsible for confirming them before relying on them for reports, school credit, court-ordered service or anything similar.</li>
      </ul>

      <h2>If you volunteer</h2>
      <ul>
        <li>Give your real name and a working email address.</li>
        <li>Sign up only yourself, or a child you are the parent or guardian of. If you are under 18, a parent or guardian must sign you up.</li>
        <li>If you can&apos;t make a shift, cancel with the link in your confirmation so someone else can take the spot.</li>
      </ul>

      <h2>What isn&apos;t allowed</h2>
      <ul>
        <li>Sending spam, or messages that are unlawful, harassing or deceptive.</li>
        <li>Signing people up without their knowledge, or collecting information about volunteers for another purpose.</li>
        <li>Trying to reach another organization&apos;s information, probing or disrupting the service, or using it to break the law.</li>
      </ul>
      <p>We may suspend a workspace or remove content that breaks these rules.</p>

      <h2>Your information</h2>
      <p>
        What you put into CivicKettle stays yours. You give us permission to store and process it only as needed to run the service for you. How personal information is handled is described in the <a href="/privacy">Privacy Policy</a>.
        Coordinators can export volunteer lists, event summaries and hours as spreadsheet files at any time.
      </p>

      <h2>Stopping</h2>
      <p>
        You can stop using CivicKettle whenever you like. An organization can ask us to close its workspace and delete its records by writing to <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. We may end or suspend access for a breach of these terms, and will give notice where we reasonably can.
      </p>

      <h2>No warranty</h2>
      <p>
        CivicKettle is provided as it is and as available. To the extent the law allows, we make no warranties about it, including that it will be uninterrupted, error-free, or fit for a particular purpose. Reminders can be delayed or filtered by email providers, so don&apos;t rely on CivicKettle as the only way to reach someone when safety is involved.
      </p>

      <h2>Limit of liability</h2>
      <p>
        To the extent the law allows, CivicKettle is not liable for indirect, incidental or consequential losses, or for anything that happens at or because of an organization&apos;s event.
        Our total liability for any claim about the service is limited to the amount you paid us in the twelve months before the claim, or 100 US dollars if that is greater.
        Nothing here limits liability that the law does not allow to be limited.
      </p>

      <h2>Changes to these terms</h2>
      <p>If these terms change in a way that matters, we&apos;ll update the date at the top and tell coordinators by email before the change takes effect. Using CivicKettle after that means you accept the new terms.</p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of the State of California, USA.</p>

      <h2>Contact</h2>
      <p>CivicKettle is run by Desmond Flores.<br />Email <a href={`mailto:${CONTACT}`}>{CONTACT}</a><br />Call or text <a href="tel:+19492593625">(949) 259-3625</a></p>
    </LegalPage>
  );
}
