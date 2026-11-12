import { NextResponse, type NextRequest } from "next/server";
import { icsFor } from "@/lib/calendar";
import { loadSignupByCancelToken } from "@/lib/public";
import { siteUrl } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Public: the calendar file for one sign-up, reached with the sign-up's private link. */
export async function GET(_request: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const data = await loadSignupByCancelToken(token);
  if (!data || data.signup.status !== "confirmed") return new NextResponse("Not found", { status: 404 });
  return new NextResponse(icsFor({ ...data, siteUrl: siteUrl() }), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="volunteer-shift.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
