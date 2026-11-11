import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { KettleMark } from "@/components/AppShell";
import PrintButton from "@/components/PrintButton";
import { getOrg, getSession, type Event } from "@/lib/db";
import { siteUrl } from "@/lib/supabase/server";
import { fmtLongDate, fmtRange } from "@/lib/time";

export const metadata: Metadata = { title: "Door sign — CivicKettle" };
export const dynamic = "force-dynamic";

export default async function PosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/app");
  const org = await getOrg(session);
  if (!org) redirect("/app/setup");
  const { data: evRaw } = await session.supabase.from("events").select("*").eq("id", id).eq("org_id", org.id).maybeSingle();
  if (!evRaw) notFound();
  const ev = evRaw as Event;
  const tz = org.time_zone;
  const publicUrl = `${siteUrl()}/v/${ev.public_token}`;
  const qrSvg = await QRCode.toString(publicUrl, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#1f2a24", light: "#ffffff" } });

  return (
    <div className="po">
      <div className="po-bar">
        <a className="ap-ghost" href={`/app/events/${id}/checkin`}>Back</a>
        <PrintButton />
      </div>
      <div className="po-sheet">
        <p className="po-org">{org.name}</p>
        <h1 className="po-title">{ev.title}</h1>
        <p className="po-meta">{fmtLongDate(ev.starts_at, tz)} · {fmtRange(ev.starts_at, ev.ends_at, tz)}{ev.location ? ` · ${ev.location}` : ""}</p>
        <div className="po-qr" role="img" aria-label="QR code" dangerouslySetInnerHTML={{ __html: qrSvg }} />
        <p className="po-cta">Volunteers: scan to check in</p>
        <p className="po-sub">Not signed up yet? The same code signs you up. Scan again when you leave to check out.</p>
        <p className="po-url">{publicUrl.replace(/^https?:\/\//, "")}</p>
        <p className="po-foot"><KettleMark />CivicKettle</p>
      </div>
    </div>
  );
}
