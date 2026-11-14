import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AutoContinue from "./AutoContinue";

export const metadata: Metadata = { title: "Signing you in | CivicKettle", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Where the emailed sign-in link lands. It signs the person in on whatever device opened it. */
export default async function ConfirmLinkPage({ searchParams }: { searchParams: Promise<{ token_hash?: string; type?: string }> }) {
  const { token_hash: tokenHash, type } = await searchParams;
  if (!tokenHash || !type) redirect("/app?error=link");

  return (
    <div className="ck-site">
      <SiteHeader />
      <main className="ck-page ap-auth">
        <div className="ap-auth-copy">
          <p className="ck-kicker">Coordinator sign-in</p>
          <h1>Signing you in.</h1>
          <p className="ck-intro">This takes a second. If nothing happens, press the button.</p>
        </div>
        <div className="ap-card ap-notice">
          <h2>Almost there</h2>
          <AutoContinue tokenHash={tokenHash} type={type} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
