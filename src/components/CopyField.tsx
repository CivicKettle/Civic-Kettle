"use client";

import { useState } from "react";

export default function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Older browsers: the field is selectable, user can copy by hand.
    }
  }
  return (
    <div className="ap-copy">
      <input type="text" readOnly value={value} aria-label="Sign-up link" onFocus={(e) => e.currentTarget.select()} />
      <button type="button" onClick={copy}>{copied ? "Copied" : "Copy"}</button>
    </div>
  );
}
