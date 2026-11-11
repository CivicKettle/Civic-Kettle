/**
 * Remembers which sign-ups were made on this phone, so that scanning the event
 * QR code on the day can greet the volunteer by name. The cookie holds the
 * sign-ups' private tokens; it is httpOnly and never rendered into a page.
 */
export const DEVICE_COOKIE = "ck_signups";
const MAX_TOKENS = 12;

export function parseTokens(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw.split(".").filter((t) => /^[a-f0-9]{16,64}$/i.test(t)).slice(-MAX_TOKENS);
}

export function addTokens(existing: string[], add: string[]): string {
  const merged = [...existing.filter((t) => !add.includes(t)), ...add];
  return merged.slice(-MAX_TOKENS).join(".");
}

export const deviceCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};
