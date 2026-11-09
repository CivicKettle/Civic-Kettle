import type { ReactNode } from "react";

const NAV = [
  { href: "/app/dashboard", label: "Overview", key: "overview" },
  { href: "/app/events", label: "Events", key: "events" },
  { href: "/app/volunteers", label: "Volunteers", key: "volunteers" },
  { href: "/app/hours", label: "Hours", key: "hours" },
  { href: "/app/settings", label: "Settings", key: "settings" },
] as const;

export type NavKey = (typeof NAV)[number]["key"];

export function KettleMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 15.5h17v10.1a7.4 7.4 0 0 1-7.4 7.4h-2.2a7.4 7.4 0 0 1-7.4-7.4V15.5Z" />
      <path d="M29 18h2.1a4.3 4.3 0 0 1 0 8.6H29M12 19H9.5a3.3 3.3 0 0 0-3.3 3.3v1.2M16 11.5c0-2.1 1.5-2.7 1.5-4.8M23 11.5c0-2.1 1.5-2.7 1.5-4.8" />
      <path d="M20.5 22c1.8-3.3 5.4-2.8 6.1-2.6-.2 3.6-2.6 5.5-6.1 5.4" />
    </svg>
  );
}

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
