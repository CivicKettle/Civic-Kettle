import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import StartForm from "@/components/StartForm";
import QRCode from "qrcode";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_HREF, LOCATION } from "@/lib/contact";
import { TRIAL_DAYS } from "@/lib/pricing";

/** Sample sign-ups for the illustration at the top of the page. */
const SHEET = [
  { name: "Setup", time: "8:00 to 9:00 AM", people: ["Priya N.", "Marcus L."], open: 0 },
  { name: "Planting", time: "9:00 AM to 12:00 PM", people: ["Ana O.", "Ben W.", "Dee S.", "Fay L.", "Jun K.", "Sam R.", "Tess B."], open: 1 },
  { name: "Cleanup", time: "12:00 to 1:00 PM", people: ["Eli S.", "Noor A.", "Cy P."], open: 3 },
];

const initials = (n: string) => n.split(" ").map((w) => w[0]).join("");

/** Sample events for the coordinator's overview illustration. */
const DASH = [
  { title: "Neighborhood garden day", date: "Sat, May 18", filled: 12, of: 16 },
  { title: "Food pantry sort", date: "Wed, May 22", filled: 6, of: 6 },
  { title: "Creek cleanup", date: "Sat, Jun 1", filled: 9, of: 20 },
];

export default async function Home() {
  let chip = 0;
  // A real, scannable code for the illustration. It opens this site.
  const qr = await QRCode.toString("https://civickettle.com", { type: "svg", margin: 0, color: { dark: "#2b3c30", light: "#0000" } });

  return (
    <div className="ck-site">
      <SiteHeader />
      <main id="top">
        <section className="hm-hero" aria-labelledby="hero-title">
          <div className="hm-wrap hm-hero-grid">
            <div className="hm-hero-copy">
              <h1 id="hero-title">Organizing volunteers shouldn&apos;t be another full{"\u2011"}time job.</h1>
              <p className="hm-lede">Volunteer sign-ups, reminders, check-in and hours for local Orange County nonprofits, all from one link.</p>
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
          <h2 className="hm-h2" id="sides-title">Know who&apos;s coming. Know who showed up.</h2>
          <div className="hm-sides">
            <div className="hm-side hm-side-org">
              <div className="hm-side-copy">
                <h3>For volunteer coordinators</h3>
                <ul className="hm-verbs">
                  <li><strong>Create</strong>events and shifts in minutes</li>
                  <li><strong>Communicate</strong>with one link, automatic reminders and group messages</li>
                  <li><strong>Track</strong>who confirmed, who showed up on time, and every hour</li>
                </ul>
                <p className="hm-side-foot">{TRIAL_DAYS} day free trial, then $19 a month.</p>
              </div>
              <div className="hm-dash" role="img" aria-label="Illustration with sample data: a coordinator's overview with volunteers signed up, confirmed, on time, hours this month, and three upcoming events.">
                <div aria-hidden="true">
                  <p className="hm-dash-top"><span>Maple Street Community Garden</span><em>Sample</em></p>
                  <p className="hm-dash-title">Your week at a glance</p>
                  <div className="hm-dash-tiles">
                    <p><strong>28</strong>signed up</p>
                    <p><strong>24</strong>confirmed</p>
                    <p><strong>92%</strong>on time</p>
                    <p><strong>41.5</strong>hours this month</p>
                  </div>
                  {DASH.map((e) => (
                    <div className="hm-dash-row" key={e.title}>
                      <p><strong>{e.title}</strong>{e.date}</p>
                      <span className="hm-dash-bar"><i style={{ width: `${Math.round((e.filled / e.of) * 100)}%` }} /></span>
                      <em>{e.filled === e.of ? "Full" : `${e.filled} of ${e.of}`}</em>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="hm-side hm-side-vol">
              <div className="hm-side-copy">
                <h3>For volunteers</h3>
                <ul className="hm-verbs">
                  <li><strong>Sign up</strong>with a name and email. No app, no account</li>
                  <li><strong>Confirm</strong>the day before with one tap</li>
                  <li><strong>Check in</strong>by scanning a code at the door</li>
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
          <h2 className="hm-h2" id="workflow-title">One event, start to finish.</h2>
          <ol className="hm-days">
            <li>
              <p className="hm-when">A week before</p>
              <div className="hm-vig">
                <p className="hm-link"><span>civickettle.com/v/4f2a9c81</span><b>Copy link</b></p>
                <p className="hm-vig-note">Text it, email it, or print it on a flyer.</p>
              </div>
              <h3>Share one link</h3>
              <p>Volunteers pick a shift in under a minute. No account needed.</p>
            </li>
            <li>
              <p className="hm-when">The day before</p>
              <div className="hm-vig">
                <p className="hm-mail-from">Maple Street Community Garden</p>
                <p className="hm-mail-subject">Tomorrow: Neighborhood garden day</p>
                <p className="hm-mail-btn">Yes, I&apos;ll be there</p>
              </div>
              <h3>Everyone confirms</h3>
              <p>Each volunteer gets a reminder email and confirms with one tap. You see who&apos;s in.</p>
            </li>
            <li>
              <p className="hm-when">At the door</p>
              <div className="hm-vig hm-scan">
                <span className="hm-qr" aria-hidden="true" dangerouslySetInnerHTML={{ __html: qr }} />
                <div className="hm-roster">
                  <p><span className="hm-tick" />Priya N.<em>8:52</em></p>
                  <p><span className="hm-tick" />Marcus L.<em>8:58</em></p>
                  <p><span className="hm-tick hm-tick-off" />Ana O.<em>Not yet</em></p>
                </div>
              </div>
              <h3>Scan the QR code</h3>
              <p>Volunteers scan one code with their phone to check in and out.</p>
            </li>
            <li>
              <p className="hm-when">Afterward</p>
              <div className="hm-vig hm-tiles">
                <p><strong>14</strong>showed up</p>
                <p><strong>13</strong>on time</p>
                <p><strong>41.5</strong>hours</p>
              </div>
              <h3>Hours add themselves up</h3>
              <p>See who came and who didn&apos;t, approve hours with one click, and export.</p>
            </li>
          </ol>
        </section>

        <section className="hm-section hm-wrap" id="about" aria-labelledby="about-title">
          <h2 className="hm-h2" id="about-title">The why.</h2>
          <div className="hm-about">
            <div className="hm-about-note">
              <p className="hm-about-lead">Simplify your team&apos;s workflow and put more money toward your mission.</p>
              <h3>The problem</h3>
              <p>Local nonprofits and community groups run on volunteers, but most organize them with a paper sign-in sheet, a group text and a spreadsheet. People forget their shift, nobody is sure who showed up, and hours never get written down. The software that fixes this is mostly built for big organizations and is expensive.</p>
              <h3>CivicKettle solves</h3>
              <ul className="hm-solves">
                <li><strong>The chasing.</strong>Sign-ups, reminders and confirmations run on their own.</li>
                <li><strong>The guessing.</strong>You know who is coming, who showed up, and who was on time.</li>
                <li><strong>The paperwork.</strong>Hours are counted at the door and ready to export.</li>
                <li><strong>The cost.</strong>One low price, so more of your budget goes to the mission.</li>
              </ul>
              <p className="hm-about-sign">CivicKettle is based in {LOCATION}.</p>
            </div>
            <div className="hm-about-reach">
              <h3>Reach a real person</h3>
              <p>If something goes wrong, or you just have a question, contact us directly.</p>
              <a className="hm-reach" href={`mailto:${CONTACT_EMAIL}`}><span>Email</span><strong>{CONTACT_EMAIL}</strong></a>
              <a className="hm-reach" href={CONTACT_PHONE_HREF}><span>Call or text</span><strong>{CONTACT_PHONE}</strong></a>
              <p className="hm-about-fine">We answer within a day or two.</p>
            </div>
          </div>

          <dl className="hm-faq" aria-label="Common questions">
            <div><dt>Do volunteers need an app or an account?</dt><dd>No. They open your link, pick a shift, and enter a name and email. It works on any phone.</dd></div>
            <div><dt>How do I know who actually showed up?</dt><dd>Volunteers confirm the day before, then scan a QR code at the door to check in and out. You see who confirmed, who came, who was on time, and who didn&apos;t show.</dd></div>
            <div><dt>What does it cost?</dt><dd>Volunteers never pay. Organizations get a {TRIAL_DAYS} day free trial, then it is $19 a month. No card to start, and nothing is charged automatically.</dd></div>
            <div><dt>Can I get a record of everyone&apos;s hours?</dt><dd>Yes. Hours are counted from check-in to check-out. You approve them and export a spreadsheet for grants, school service hours or your own records.</dd></div>
            <div><dt>Is our volunteers&apos; information safe?</dt><dd>It goes only to your organization. It is never sold or used for ads, and it is deleted on request. The details are in the <a href="/privacy">Privacy Policy</a>.</dd></div>
            <div><dt>How do I cancel?</dt><dd>Open Settings and press Cancel subscription. No contract, no phone call. During the free trial there is nothing to cancel, because we never ask for a card.</dd></div>
          </dl>
        </section>

        <section className="hm-wrap hm-last" id="plans" aria-labelledby="pricing-title">
          <div className="hm-ticket" id="contact">
            <div className="hm-ticket-stub">
              <p className="hm-price"><strong>$19</strong><span>a month</span></p>
              <p>After a {TRIAL_DAYS} day free trial. One plan, everything included. No card to start, no contract, cancel any time.</p>
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
