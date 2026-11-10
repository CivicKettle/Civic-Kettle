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
  const allFull = !firstOpen;

  return (
    <form action="/app/api/public/signup" method="post" className="pv-form">
      <input type="hidden" name="token" value={token} />

      <fieldset className="pv-card pv-shifts">
        <legend>Pick a shift</legend>
        {shifts.map((s) => {
          const full = s.open === 0;
          return (
            <label key={s.id} className={`pv-opt${full ? " full" : ""}`}>
              <input type="radio" name="shift_id" value={s.id} disabled={full} checked={shift === s.id} onChange={() => setShift(s.id)} required />
              <span className="t"><b>{s.name}</b><span>{fmt(s.starts_at, tz)} to {fmt(s.ends_at, tz)}</span></span>
              <span className={`n${!full && s.open <= 2 ? " low" : ""}`}>{full ? "Full" : `${s.open} spot${s.open === 1 ? "" : "s"} left`}</span>
            </label>
          );
        })}
        {allFull && <p className="pv-muted">Every shift is full. Check back; spots open when someone cancels.</p>}
      </fieldset>

      {!allFull && (
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
                <p className="pv-note">A parent or guardian signs up a volunteer under 18. Confirmations and reminders go to the guardian. For volunteers under 13, please enter the guardian&apos;s details in both sections.</p>
              )}
              <label>{adult === "no" ? "Volunteer's name" : "Your name"}<input name="volunteer_name" type="text" required maxLength={80} autoComplete="name" placeholder="First and last" /></label>
              {adult === "yes" ? (
                <>
                  <label>Mobile number<input name="phone" type="tel" required autoComplete="tel" inputMode="tel" pattern="[0-9()+\-. ]{10,20}" title="10-digit phone number" placeholder="949 555 0100" /></label>
                  <label>Email <span>Optional</span><input name="email" type="email" autoComplete="email" /></label>
                </>
              ) : (
                <>
                  <label>Volunteer&apos;s mobile <span>Optional, 13 and older</span><input name="phone" type="tel" autoComplete="off" inputMode="tel" pattern="[0-9()+\-. ]{10,20}" title="10-digit phone number" placeholder="949 555 0100" /></label>
                  <label>Parent or guardian name<input name="guardian_name" type="text" required maxLength={80} /></label>
                  <label>Parent or guardian mobile<input name="guardian_phone" type="tel" required inputMode="tel" pattern="[0-9()+\-. ]{10,20}" title="10-digit phone number" placeholder="949 555 0100, confirmations go here" /></label>
                  <label>Parent or guardian email <span>Optional</span><input name="email" type="email" /></label>
                  <label className="pv-check"><input type="checkbox" name="guardian_consent" value="yes" required /> I am this volunteer&apos;s parent or guardian and I consent to this sign-up.</label>
                </>
              )}
              {error && <p className="pv-error">{decodeURIComponent(error)}</p>}
              <button className="pv-button" type="submit">Sign me up <span aria-hidden="true">↗</span></button>
              <p className="pv-fine">You&apos;ll get a confirmation with a link to cancel if plans change. No account needed.</p>
            </div>
          )}
        </>
      )}
    </form>
  );
}
