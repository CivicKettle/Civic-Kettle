import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — CivicKettle",
  description: "What CivicKettle collects about volunteers and coordinators, why, who sees it, and how to have it removed.",
};

const CONTACT = "civickettle@gmail.com";

export default function PrivacyPage() {
  return (
    <LegalPage kicker="Privacy" title="Privacy Policy" updated="November 11, 2026">
      <p className="ck-legal-lead">
        CivicKettle is a tool that community organizations use to sign up volunteers, remind them, check them in, and count their hours.
        This page says what information that involves, in plain language. The short version: we collect what a sign-up sheet needs, we show it to the organization you signed up with, and we don&apos;t sell it or use it for advertising.
      </p>

      <h2>Who is responsible for your information</h2>
      <p>
        When you sign up to volunteer, the organization running the event decides what to ask for and how to use it. CivicKettle stores and processes that information on the organization&apos;s behalf.
        For questions about a particular sign-up, the organization is the best first contact; its email address is at the bottom of every sign-up page and every email. For questions about CivicKettle itself, write to <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>

      <h2>What we collect</h2>
      <h3>If you volunteer</h3>
      <ul>
        <li>Your name and email address, and a mobile number if you choose to give one.</li>
        <li>Whether you are under 18. We don&apos;t ask for a birthdate.</li>
        <li>For a volunteer under 18: a parent or guardian&apos;s name and email address, an optional mobile number, and the guardian&apos;s consent to the sign-up.</li>
        <li>The events and shifts you signed up for, and whether a sign-up was cancelled.</li>
        <li>The times you checked in and out, and the hours that result. A coordinator can correct those hours.</li>
        <li>Whether you&apos;ve asked an organization to stop emailing you.</li>
      </ul>
      <h3>If you coordinate volunteers</h3>
      <ul>
        <li>Your email address, which is how you sign in.</li>
        <li>Your organization&apos;s name, time zone and contact email.</li>
        <li>The events, shifts, notes and messages you create.</li>
      </ul>
      <h3>If you ask about using CivicKettle</h3>
      <ul>
        <li>Your name, email address, organization, and the answers you give on the request form.</li>
      </ul>
      <h3>Collected automatically</h3>
      <ul>
        <li>Like any website, our hosting provider keeps short-lived technical logs: IP address, browser type, and the pages requested.</li>
        <li>Two cookies, described below.</li>
      </ul>
      <p>We don&apos;t collect home addresses, payment details, or precise location, and we don&apos;t use advertising or analytics trackers.</p>

      <h2>What we use it for</h2>
      <ul>
        <li>Holding your spot on a shift and showing the organization who is coming.</li>
        <li>Sending a confirmation, a reminder the day before and the morning of, and messages the organization sends about its events.</li>
        <li>Recording check-ins and hours so the organization can report them.</li>
        <li>Keeping the service working and secure, and answering you when you write to us.</li>
      </ul>
      <p>We don&apos;t sell or rent personal information, we don&apos;t show ads, and we don&apos;t use volunteer contact details to promote anything.</p>

      <h2>Who can see it</h2>
      <ul>
        <li><strong>The organization you signed up with.</strong> Its coordinators see your sign-up, contact details, attendance and hours. Other organizations using CivicKettle can&apos;t.</li>
        <li><strong>The companies that run our infrastructure</strong>, only so they can provide it: Supabase (database and coordinator sign-in), Vercel (website hosting) and Resend (email delivery). They may process information in the United States and in other countries where they operate.</li>
        <li><strong>Authorities</strong>, if the law requires it.</li>
      </ul>

      <h2>Cookies</h2>
      <ul>
        <li><strong>Coordinator sign-in.</strong> Keeps a coordinator signed in.</li>
        <li><strong>Volunteer device memory.</strong> When you sign up, your phone or computer remembers that sign-up for up to a year, so that scanning the QR code at an event can check you in with one tap. It holds a private code for each sign-up, not your name or contact details.</li>
      </ul>
      <p>There are no advertising or tracking cookies.</p>

      <h2>Emails, and how to stop them</h2>
      <p>
        Every email we send for an organization has a link at the bottom to stop reminder emails and messages from that organization. It takes a moment and applies straight away.
        You&apos;ll still get a confirmation when you sign up for something or cancel, because that message is the record of what you did. You can turn emails back on from the same link.
      </p>

      <h2>Volunteers under 18</h2>
      <p>
        A parent or guardian signs up a volunteer under 18 and gives their own email address, so confirmations and reminders go to the adult. We don&apos;t knowingly collect contact details directly from a child under 13.
        If you believe a child has signed up without a guardian, write to the organization or to us and the sign-up will be removed.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Sign-ups, attendance and hours are kept for as long as the organization uses CivicKettle, since organizations often need to report volunteer hours for past years.
        Information is deleted when the organization asks, when you ask (see below), or when an organization closes its workspace. Copies held in our providers&apos; backups clear on their normal schedule.
      </p>

      <h2>Your choices</h2>
      <p>
        You can ask to see the information held about you, have it corrected, or have it deleted. Ask the organization you volunteered with, or write to <a href={`mailto:${CONTACT}`}>{CONTACT}</a> from the email address you signed up with.
        We aim to answer within 30 days. Deleting your information also removes your recorded hours with that organization.
      </p>

      <h2>Security</h2>
      <p>
        Information travels over an encrypted connection, and the database enforces that each organization&apos;s coordinators can reach only their own organization&apos;s records. No system is perfectly secure.
        If we learn of a breach affecting your information, we&apos;ll tell the affected organizations and people as the law requires.
      </p>

      <h2>Changes to this policy</h2>
      <p>If this policy changes in a way that matters, we&apos;ll update the date at the top and tell coordinators by email before the change takes effect.</p>

      <h2>Contact</h2>
      <p>CivicKettle is run by Desmond Flores, based in Orange County, California.<br />Email <a href={`mailto:${CONTACT}`}>{CONTACT}</a><br />Call or text <a href="tel:+19492593625">(949) 259-3625</a></p>
    </LegalPage>
  );
}
