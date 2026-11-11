import { NextResponse, type NextRequest } from "next/server";
import { setOptout } from "@/lib/emails/optout";
import { loadSignupByCancelToken } from "@/lib/public";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Following the link in a browser shows the confirmation page. Nothing changes on a GET. */
export async function GET(request: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  return NextResponse.redirect(new URL(`/u/${encodeURIComponent(token)}`, request.url), { status: 303 });
}

/**
 * Turns emails off (or back on) for the address behind this link.
 * Two callers: the button on /u/[token], and mail apps' one-click unsubscribe
 * (RFC 8058), which POST here with no page involved.
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  let viaPage = false;
  let turnOn = false;
  try {
    const form = await request.formData();
    viaPage = form.get("from") === "page";
    turnOn = form.get("intent") === "on";
  } catch {
    /* one-click requests may carry no readable body */
  }
  const back = (flag: string) => NextResponse.redirect(new URL(`/u/${encodeURIComponent(token)}?${flag}=1`, request.url), { status: 303 });

  const data = await loadSignupByCancelToken(token);
  const admin = createAdminClient();
  if (!data || !admin || !data.signup.email) {
    return viaPage ? NextResponse.redirect(new URL("/", request.url), { status: 303 }) : new NextResponse(null, { status: 404 });
  }
  const r = await setOptout(admin, data.event.org_id, data.signup.email, !turnOn);
  if (!r.ok) {
    console.error(`[unsubscribe] ${r.error}`);
    return viaPage ? back("error") : new NextResponse(null, { status: 500 });
  }
  return viaPage ? back(turnOn ? "on" : "done") : new NextResponse(null, { status: 200 });
}
