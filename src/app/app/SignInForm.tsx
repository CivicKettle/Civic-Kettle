"use client";

import { useState, type FormEvent } from "react";

type State = {
  status: "idle" | "sending" | "sent" | "signed_in" | "error" | "unconfigured";
  message?: string;
  email?: string;
};

const LINK_ERROR =
  "That sign-in link has expired or was already used. Each link works once, and only the newest one works. Enter your email to get a fresh link, then open it in this same browser window.";

export default function SignInForm({ linkError = false }: { linkError?: boolean }) {
  const [state, setState] = useState<State>(linkError ? { status: "error", message: LINK_ERROR } : { status: "idle" });

  const [usePassword, setUsePassword] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fields = new FormData(form);
    const email = String(fields.get("email") || "").trim();
    const password = usePassword ? String(fields.get("password") || "") : "";
    setState({ status: "sending", email });
    try {
      const res = await fetch("/app/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(password ? { email, password } : { email }),
      });
      const data = (await res.json()) as State;
      if (data.status === "signed_in") {
        window.location.assign("/app/dashboard");
        return;
      }
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
          We sent a sign-in link to <strong>{state.email}</strong>. Open it in this same browser and
          you&apos;ll land in your workspace. The link works once and expires in an hour.
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
      {usePassword && (
        <>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" />
        </>
      )}
      <button className="ck-button" type="submit" disabled={pending}>
        {pending ? (usePassword ? "Signing in…" : "Sending…") : usePassword ? "Sign in" : "Email me a sign-in link"}
        {!pending && <span aria-hidden="true">↗</span>}
      </button>
      <button className="ap-link ap-switch-mode" type="button" onClick={() => setUsePassword(!usePassword)}>
        {usePassword ? "Email me a sign-in link instead" : "Use my password instead"}
      </button>
      {state.status === "error" && <p className="ap-error">{state.message}</p>}
      {state.status === "unconfigured" && <p className="ap-muted">{state.message}</p>}
      <p className="ap-muted">{usePassword ? "Passwords are optional. You set one in Settings after signing in." : "No password needed. Each sign-in link works once."} By signing in you agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</p>
    </form>
  );
}
