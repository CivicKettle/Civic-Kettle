import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Trim, strip quotes, and add https:// if the dashboard value was pasted without it. */
export function supabaseUrl(): string {
  let raw = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/^["']|["']$/g, "");
  if (raw && !/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  return raw.replace(/\/$/, "");
}

export function supabaseAnonKey(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim().replace(/^["']|["']$/g, "");
}

export function isSupabaseConfigured(): boolean {
  const url = supabaseUrl();
  return Boolean(url && /^https?:\/\/[^\s/]+\.[^\s/]+/.test(url) && supabaseAnonKey());
}

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL || // set by Netlify
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

/**
 * Supabase client bound to the current request's cookies.
 * Returns null when the project isn't configured yet, so the rest of the
 * app can render a "setup pending" state instead of crashing.
 */
export async function createClient() {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component: cookies are read-only there.
            // The proxy/route handler refreshes the session instead.
          }
        },
      },
    },
  );
}
