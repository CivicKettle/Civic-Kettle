import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TYPES = ["email", "magiclink", "signup"] as const;
type LinkType = (typeof TYPES)[number];

/**
 * Finishes an emailed sign-in link. The link carries a one-time token that is
 * checked here on the server, so it works in any browser or device, not only
 * the one that asked for it. It is a button press (POST) so that an email
 * scanner merely opening the link can't use it up.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const tokenHash = String(form.get("token_hash") || "");
  const type = String(form.get("type") || "") as LinkType;
  const failure = NextResponse.redirect(new URL("/app?error=link", request.url), { status: 303 });
  if (!tokenHash || tokenHash.length > 300 || !TYPES.includes(type)) return failure;

  const supabase = await createClient();
  if (!supabase) return failure;
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) return failure;
  return NextResponse.redirect(new URL("/app/dashboard", request.url), { status: 303 });
}
