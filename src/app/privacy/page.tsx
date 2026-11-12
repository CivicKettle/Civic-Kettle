import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_HREF, LOCATION } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Privacy Policy | CivicKettle",
  description: "What CivicKettle collects about volunteers and coordinators, why, who sees it, and how to have it removed.",
};

export default function PrivacyPage() {
  return (
    <LegalPage kicker="Privacy" title="Privacy Policy" updated="November 11, 2026">
      <p className="ck-legal-lead">
        CivicKettle helps community organizations sign up volunteers, remind them, check them in, and count their hours. This page explains what information that takes and what happens to it.
      </p>

      <div className="ck-legal-short">
        <h2>The short version</h2>
        <ul>
          <li><strong>We collect what a sign-up sheet needs.</strong> A name, an email, the shift, and when someone checked in and out.</li>
          <li><strong>Only the organization you signed up with sees it.</strong> Other organizations can&apos;t.</li>
          <li><strong>We never sell it or use it for ads.</strong> There are no advertising trackers anywhere on CivicKettle.</li>
          <li><strong>Volunteers are never tracked.</strong> Sign-up and check-in pages have no analytics on them.</li>
          <li><strong>You can stop emails or have your information deleted.</strong> Every email has the link, and you can write to us at any time.</li>
        </ul>
      </div>

      <h2>What we collect, and why</h2>
      <div className="ck-legal-table" role="table" aria-label="What we collect, and why">
        <div role="row" className="h"><span role="columnheader">Who</span><span role="columnheader">What</span><span role="columnheader">Why</span></div>
        <div role="row"><span role="cell"><strong>Volunteers</strong></span><span role="cell">Name and email. A mobile number if you choose to give one.</span><span role="cell">To hold your spot and send your confirmation and reminders.</span></div>
        <div role="row"><span role="cell" /><span role="cell">The shifts you signed up for, whether you cancelled, and whether you confirmed you were coming.</span><span role="cell">So the organization knows who to expect.</span></div>
        <div role="row"><span role="cell" /><span role="cell">The times you checked in and out, and the hours that result.</span><span role="cell">So the organization can record and report volunteer hours.</span></div>
        <div role="row"><span role="cell"><strong>Volunteers under 18</strong></span><span role="cell">That the volunteer is under 18 (no birthdate), plus a parent or guardian&apos;s name, email and consent.</span><span role="cell">So an adult makes the sign-up and receives the emails.</span></div>
        <div role="row"><span role="cell"><strong>Coordinators</strong></span><span role="cell">Email and password. The password is stored in scrambled form, so nobody at CivicKettle can read it.</span><span role="cell">To sign you in.</span></div>
        <div role="row"><span role="cell" /><span role="cell">Your organization&apos;s name, time zone and contact email, and the events, shifts, notes and messages you create.</span><span role="cell">To run your workspace.</span></div>
        <div role="row"><span role="cell"><strong>Everyone</strong></span><span role="cell">Short-lived technical logs kept by our hosting provider: IP address, browser type, pages requested.</span><span role="cell">To keep the service working and secure.</span></div>
      </div>
      <p>We don&apos;t collect home addresses, payment details, birthdates or precise location.</p>

      <h2>Who can see it</h2>
      <ul>
        <li><strong>The organization you signed up with.</strong> Its coordinators see your sign-up, contact details, attendance and hours. When you sign up, that organization decides how it uses the information, and its email address is at the bottom of every sign-up page and every email.</li>
        <li><strong>The companies that run our systems</strong>, only so they can provide them: Supabase (database and sign-in), Vercel (website hosting), Resend (email delivery) and PostHog (visit counts, described below). They may process information in the United States and other countries where they operate.</li>
        <li><strong>Authorities</strong>, if the law requires it.</li>
      </ul>
      <p>We don&apos;t sell or rent personal information, we don&apos;t show ads, and we don&apos;t use volunteer contact details to promote anything.</p>

      <h2>Cookies and visit counts</h2>
      <ul>
        <li><strong>Coordinator sign-in cookie.</strong> Keeps a coordinator signed in.</li>
        <li><strong>Volunteer device memory.</strong> When you sign up, your phone or computer remembers that sign-up for up to a year, so scanning the QR code at an event can check you in with one tap. It holds a private code for each sign-up, not your name or contact details.</li>
        <li><strong>Visit counts.</strong> On our own website and inside the coordinator workspace, we use PostHog to count page visits so we can see which pages are used. It sets no cookies, does not record clicks, typing or screens, and is not used for advertising. It is switched off on every volunteer page.</li>
      </ul>

      <h2>Emails, and how to stop them</h2>
      <p>
        Every email sent for an organization has a link at the bottom to stop reminders and messages from that organization. It applies straight away, and you can turn emails back on from the same link.
        You&apos;ll still get a confirmation when you sign up or cancel, because that message is the record of what you did.
      </p>

      <h2>Volunteers under 18</h2>
      <p>
        A parent or guardian signs up a volunteer under 18 and gives their own email address, so confirmations and reminders go to the adult. We don&apos;t knowingly collect contact details directly from a child under 13.
        If you believe a child signed up without a guardian, write to the organization or to us and the sign-up will be removed.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Sign-ups, attendance and hours are kept for as long as the organization uses CivicKettle, because organizations often report volunteer hours for past years.
        Information is deleted when the organization asks, when you ask, or when an organization closes its workspace. Copies in our providers&apos; backups clear on their normal schedule.
      </p>

      <h2>Your choices</h2>
      <p>
        You can ask to see the information held about you, have it corrected, or have it deleted. Ask the organization you volunteered with, or write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the email address you signed up with.
        We aim to answer within 30 days. Deleting your information also removes your recorded hours with that organization.
      </p>

      <h2>Security</h2>
      <p>
        Information travels over an encrypted connection, passwords are stored in scrambled form, and the database enforces that each organization&apos;s coordinators can reach only their own records. No system is perfectly secure.
        If we learn of a breach affecting your information, we&apos;ll tell the affected organizations and people as the law requires.
      </p>

      <h2>Changes to this policy</h2>
      <p>If this policy changes in a way that matters, we&apos;ll update the date at the top and tell coordinators by email before the change takes effect.</p>

      <h2>Contact</h2>
      <p>CivicKettle is based in {LOCATION}.<br />Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><br />Call or text <a href={CONTACT_PHONE_HREF}>{CONTACT_PHONE}</a></p>
    </LegalPage>
  );
}
