import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = { title: "Thanks | CivicKettle" };

export default function Thanks() {
  return (
    <div className="ck-site">
      <SiteHeader />
      <main className="ck-page">
        <section className="ck-hero" style={{ gridTemplateColumns: "1fr", paddingBottom: "clamp(120px,14vw,180px)" }}>
          <div className="ck-hero-copy">
            <p className="ck-kicker">Request received</p>
            <h1>Thank you. We&apos;ll be in touch.</h1>
            <p className="ck-tagline">Expect a reply from civickettle@gmail.com within a day or two.</p>
            <p className="ck-intro">In the meantime, if there&apos;s anything you&apos;d like us to know about your organization, just reply to that email when it arrives.</p>
            <div className="ck-hero-action">
              <a className="ck-button" href="/">Back to CivicKettle <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
