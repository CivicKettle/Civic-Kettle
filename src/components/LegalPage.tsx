import type { ReactNode } from "react";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

/** Shared frame for the privacy policy and the terms. */
export default function LegalPage({ kicker, title, updated, children }: { kicker: string; title: string; updated: string; children: ReactNode }) {
  return (
    <div className="ck-site">
      <SiteHeader />
      <main className="ck-page ck-legal">
        <p className="ck-kicker">{kicker}</p>
        <h1>{title}</h1>
        <p className="ck-legal-updated">Last updated {updated}</p>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
