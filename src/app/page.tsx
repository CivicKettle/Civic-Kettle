import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import StartForm from "@/components/StartForm";
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
              <h1 id="hero-title">Volunteer sign{"\u2011"}ups, shifts and hours in one place.</h1>
              <p className="hm-lede">Share one link. Volunteers pick a shift, get reminded, and check in at the door. Their hours add up on their own.</p>
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
          <p className="hm-questions">Questions? Write to <a href="mailto:civickettle@gmail.com">civickettle@gmail.com</a>. Already use CivicKettle? <a href="/app">Sign in</a>. By starting you agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
