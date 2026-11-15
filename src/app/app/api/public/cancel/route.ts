import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deliver, loadParts } from "@/lib/emails/deliver";
import { clientIp, withinLimits } from "@/lib/rateLimit";
import { promoteShift } from "@/lib/waitlist";

export const dynamic = "force-dynamic";

/** Public: cancel a sign-up using the token from the confirmation. */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const cancelToken = String(form.get("cancel_token") || "");
  const admin = createAdminClient();
  if (!admin || !/^[a-f0-9]{16,64}$/i.test(cancelToken)) {
    return NextResponse.redirect(new URL("/", request.url), { status: 303 });
  }
  // Cancelling sends an email, so one connection can't do it without limit.
  if (!(await withinLimits([{ action: "change-ip", who: clientIp(request), max: 30, minutes: 10 }]))) {
    const wait = new URL(`/v/cancel/${cancelToken}`, request.url);
    wait.searchParams.set("error", "That's a lot of changes in a short time. Please wait a few minutes and try again.");
    return NextResponse.redirect(wait, { status: 303 });
  }
  const { data: before } = await admin.from("signups").select("id,shift_id,status").eq("cancel_token", cancelToken).maybeSingle();
  if (before && (before.status === "confirmed" || before.status === "waitlist")) {
    const { data: updated } = await admin.from("signups").update({ status: "cancelled" }).eq("id", before.id).eq("status", before.status).select("id").maybeSingle();
    if (updated && before.status === "confirmed") {
      const parts = await loadParts(admin, updated.id);
      if (parts) await deliver(admin, "cancelled", parts);
      await promoteShift(admin, before.shift_id as string);
    }
  }
  const mine = String(form.get("mine") || "");
  if (/^[a-f0-9]{16,64}$/i.test(mine)) {
    return NextResponse.redirect(new URL(`/v/mine/${mine}?cancelled=1`, request.url), { status: 303 });
  }
  return NextResponse.redirect(new URL(`/v/cancel/${cancelToken}?done=1`, request.url), { status: 303 });
}
