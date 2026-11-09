import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { signOut } from "../actions";

export const metadata: Metadata = { title: "Overview — CivicKettle" };

const nav = [
  { href: "/app/dashboard", label: "Overview", on: true },
  { href: "/app/dashboard", label: "Events" },
  { href: "/app/dashboard", label: "Volunteers" },
  { href: "/app/dashboard", label: "Hours" },
  { href: "/app/dashboard", label: "Settings" },
];

export const dynamic = "force-dynamic";

async function Workspace() {
  let supabase = null;
  try {
    supabase = await createClient();
  } catch {
    supabase = null;
  }
  if (!supabase) {
    return (
      <div className="ap-card ap-notice">
        <h2>Workspace not connected yet</h2>
        <p>The database for CivicKettle hasn&apos;t been linked to this deployment. Nothing is broken; this screen fills in once it is.</p>
      </div>
    );
  }
  let email: string | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    email = data.user?.email ?? null;
  } catch {
    email = null;
  }
  if (!email) redirect("/app");

  return (
    <>
      <div className="ap-top">
        <div>
          <p className="ck-kicker">Your week at a glance</p>
          <h1>Welcome to CivicKettle</h1>
        </div>
        <form action={signOut}>
          <button className="ap-ghost" type="submit">Sign out</button>
        </form>
      </div>
      <div className="ap-card ap-notice">
        <h2>Signed in as {email}</h2>
        <p>Events, shifts and sign-ups arrive here next. This is the foundation: login works, sessions persist, and the rest of the build lands on top of it.</p>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <div className="ap-shell">
      <aside className="ap-side">
        <a className="ap-brand" href="/">
          <svg aria-hidden="true" viewBox="0 0 40 40" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 15.5h17v10.1a7.4 7.4 0 0 1-7.4 7.4h-2.2a7.4 7.4 0 0 1-7.4-7.4V15.5Z" />
            <path d="M29 18h2.1a4.3 4.3 0 0 1 0 8.6H29M12 19H9.5a3.3 3.3 0 0 0-3.3 3.3v1.2M16 11.5c0-2.1 1.5-2.7 1.5-4.8M23 11.5c0-2.1 1.5-2.7 1.5-4.8" />
            <path d="M20.5 22c1.8-3.3 5.4-2.8 6.1-2.6-.2 3.6-2.6 5.5-6.1 5.4" />
          </svg>
          CivicKettle
        </a>
        <nav className="ap-nav" aria-label="Workspace sections">
          {nav.map((item) => (
            <a key={item.label} href={item.href} className={item.on ? "on" : undefined} aria-current={item.on ? "page" : undefined}>
              {item.label}
            </a>
          ))}
        </nav>
        <p className="ap-side-foot">{isSupabaseConfigured() ? "Connected" : "Setup pending"}</p>
      </aside>
      <main className="ap-main">
        <Suspense fallback={<p className="ap-muted">Loading your workspace…</p>}>
          <Workspace />
        </Suspense>
      </main>
    </div>
  );
}
