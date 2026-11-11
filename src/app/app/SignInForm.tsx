"use client";

import { useState, type FormEvent } from "react";

type State = {
  status: "idle" | "sending" | "sent" | "error" | "unconfigured";
  message?: string;
  email?: string;
};

export default function SignInForm() {
  const [state, setState] = useState<State>({ status: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = String(new FormData(form).get("email") || "").trim();
    setState({ status: "sending", email });
    try {
      const res = await fetch("/app/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as State;
      setState({ ...data, email: data.email ?? email });
    } catch {
      setState({ status: "error", email, message: "Couldn't reach the server. Try again in a moment." });
    }
  }

  if (state.status === "sent") {
    return (
      <div className="ap-card ap-notice" role="status">
        <h2>Check your email</h2>
        <p>
          We sent a sign-in link to <strong>{state.email}</strong>. Open it on this device and
          you&apos;ll land in your workspace. The link expires in an hour.
        </p>
      </div>
    );
  }

  const pending = state.status === "sending";

  return (
    <form className="ap-card ap-form" onSubmit={onSubmit}>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@yourorganization.org"
        defaultValue={state.email}
      />
      <button className="ck-button" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Email me a sign-in link"}
        {!pending && <span aria-hidden="true">↗</span>}
      </button>
      {state.status === "error" && <p className="ap-error">{state.message}</p>}
      {state.status === "unconfigured" && <p className="ap-muted">{state.message}</p>}
      <p className="ap-muted">No password to remember. Each sign-in link works once. By signing in you agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</p>
    </form>
  );
}
