import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KettleMark } from "@/components/AppShell";
import { cleanCode } from "@/lib/letters";

export const metadata: Metadata = { title: "Check an hours letter | CivicKettle", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Public: type the code from an hours letter to check it. */
export default async function VerifyStartPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code: raw } = await searchParams;
  if (raw) redirect(`/verify/${cleanCode(raw) ?? "unknown"}`);
  return (
    <div className="pv">
      <header className="pv-head"><span className="pv-brand"><KettleMark />CivicKettle</span><span className="pv-org">Hours letter check</span></header>
      <main className="pv-body">
        <div className="pv-hero"><p className="pv-kicker">Hours letter check</p><h1 className="pv-h1">Check a volunteer hours letter</h1></div>
        <form action="/verify" method="get" className="pv-card pv-fields">
          <p className="pv-muted">Type the code printed at the bottom of the letter. You will see the name, hours and dates the organization approved.</p>
          <label>Letter code<input name="code" required maxLength={20} autoCapitalize="characters" autoComplete="off" placeholder="XXXX-XXXX-XXXX" /></label>
          <button className="pv-button" type="submit">Check this code</button>
        </form>
      </main>
      <footer className="pv-foot"><span>Hours recorded by <a href="/">CivicKettle</a></span></footer>
    </div>
  );
}
