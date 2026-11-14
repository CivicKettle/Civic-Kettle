// Product analytics (PostHog). Off unless NEXT_PUBLIC_POSTHOG_KEY is set.
//
// What it records: page visits on the public site and in the coordinator
// workspace, plus one "started a trial" event. Nothing is recorded on
// volunteer pages, and clicks, typed text, page-speed measurements and screen
// recordings are off, so
// volunteers' names and contact details never reach it. No cookies: the
// visitor id lives in the tab's session storage and is gone when it closes.
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const volunteerPage = /^\/(v|o|u)(\/|$)/.test(window.location.pathname);

if (key && !volunteerPage) {
  void import("posthog-js").then(({ default: posthog }) => {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      defaults: "2026-01-30",
      persistence: "sessionStorage",
      person_profiles: "identified_only",
      autocapture: false,
      // Page visits only: no page-speed measurements either.
      capture_performance: false,
      disable_session_recording: true,
      disable_surveys: true,
    });
  });
}
