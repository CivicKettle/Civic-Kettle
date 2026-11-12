import KettleMark from "./KettleMark";
import type { ReactNode } from "react";

const NAV = [
  { href: "/app/dashboard", label: "Overview", key: "overview" },
  { href: "/app/events", label: "Events", key: "events" },
  { href: "/app/volunteers", label: "Volunteers", key: "volunteers" },
  { href: "/app/hours", label: "Hours", key: "hours" },
  { href: "/app/settings", label: "Settings", key: "settings" },
] as const;

export type NavKey = (typeof NAV)[number]["key"];

export { KettleMark };

export default function AppShell({
  active,
  orgName,
  email,
  children,
}: {
  active: NavKey;
  orgName?: string | null;
  email?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="ap-shell">
      <aside className="ap-side">
        <a className="ap-brand" href="/app/dashboard">
          <KettleMark />
          CivicKettle
        </a>
        {orgName && <p className="ap-org">{orgName}</p>}
        <nav className="ap-nav" aria-label="Workspace sections">
          {NAV.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className={item.key === active ? "on" : undefined}
              aria-current={item.key === active ? "page" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="ap-side-foot">
          {email && <span>{email}</span>}
          <form action="/app/api/signout" method="post">
            <button className="ap-link" type="submit">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="ap-main">{children}</main>
    </div>
  );
}
