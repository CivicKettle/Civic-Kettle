import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL((process.env.NEXT_PUBLIC_SITE_URL || "https://civickettle.com").trim() || "https://civickettle.com"),
  title: "CivicKettle: volunteer sign-ups, reminders and hours for local nonprofits",
  openGraph: {
    siteName: "CivicKettle",
    type: "website",
    title: "CivicKettle: volunteer sign-ups, reminders and hours for local nonprofits",
    description: "Share one link. Volunteers pick a shift, get reminded, and check in at the door. Free for volunteers, free to try for organizers.",
  },
  twitter: { card: "summary_large_image" },
  description:
    "Simple volunteer sign-ups, shifts, reminders and hour tracking for small charities, community organizations, and local nonprofits.",
};

export const viewport: Viewport = {
  themeColor: "#f2f0e9",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
