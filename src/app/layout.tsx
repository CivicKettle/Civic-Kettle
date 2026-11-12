import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicKettle: volunteer sign-ups, reminders and hours for small nonprofits",
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
