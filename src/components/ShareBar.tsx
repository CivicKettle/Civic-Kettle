"use client";

import { useState } from "react";

export default function ShareBar({
  url,
  label = "Volunteer sign-up link",
  sub = "Text it, email it, or print it on a flyer. Volunteers sign up in under a minute, no account.",
  openLabel = "Open as a volunteer",
}: {
  url: string;
  label?: string;
  sub?: string;
  openLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
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
    <div className="ap-share">
      <div className="ap-share-copy">
        <span className="ap-share-k">{label}</span>
        <a className="ap-share-url" href={url} target="_blank" rel="noreferrer" onClick={(e) => e.currentTarget.blur()}>{pretty}</a>
        <span className="ap-share-sub">{sub}</span>
      </div>
      <div className="ap-share-actions">
        <button className="ck-button" type="button" onClick={copy}>{copied ? "Copied" : "Copy link"} <span aria-hidden="true">{copied ? "✓" : "⧉"}</span></button>
        <a className="ap-ghost" href={url} target="_blank" rel="noreferrer">{openLabel} ↗</a>
      </div>
    </div>
  );
}
