import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from "@/lib/supabase/server";

/**
 * Supabase sends the sign-in link here with a one-time code.
 * We exchange it for a session cookie, then send the coordinator to the dashboard.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  // Only a path inside the workspace is accepted, so a crafted link can't
  // bounce a coordinator to another website after signing in.
  const wanted = url.searchParams.get("next") || "";
  const next = /^\/app(\/[A-Za-z0-9\-_/]*)?(\?[A-Za-z0-9\-_=&%.]*)?$/.test(wanted) ? wanted : "/app/dashboard";
  const failure = NextResponse.redirect(new URL("/app?error=link", url.origin));

  if (!code || !isSupabaseConfigured()) return failure;

  const response = NextResponse.redirect(new URL(next, url.origin));
  const supabase = createServerClient(
    supabaseUrl(),
    supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return error ? failure : response;
}
