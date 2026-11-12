import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import StartForm from "@/components/StartForm";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_HREF, FOUNDER } from "@/lib/contact";
import { TRIAL_DAYS } from "@/lib/pricing";

/** Sample sign-ups for the illustration at the top of the page. */
const SHEET = [
  { name: "Setup", time: "8:00 to 9:00 AM", people: ["Priya N.", "Marcus L."], open: 0 },
  { name: "Planting", time: "9:00 AM to 12:00 PM", people: ["Ana O.", "Ben W.", "Dee S.", "Fay L.", "Jun K.", "Sam R.", "Tess B."], open: 1 },
  { name: "Cleanup", time: "12:00 to 1:00 PM", people: ["Eli S.", "Noor A.", "Cy P."], open: 3 },
];

const initials = (n: string) => n.split(" ").map((w) => w[0]).join("");

export default function Home() {
  let chip = 0;

  return (
    <div className="ck-site">
      <SiteHeader />
      <main id="top">
        <section className="hm-hero" aria-labelledby="hero-title">
          <div className="hm-wrap hm-hero-grid">
            <div className="hm-hero-copy">
              <p className="hm-eyebrow">Volunteer sign-ups and scheduling for small nonprofits</p>
              <h1 id="hero-title">Organizing volunteers shouldn&apos;t be another full{"\u2011"}time job.</h1>
              <p className="hm-lede">Create an event and share one link. Volunteers pick a shift, get reminded, and check in at the door. You see who&apos;s coming, and their hours add up on their own.</p>
              <StartForm id="start-top" tone="dark" />
            </div>

            <div className="hm-stage" role="img" aria-label="Illustration with sample data: a sign-up sheet for a garden day filling with volunteer names.">
              <div className="hm-sheet" aria-hidden="true">
                <div className="hm-sheet-top">
                  <div>
                    <p className="hm-sheet-org">Maple Street Community Garden</p>
                    <p className="hm-sheet-title">Neighborhood garden day</p>
                    <p className="hm-sheet-date">Saturday, May 18</p>
                  </div>
                  <p className="hm-sheet-count"><strong>12</strong> of 16 spots filled</p>
                </div>
                {SHEET.map((s) => (
                  <div className="hm-shift" key={s.name}>
                    <p className="hm-shift-h"><strong>{s.name}</strong><span>{s.time}</span><em>{s.open === 0 ? "Full" : `${s.open} open`}</em></p>
                    <div className="hm-chips">
                      {s.people.map((n) => (
                        <span className="hm-chip" key={n} style={{ ["--i" as string]: chip++ }}><i>{initials(n)}</i>{n}</span>
                      ))}
                      {Array.from({ length: s.open }, (_, k) => <span className="hm-chip hm-chip-open" key={k}>Open spot</span>)}
                    </div>
                  </div>
                ))}
              </div>

              <p className="hm-sample">An example event with made-up names. Yours shows your own shifts and volunteers.</p>
            </div>
          </div>
        </section>

        <section className="hm-section hm-wrap" aria-labelledby="sides-title">
          <h2 className="hm-h2" id="sides-title">Organizers set it up. Volunteers just open a link.</h2>
          <div className="hm-sides">
            <div className="hm-side">
              <h3>If you organize volunteers</h3>
              <ul>
                <li>Create an event and its shifts in a couple of minutes.</li>
                <li>Share one link by text, email or flyer.</li>
                <li>See who&apos;s coming, check people in, and export their hours.</li>
              </ul>
              <p className="hm-side-foot">Free for {TRIAL_DAYS} days, then $19 a month.</p>
            </div>
            <div className="hm-side hm-side-vol">
              <div>
                <h3>If you volunteer</h3>
                <ul>
                  <li>Open the link your organizer sent. There&apos;s no app to download and no account to make.</li>
                  <li>Pick a shift and enter your name and email.</li>
                  <li>Get reminders, and cancel in one tap if your plans change.</li>
                </ul>
                <p className="hm-side-foot">Always free.</p>
              </div>
              <div className="hm-phone" role="img" aria-label="Illustration: the sign-up page on a volunteer's phone, with three shifts to choose from and a Sign me up button.">
                <div className="hm-phone-screen" aria-hidden="true">
                  <p className="hm-phone-org">Maple Street Community Garden</p>
                  <p className="hm-phone-title">Neighborhood garden day</p>
                  <p className="hm-phone-date">Saturday, May 18</p>
                  <div className="hm-opt hm-opt-full"><span className="hm-radio" /><span><strong>Setup</strong>8:00 AM</span><em>Full</em></div>
                  <div className="hm-opt hm-opt-on"><span className="hm-radio" /><span><strong>Planting</strong>9:00 AM</span><em>1 spot left</em></div>
                  <div className="hm-opt"><span className="hm-radio" /><span><strong>Cleanup</strong>12:00 PM</span><em>3 spots left</em></div>
                  <span className="hm-phone-btn">Sign me up</span>
                  <p className="hm-phone-fine">No account needed</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="hm-section hm-wrap" id="workflow" aria-labelledby="workflow-title">
          <h2 className="hm-h2" id="workflow-title">One Saturday, start to finish.</h2>
          <ol className="hm-days">
            <li>
              <p className="hm-when">Monday</p>
              <div className="hm-vig">
                <p className="hm-link"><span>civickettle.com/v/4f2a9c81</span><b>Copy link</b></p>
                <p className="hm-vig-note">Text it, email it, or print it on a flyer.</p>
              </div>
              <h3>Share one link</h3>
              <p>Volunteers pick a shift in under a minute. No account needed.</p>
            </li>
            <li>
              <p className="hm-when">Friday, 6 pm</p>
              <div className="hm-vig">
                <p className="hm-mail-from">Maple Street Community Garden</p>
                <p className="hm-mail-subject">Tomorrow: Neighborhood garden day, Planting</p>
                <p className="hm-vig-note">Can&apos;t make it? Cancel in one tap.</p>
              </div>
              <h3>Reminders send themselves</h3>
              <p>Everyone gets an email the day before and the morning of.</p>
            </li>
            <li>
              <p className="hm-when">Saturday, 8:45 am</p>
              <div className="hm-vig hm-roster">
                <p><span className="hm-tick" />Priya Nair<em>In at 8:52</em></p>
                <p><span className="hm-tick" />Marcus Lee<em>In at 8:58</em></p>
                <p><span className="hm-tick hm-tick-off" />Ana Ortiz<em>Not here yet</em></p>
              </div>
              <h3>Scan in at the door</h3>
              <p>Volunteers scan a code with their phone to check in and out.</p>
            </li>
            <li>
              <p className="hm-when">Saturday night</p>
              <div className="hm-vig hm-tiles">
                <p><strong>14</strong>showed up</p>
                <p><strong>41.5</strong>hours</p>
                <p><strong>2</strong>no-shows</p>
              </div>
              <h3>Hours add themselves up</h3>
              <p>See who came, approve their hours with one click, and export.</p>
            </li>
          </ol>
        </section>

        <section className="hm-section hm-wrap" id="about" aria-labelledby="about-title">
          <h2 className="hm-h2" id="about-title">Who&apos;s behind CivicKettle.</h2>
          <div className="hm-about">
            <div className="hm-about-note">
              <h3>The problem</h3>
              <p>Small nonprofits and community groups run on volunteers, but the tools for organizing them are usually a paper sign-in sheet, a group text and a spreadsheet. Things slip through. People forget their shift, nobody is sure who showed up, and hours never get written down. The software that fixes this is mostly built and priced for big organizations.</p>
              <h3>Why I started it</h3>
              <p>The people who organize volunteers are usually volunteers themselves. They shouldn&apos;t have to spend their evenings chasing sign-ups, sending reminders one at a time and adding up hours. I started CivicKettle so that part takes a few minutes, and so a small group with no budget and no tech person can start using it the day they find it.</p>
              <p className="hm-about-sign"><strong>{FOUNDER}</strong>creator of CivicKettle</p>
            </div>
            <div className="hm-about-reach">
              <h3>Reach a real person</h3>
              <p>If something goes wrong, or you just have a question, contact me directly.</p>
              <a className="hm-reach" href={`mailto:${CONTACT_EMAIL}`}><span>Email</span><strong>{CONTACT_EMAIL}</strong></a>
              <a className="hm-reach" href={CONTACT_PHONE_HREF}><span>Call or text</span><strong>{CONTACT_PHONE}</strong></a>
              <p className="hm-about-fine">I answer within a day or two.</p>
            </div>
          </div>

          <dl className="hm-faq" aria-label="Common questions">
            <div><dt>Is this a real product?</dt><dd>Yes. CivicKettle is new. It was started in 2026 and is run by one person, not a big company. You can try all of it free for {TRIAL_DAYS} days without entering a card.</dd></div>
            <div><dt>What does it cost?</dt><dd>Volunteers never pay. Organizations use it free for {TRIAL_DAYS} days, then it is $19 a month. Nothing is charged automatically.</dd></div>
            <div><dt>Will you ever ask volunteers for money or a password?</dt><dd>No. Volunteers sign up with a name and an email. There is no account to create and nothing to pay. If a message in our name asks a volunteer to pay or log in, it isn&apos;t from us.</dd></div>
            <div><dt>What happens to volunteers&apos; information?</dt><dd>It goes to the organization they signed up with. It is never sold, given to advertisers or used for ads, and it is deleted on request. The details are in the <a href="/privacy">Privacy Policy</a>.</dd></div>
            <div><dt>Will volunteers get spam?</dt><dd>No. They get a confirmation and reminders for shifts they chose, plus messages from their organizer about those events. Every email has a link to turn them off.</dd></div>
            <div><dt>Can I leave and take my records?</dt><dd>Yes. You can export your volunteers, events and hours as spreadsheet files at any time, and ask for your workspace to be deleted.</dd></div>
          </dl>
        </section>

        <section className="hm-wrap hm-last" id="plans" aria-labelledby="pricing-title">
          <div className="hm-ticket" id="contact">
            <div className="hm-ticket-stub">
              <p className="hm-price"><strong>$19</strong><span>a month</span></p>
              <p>After a {TRIAL_DAYS}-day free trial. One plan, everything included.</p>
            </div>
            <div className="hm-ticket-body">
              <h2 id="pricing-title">Try it free for {TRIAL_DAYS} days.</h2>
              <StartForm id="start-bottom" tone="light" />
            </div>
          </div>
          <p className="hm-questions">Questions? Write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or call <a href={CONTACT_PHONE_HREF}>{CONTACT_PHONE}</a>. Already use CivicKettle? <a href="/app">Sign in</a>. By starting you agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
