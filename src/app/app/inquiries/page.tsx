import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getOrg, getSession } from "@/lib/db";

export const metadata: Metadata = { title: "Inquiries — CivicKettle" };
export const dynamic = "force-dynamic";

type Inquiry = {
  id: string; organization: string; name: string; email: string; org_type: string | null;
  volunteers: string | null; current_process: string | null; biggest_pain: string | null;
  status: string; created_at: string;
};

export default async function InquiriesPage() {
  const session = await getSession();
  if (!session) redirect("/app");
  const org = await getOrg(session);
  if (!org) redirect("/app/setup");
  const { data } = await session.supabase.from("inquiries").select("*").order("created_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as Inquiry[];

  return (
    <AppShell active="settings" orgName={org.name} email={session.email}>
      <div className="ap-top">
        <div>
          <p className="ck-kicker">From civickettle.com</p>
          <h1 className="ap-h1">Inquiries</h1>
        </div>
      </div>
      <section className="ap-card">
        <div className="ap-card-h"><h2>{rows.length} organization{rows.length === 1 ? "" : "s"} asked about a founding spot</h2></div>
        {rows.length === 0 && <div className="ap-empty"><p>Nothing yet. Submissions from the website form land here.</p></div>}
        {rows.map((r) => (
          <div key={r.id} className="ap-row" style={{ alignItems: "flex-start" }}>
            <div>
              <strong>{r.organization}</strong> · {r.name} · <a className="ap-link" href={`mailto:${r.email}`}>{r.email}</a>
              <div className="m">{[r.org_type, r.volunteers && `${r.volunteers} volunteers a month`].filter(Boolean).join(" · ")}</div>
              {r.current_process && <div className="m">Today: {r.current_process}</div>}
              {r.biggest_pain && <div className="m">Pain: {r.biggest_pain}</div>}
            </div>
            <span className="ap-pill">{new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
