"use client";

import { useActionState } from "react";
import { sendSignInLink, type SignInState } from "./actions";

const initial: SignInState = { status: "idle" };

export default function SignInForm() {
  const [state, action, pending] = useActionState(sendSignInLink, initial);

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

  return (
    <form className="ap-card ap-form" action={action}>
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
      <p className="ap-muted">No password to remember. Each sign-in link works once.</p>
    </form>
  );
}
