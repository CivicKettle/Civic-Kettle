import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function Home() {
  return (
    <div className="ck-site">
      <SiteHeader />
<main id="top" className="ck-page">
    <section className="ck-hero" aria-labelledby="hero-title">
      <div className="ck-hero-copy">
        <p className="ck-kicker">Operations for community organizations</p>
        <h1 id="hero-title">Volunteer sign-ups, shifts and hours in one place.</h1>
        <p className="ck-tagline">Less admin, more community impact.</p>
        <p className="ck-intro">CivicKettle brings volunteer scheduling, automatic event reminders, QR check-in, hour tracking, and event summaries into one simple workspace.</p>
        <div className="ck-hero-action">
          <a className="ck-button" href="#contact">Ask about CivicKettle <span aria-hidden="true">↓</span></a>
          <span className="ck-price-note">Plans from $19/month</span>
        </div>
        <p className="ck-audience">For small charities, community organizations, and local nonprofits.</p>
      </div>

      <div className="ck-preview" role="img" aria-label="Illustrative CivicKettle workspace with a sample volunteer event, shifts, reminders, logged hours, and hours summary.">
        <div className="ck-preview-caption"><span>Workspace preview</span><span>Sample organization</span></div>
        <div className="ck-window">
          <div className="ck-window-bar">
            <span className="ck-window-dots" aria-hidden="true"><i></i><i></i><i></i></span>
            <span>CivicKettle</span>
            <span className="ck-window-status">Sample data</span>
          </div>
          <div className="ck-dashboard">
            <aside className="ck-sidebar" aria-hidden="true">
              <div className="ck-mini-brand">
                <svg aria-hidden="true" className="ck-mark" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15.5h17v10.1a7.4 7.4 0 0 1-7.4 7.4h-2.2a7.4 7.4 0 0 1-7.4-7.4V15.5Z"/><path d="M29 18h2.1a4.3 4.3 0 0 1 0 8.6H29M12 19H9.5a3.3 3.3 0 0 0-3.3 3.3v1.2M16 11.5c0-2.1 1.5-2.7 1.5-4.8M23 11.5c0-2.1 1.5-2.7 1.5-4.8"/><path d="M20.5 22c1.8-3.3 5.4-2.8 6.1-2.6-.2 3.6-2.6 5.5-6.1 5.4"/></svg>
                <span>CivicKettle</span>
              </div>
              <p className="ck-org-name">MAPLE STREET<br />COMMUNITY GARDEN</p>
              <div className="ck-side-link ck-side-link-active"><span>◦</span> Overview</div>
              <div className="ck-side-link"><span>□</span> Events</div>
              <div className="ck-side-link"><span>⌁</span> Volunteers</div>
              <div className="ck-side-link"><span>↗</span> Hours</div>
            </aside>

            <div className="ck-dashboard-main">
              <div className="ck-dashboard-heading">
                <div>
                  <p className="ck-ui-label">SATURDAY, MAY 18</p>
                  <h2>Your week at a glance</h2>
                </div>
                <span className="ck-avatar">MG</span>
              </div>

              <div className="ck-event">
                <div className="ck-event-heading">
                  <div>
                    <p className="ck-ui-label">UPCOMING EVENT</p>
                    <h3>Neighborhood garden day</h3>
                  </div>
                  <div className="ck-date-stamp"><span>SAT</span><strong>18</strong></div>
                </div>
                <div className="ck-event-stats">
                  <div><strong>12 / 16</strong><span>Volunteer spots</span></div>
                  <div><strong>3</strong><span>Open shifts</span></div>
                  <div><strong>28 hrs</strong><span>Logged this month</span></div>
                </div>
                <div className="ck-capacity"><span></span></div>
                <div className="ck-reminder">
                  <span className="ck-reminder-dot"></span>
                  <span className="ck-reminder-title">Event reminder</span>
                  <span className="ck-reminder-copy">Scheduled for Friday</span>
                </div>
              </div>

              <div className="ck-summary-row">
                <div className="ck-summary">
                  <div className="ck-summary-heading"><span>THIS WEEK</span><span>›</span></div>
                  <p><span>Upcoming events</span><strong>3</strong></p>
                  <p><span>Volunteer sign-ups</span><strong>24</strong></p>
                </div>
                <div className="ck-summary ck-giving">
                  <div className="ck-summary-heading"><span>HOURS SUMMARY</span><span>›</span></div>
                  <div className="ck-giving-total">128 hrs</div>
                  <p><span>31 volunteers</span><span className="ck-giving-period">This month</span></p>
                </div>
              </div>
              <p className="ck-demo-note">Illustrative sample workspace</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="ck-workflow" id="workflow" aria-labelledby="workflow-title">
      <div className="ck-section-intro">
        <p className="ck-kicker">The work, connected</p>
        <h2 id="workflow-title">From first sign-up to final summary.</h2>
        <p>Keep the moving parts of a community event together, so your team can spend more energy on the people and purpose behind it.</p>
      </div>
      <div className="ck-workflow-list">
        <article className="ck-workflow-row">
          <span className="ck-step">01</span>
          <h3>Collect sign-ups</h3>
          <p>Give volunteers one clear place to join an event and choose a shift.</p>
          <span className="ck-row-note">VOLUNTEER SIGN-UPS</span>
        </article>
        <article className="ck-workflow-row">
          <span className="ck-step">02</span>
          <h3>Coordinate the day</h3>
          <p>Organize the schedule and send automatic reminders before each event.</p>
          <span className="ck-row-note">SCHEDULING + REMINDERS</span>
        </article>
        <article className="ck-workflow-row">
          <span className="ck-step">03</span>
          <h3>Keep track of time</h3>
          <p>Volunteers scan a QR code at the door; hours log themselves from check-in to check-out.</p>
          <span className="ck-row-note">QR CHECK-IN + HOURS</span>
        </article>
        <article className="ck-workflow-row">
          <span className="ck-step">04</span>
          <h3>See what happened</h3>
          <p>Get a summary of who came, hours logged and no-shows the morning after.</p>
          <span className="ck-row-note">EVENT SUMMARIES</span>
        </article>
      </div>
    </section>

    <section className="ck-fit" aria-labelledby="fit-title">
      <div className="ck-fit-label">
        <span className="ck-fit-mark"><svg aria-hidden="true" className="ck-mark" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15.5h17v10.1a7.4 7.4 0 0 1-7.4 7.4h-2.2a7.4 7.4 0 0 1-7.4-7.4V15.5Z"/><path d="M29 18h2.1a4.3 4.3 0 0 1 0 8.6H29M12 19H9.5a3.3 3.3 0 0 0-3.3 3.3v1.2M16 11.5c0-2.1 1.5-2.7 1.5-4.8M23 11.5c0-2.1 1.5-2.7 1.5-4.8"/><path d="M20.5 22c1.8-3.3 5.4-2.8 6.1-2.6-.2 3.6-2.6 5.5-6.1 5.4"/></svg></span>
        <p className="ck-kicker">Made for small teams</p>
      </div>
      <div className="ck-fit-copy">
        <h2 id="fit-title">Good work deserves a simpler back office.</h2>
        <p>CivicKettle is designed for small charities, community organizations, and local nonprofits that bring people together to make a difference.</p>
      </div>
      <p className="ck-fit-tagline">Less admin,<br />more community impact.</p>
    </section>

    <section className="ck-pricing" id="plans" aria-labelledby="pricing-title">
      <div className="ck-pricing-copy">
        <p className="ck-kicker">Straightforward monthly plans</p>
        <h2 id="pricing-title">Room in the budget.<br />More room for the mission.</h2>
        <p>Plans range from <strong>$19–$59 per month.</strong> Get in touch for current plan details and to find the right fit for your organization.</p>
      </div>
      <a className="ck-button ck-button-light" href="#contact">Ask about plans <span aria-hidden="true">↓</span></a>
    </section>
    <section className="ck-contact" id="contact" aria-labelledby="contact-title">
      <div className="ck-contact-copy">
        <p className="ck-kicker">Founding organizations</p>
        <h2 id="contact-title">We're starting with a small group.</h2>
        <p>CivicKettle is onboarding a handful of founding organizations first, so every workspace is set up with you, not handed over. Tell us about your group and we'll be in touch within a day or two.</p>
        <p className="ck-contact-alt">Prefer email? <a href="mailto:civickettle@gmail.com">civickettle@gmail.com</a></p>
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
        <button className="ck-button" type="submit">Request a founding spot <span aria-hidden="true">↗</span></button>
        <p className="ck-form-note">No payment, no commitment. We'll reply from civickettle@gmail.com.</p>
      </form>
    </section>
  </main>
      <SiteFooter />
    </div>
  );
}
