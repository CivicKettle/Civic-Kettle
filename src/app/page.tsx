import QRCode from "qrcode";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

/** Sample sign-ups for the illustration at the top of the page. */
const SHEET = [
  { name: "Setup", time: "8:00 to 9:00 AM", people: ["Priya N.", "Marcus L."], open: 0 },
  { name: "Planting", time: "9:00 AM to 12:00 PM", people: ["Ana O.", "Ben W.", "Dee S.", "Fay L.", "Jun K.", "Sam R.", "Tess B."], open: 1 },
  { name: "Cleanup", time: "12:00 to 1:00 PM", people: ["Eli S.", "Noor A.", "Cy P."], open: 3 },
];

const initials = (n: string) => n.split(" ").map((w) => w[0]).join("");

export default async function Home() {
  // A real code: scanning it opens this site.
  const qr = await QRCode.toString("https://civickettle.com", { type: "svg", margin: 0, color: { dark: "#252b25", light: "#0000" } });
  let chip = 0;

  return (
    <div className="ck-site">
      <SiteHeader />
      <main id="top">
        <section className="hm-hero" aria-labelledby="hero-title">
          <div className="hm-wrap hm-hero-grid">
            <div className="hm-hero-copy">
              <h1 id="hero-title">Volunteer sign{"\u2011"}ups, shifts and hours in one place.</h1>
              <p className="hm-lede">Share one link. Volunteers pick a shift, get reminded, scan in at the door, and their hours add up on their own.</p>
              <div className="hm-hero-action">
                <a className="hm-cta" href="#contact">Get started</a>
                <a className="hm-quiet" href="#workflow">See how it works</a>
              </div>
              <p className="hm-audience">$19 a month. Made for small charities, community groups and local nonprofits.</p>
            </div>

            <div className="hm-stage" role="img" aria-label="Illustration with sample data: a sign-up sheet for a garden day filling with volunteer names, the same event on a volunteer's phone, and a door sign with a code to scan for check-in.">
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

              <div className="hm-phone" aria-hidden="true">
                <div className="hm-phone-screen">
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

              <div className="hm-door" aria-hidden="true">
                <div className="hm-door-qr" dangerouslySetInnerHTML={{ __html: qr }} />
                <p><strong>Scan to check in</strong>Neighborhood garden day</p>
              </div>
            </div>
          </div>
        </section>

        <section className="hm-section hm-wrap" id="workflow" aria-labelledby="workflow-title">
          <div className="hm-head">
            <h2 id="workflow-title">One Saturday, start to finish.</h2>
            <p>Here is what a single event looks like when the sign-up sheet, the reminder texts and the hours spreadsheet are the same thing.</p>
          </div>
          <ol className="hm-days">
            <li>
              <p className="hm-when">Monday</p>
              <div className="hm-vig">
                <p className="hm-link"><span>civickettle.com/v/4f2a9c81</span><b>Copy link</b></p>
                <p className="hm-vig-note">Text it, email it, or print it on a flyer.</p>
              </div>
              <h3>Share one link</h3>
              <p>Volunteers pick a shift in under a minute, with no account to create. A parent can sign up a child under 18.</p>
            </li>
            <li>
              <p className="hm-when">Friday, 6 pm</p>
              <div className="hm-vig">
                <p className="hm-mail-from">Maple Street Community Garden</p>
                <p className="hm-mail-subject">Tomorrow: Neighborhood garden day, Planting</p>
                <p className="hm-vig-note">Can&apos;t make it? Cancel in one tap.</p>
              </div>
              <h3>Reminders send themselves</h3>
              <p>Everyone gets an email the day before and the morning of. When someone cancels, the spot reopens right away.</p>
            </li>
            <li>
              <p className="hm-when">Saturday, 8:45 am</p>
              <div className="hm-vig hm-roster">
                <p><span className="hm-tick" />Priya Nair<em>In at 8:52</em></p>
                <p><span className="hm-tick" />Marcus Lee<em>In at 8:58</em></p>
                <p><span className="hm-tick hm-tick-off" />Ana Ortiz<em>Not here yet</em></p>
              </div>
              <h3>Scan in at the door</h3>
              <p>Tape up the sign. Volunteers scan the code to check in and out, and you watch the roster fill on your phone.</p>
            </li>
            <li>
              <p className="hm-when">Saturday night</p>
              <div className="hm-vig hm-tiles">
                <p><strong>14</strong>showed up</p>
                <p><strong>41.5</strong>hours</p>
                <p><strong>2</strong>no-shows</p>
              </div>
              <h3>Hours and a summary, done</h3>
              <p>Approve everyone&apos;s hours with one click, see who came and who didn&apos;t, and export it for your records.</p>
            </li>
          </ol>
        </section>

        <section className="hm-section hm-wrap hm-swap" aria-labelledby="swap-title">
          <div className="hm-head">
            <h2 id="swap-title">Less admin, more community impact.</h2>
            <p>CivicKettle does one job: it takes the paperwork around volunteers off the person who organizes them.</p>
          </div>
          <dl className="hm-swap-list">
            <div><dt>The clipboard at the door</dt><dd>A code volunteers scan with their own phone</dd></div>
            <div><dt>The group text the night before</dt><dd>Reminders that go out without you</dd></div>
            <div><dt>Guessing who will show up</dt><dd>A roster that updates as people sign up and cancel</dd></div>
            <div><dt>The spreadsheet of hours</dt><dd>Hours counted from check-in to check-out, ready to export</dd></div>
          </dl>
        </section>

        <section className="hm-wrap" id="plans" aria-labelledby="pricing-title">
          <div className="hm-ticket">
            <div className="hm-ticket-stub">
              <p className="hm-price"><strong>$19</strong><span>a month</span></p>
              <p>One plan for your whole organization.</p>
            </div>
            <div className="hm-ticket-body">
              <h2 id="pricing-title">Everything on this page is included.</h2>
              <ul>
                <li>Sign-up pages for every event</li>
                <li>Email reminders and messages</li>
                <li>Check-in by scanning a code</li>
                <li>Hours with approval and export</li>
                <li>A summary after each event</li>
                <li>Room for your co-coordinators</li>
              </ul>
              <div className="hm-ticket-foot">
                <a className="ck-button" href="#contact">Get started</a>
                <span>Nothing is charged until you&apos;ve agreed to start.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="ck-contact hm-wrap hm-contact" id="contact" aria-labelledby="contact-title">
          <div className="ck-contact-copy">
            <h2 id="contact-title">Bring CivicKettle to your organization.</h2>
            <p>Tell us a little about your group. We&apos;ll email you within a day or two to get your workspace ready.</p>
            <p className="ck-contact-alt">Prefer email? <a href="mailto:civickettle@gmail.com">civickettle@gmail.com</a></p>
            <p className="ck-contact-alt">Already use CivicKettle? <a href="/app">Sign in</a></p>
          </div>
      <form className="ck-form" name="founding-org" method="POST" action="/app/api/inquiry">
                <p className="ck-hidden"><label>Leave this empty: <input name="bot-field" /></label></p>
        <div className="ck-form-row">
          <label htmlFor="f-org">Organization</label>
          <input id="f-org" name="organization" type="text" required autoComplete="organization" placeholder="Maple Street Community Garden" />
        </div>
        <div className="ck-form-grid">
          <div className="ck-form-row">
            <label htmlFor="f-name">Your name</label>
            <input id="f-name" name="name" type="text" required autoComplete="name" />
          </div>
          <div className="ck-form-row">
            <label htmlFor="f-email">Email</label>
            <input id="f-email" name="email" type="email" required autoComplete="email" />
          </div>
        </div>
        <div className="ck-form-grid">
          <div className="ck-form-row">
            <label htmlFor="f-type">Kind of organization</label>
            <select id="f-type" name="org_type" required defaultValue="">
              <option value="" disabled>Choose one</option>
              <option>Small charity or nonprofit</option>
              <option>Community or neighborhood group</option>
              <option>Faith community</option>
              <option>School, PTA or youth program</option>
              <option>Sports league or club</option>
              <option>Something else</option>
            </select>
          </div>
          <div className="ck-form-row">
            <label htmlFor="f-size">Volunteers in a typical month</label>
            <select id="f-size" name="volunteers" required defaultValue="">
              <option value="" disabled>Choose one</option>
              <option>Under 10</option>
              <option>10 to 25</option>
              <option>25 to 75</option>
              <option>75 to 200</option>
              <option>More than 200</option>
            </select>
          </div>
        </div>
        <div className="ck-form-row">
          <label htmlFor="f-today">How do you handle sign-ups and hours today?</label>
          <textarea id="f-today" name="current_process" rows={3} placeholder="Spreadsheets, a group text, sign-up sheets at the door…"></textarea>
        </div>
        <div className="ck-form-row">
          <label htmlFor="f-pain">What's the most annoying part? <span>Optional</span></label>
          <textarea id="f-pain" name="biggest_pain" rows={3}></textarea>
        </div>
        <button className="ck-button" type="submit">Request a workspace <span aria-hidden="true">↗</span></button>
        <p className="ck-form-note">No payment and no commitment. We reply from civickettle@gmail.com.</p>
      </form>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
