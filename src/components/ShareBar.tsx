"use client";

import { useEffect, useState } from "react";

export default function ShareBar({
  url,
  label = "Volunteer sign-up link",
  sub = "Text it, email it, or print it on a flyer. Volunteers sign up in under a minute, no account.",
  openLabel = "Open as a volunteer",
  qrSrc,
  qrDownload,
  shareTitle,
}: {
  url: string;
  label?: string;
  sub?: string;
  openLabel?: string;
  /** Address of the QR code image for this link, and of its print-quality download. */
  qrSrc?: string;
  qrDownload?: string;
  /** Title for the phone's share sheet. */
  shareTitle?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => { setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function"); }, []);
  async function share() {
    try { await navigator.share({ title: shareTitle || label, url }); } catch { /* closed the share sheet */ }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user can select the text by hand */
    }
  }
  const pretty = url.replace(/^https?:\/\//, "");
  return (
    <div className={`ap-share${qrSrc ? " has-qr" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {qrSrc && <img className="ap-share-qr" src={qrSrc} width={132} height={132} alt={`QR code for ${pretty}`} />}
      <div className="ap-share-copy">
        <span className="ap-share-k">{label}</span>
        <a className="ap-share-url" href={url} target="_blank" rel="noreferrer" onClick={(e) => e.currentTarget.blur()}>{pretty}</a>
        <span className="ap-share-sub">{sub}</span>
      </div>
      <div className="ap-share-actions">
        <button className="ck-button" type="button" onClick={copy}>{copied ? "Copied" : "Copy link"} <span aria-hidden="true">{copied ? "✓" : "⧉"}</span></button>
        {canShare && <button className="ck-button" type="button" onClick={share}>Share</button>}
        {qrDownload && <a className="ap-ghost" href={qrDownload}>Download QR code</a>}
        <a className="ap-ghost" href={url} target="_blank" rel="noreferrer">{openLabel} ↗</a>
      </div>
    </div>
  );
}
