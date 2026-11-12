"use client";

import { useState } from "react";
import type { ShiftWithCounts } from "@/lib/db";

type Props = {
  token: string;
  shifts: ShiftWithCounts[];
  tz: string;
  error?: string;
  prefillShift?: string;
};

function fmt(iso: string, tz: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(new Date(iso)).replace(":00", "");
}

export default function SignupForm({ token, shifts, tz, error, prefillShift }: Props) {
  const firstOpen = shifts.find((s) => s.open > 0)?.id;
  const [shift, setShift] = useState<string>(prefillShift && shifts.some((s) => s.id === prefillShift && s.open > 0) ? prefillShift : firstOpen ?? "");
  const [adult, setAdult] = useState<"" | "yes" | "no">("");
  const picked = shifts.find((s) => s.id === shift);
  const joiningWaitlist = Boolean(picked && picked.open === 0);

  return (
    <form action="/app/api/public/signup" method="post" className="pv-form">
      <input type="hidden" name="token" value={token} />

      <fieldset className="pv-card pv-shifts">
        <legend>Pick a shift</legend>
        {shifts.map((s) => {
          const full = s.open === 0;
          return (
            <label key={s.id} className={`pv-opt${full ? " waitable" : ""}`}>
              <input type="radio" name="shift_id" value={s.id} checked={shift === s.id} onChange={() => setShift(s.id)} required />
              <span className="t"><b>{s.name}</b><span>{fmt(s.starts_at, tz)} to {fmt(s.ends_at, tz)}</span></span>
              <span className={`n${full || s.open <= 2 ? " low" : ""}`}>{full ? (s.waiting > 0 ? `Full, ${s.waiting} waiting` : "Full, join waiting list") : `${s.open} spot${s.open === 1 ? "" : "s"} left`}</span>
            </label>
          );
        })}
        {joiningWaitlist && <p className="pv-muted pv-waitnote">This shift is full. Sign up to join its waiting list: if a spot opens, you&apos;re moved in automatically and emailed right away.</p>}
      </fieldset>

      {(
        <>
          <fieldset className="pv-card pv-age">
            <legend>Is the volunteer 18 or older?</legend>
            <div className="pv-seg">
              <label className={adult === "yes" ? "on" : undefined}><input type="radio" name="adult" value="yes" required checked={adult === "yes"} onChange={() => setAdult("yes")} />Yes, 18 or older</label>
              <label className={adult === "no" ? "on" : undefined}><input type="radio" name="adult" value="no" checked={adult === "no"} onChange={() => setAdult("no")} />No, under 18</label>
            </div>
          </fieldset>

          {adult !== "" && (
            <div className="pv-card pv-fields">
              {adult === "no" && (
                <p className="pv-note">A parent or guardian signs up a volunteer under 18. Confirmations and reminders go to the guardian&apos;s email.</p>
              )}
              <label>{adult === "no" ? "Volunteer's name" : "Your name"}<input name="volunteer_name" type="text" required maxLength={80} autoComplete="name" placeholder="First and last" /></label>
              {adult === "yes" ? (
                <>
                  <label>Email <span>Confirmation and reminders go here</span><input name="email" type="email" required autoComplete="email" inputMode="email" /></label>
                  <label>Mobile number <span>Optional, for texts later</span><input name="phone" type="tel" autoComplete="tel" inputMode="tel" pattern="[0-9()+\-. ]{10,20}" title="10-digit phone number" placeholder="949 555 0100" /></label>
                </>
              ) : (
                <>
                  <label>Volunteer&apos;s mobile <span>Optional, 13 and older</span><input name="phone" type="tel" autoComplete="off" inputMode="tel" pattern="[0-9()+\-. ]{10,20}" title="10-digit phone number" placeholder="949 555 0100" /></label>
                  <label>Parent or guardian name<input name="guardian_name" type="text" required maxLength={80} /></label>
                  <label>Parent or guardian email <span>Confirmation and reminders go here</span><input name="email" type="email" required inputMode="email" /></label>
                  <label>Parent or guardian mobile <span>Optional, for texts later</span><input name="guardian_phone" type="tel" inputMode="tel" pattern="[0-9()+\-. ]{10,20}" title="10-digit phone number" placeholder="949 555 0100" /></label>
                  <label className="pv-check"><input type="checkbox" name="guardian_consent" value="yes" required /> I am this volunteer&apos;s parent or guardian and I consent to this sign-up.</label>
                </>
              )}
              {error && <p className="pv-error">{decodeURIComponent(error)}</p>}
              <button className="pv-button" type="submit">{joiningWaitlist ? "Join the waiting list" : "Sign me up"}</button>
              <p className="pv-fine">{joiningWaitlist ? "An email confirms you're on the waiting list." : "A confirmation email arrives right away, with a link to cancel if plans change."} Reminders come the day before and the morning of. No account needed. By signing up you agree to the <a href="/terms" target="_blank" rel="noopener">Terms</a> and <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>.</p>
            </div>
          )}
        </>
      )}
    </form>
  );
}
