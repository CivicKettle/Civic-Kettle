"use client";

import { useState, type FormEvent } from "react";

type State = { status: "idle" | "sending" | "sent" | "error"; message?: string; email?: string };

/**
 * The whole way in: type an email, get a link, open it. Works the same for a
 * new organization and for a coordinator coming back.
 */
export default function StartForm({ tone = "dark", id }: { tone?: "dark" | "light"; id: string }) {
  const [state, setState] = useState<State>({ status: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") || "").trim();
    setState({ status: "sending", email });
    try {
      const res = await fetch("/app/api/signin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = (await res.json()) as { status?: string; message?: string };
      if (data.status === "sent") {
        setState({ status: "sent", email });
        // Count the sign-up for analytics, without the email address. Only if analytics is switched on.
        if (process.env.NEXT_PUBLIC_POSTHOG_KEY) void import("posthog-js").then(({ default: posthog }) => { if (posthog.__loaded) posthog.capture("trial_email_submitted", { form: id }); });
      }
      else setState({ status: "error", email, message: data.message || "That didn't work. Try again in a moment." });
    } catch {
      setState({ status: "error", email, message: "Couldn't reach the server. Try again in a moment." });
    }
  }

  if (state.status === "sent") {
    return (
      <div className={`hm-start hm-start-${tone} hm-start-done`} role="status">
        <strong>Check your email.</strong>
        <span>We sent a link to {state.email}. Open it, choose a password, and you&apos;re in. Nothing after a minute? Check the address for typos and your spam folder, then try again.</span>
      </div>
    );
  }

  const sending = state.status === "sending";
  return (
    <form className={`hm-start hm-start-${tone}`} onSubmit={onSubmit}>
      <div className="hm-start-row">
        <label className="ck-hidden" htmlFor={id}>Your email</label>
        <input id={id} name="email" type="email" required autoComplete="email" inputMode="email" placeholder="Your email" defaultValue={state.email} />
        <button type="submit" disabled={sending}>{sending ? "Sending…" : "Start free trial"}</button>
      </div>
      {state.status === "error" && <p className="hm-start-error" role="alert">{state.message}</p>}
    </form>
  );
}
