import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./server";

/**
 * Server-only client using the secret key. Bypasses row-level security, so it is
 * used ONLY for the public volunteer flows (sign-up, cancel, check-in), where there
 * is no signed-in user. Never import this from a client component.
 */
export function secretKey(): string {
  return (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

export function isAdminConfigured(): boolean {
  return Boolean(supabaseUrl() && secretKey());
}

export function createAdminClient(): SupabaseClient | null {
  if (!isAdminConfigured()) return null;
  return createSupabaseClient(supabaseUrl(), secretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
