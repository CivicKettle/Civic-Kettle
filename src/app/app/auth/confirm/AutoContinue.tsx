"use client";

import { useEffect, useRef } from "react";

/** Presses the button for the person as soon as the page opens. The button stays as a fallback. */
export default function AutoContinue({ tokenHash, type }: { tokenHash: string; type: string }) {
  const form = useRef<HTMLFormElement>(null);
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    form.current?.requestSubmit();
  }, []);
  return (
    <form ref={form} action="/app/api/auth/confirm" method="post" className="ap-form">
      <input type="hidden" name="token_hash" value={tokenHash} />
      <input type="hidden" name="type" value={type} />
      <button className="ck-button" type="submit">Continue to CivicKettle <span aria-hidden="true">↗</span></button>
    </form>
  );
}
