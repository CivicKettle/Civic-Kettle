import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deliver, loadParts } from "@/lib/emails/deliver";

export const dynamic = "force-dynamic";

/** Public: cancel a sign-up using the token from the confirmation. */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const cancelToken = String(form.get("cancel_token") || "");
  const admin = createAdminClient();
  if (!admin || !/^[a-f0-9]{16,64}$/i.test(cancelToken)) {
    return NextResponse.redirect(new URL("/", request.url), { status: 303 });
  }
  const { data: updated } = await admin
    .from("signups")
    .update({ status: "cancelled" })
    .eq("cancel_token", cancelToken)
    .eq("status", "confirmed")
    .select("id")
    .maybeSingle();
  if (updated) {
    const parts = await loadParts(admin, updated.id);
    if (parts) await deliver(admin, "cancelled", parts);
  }
  const mine = String(form.get("mine") || "");
  if (/^[a-f0-9]{16,64}$/i.test(mine)) {
    return NextResponse.redirect(new URL(`/v/mine/${mine}?cancelled=1`, request.url), { status: 303 });
  }
  return NextResponse.redirect(new URL(`/v/cancel/${cancelToken}?done=1`, request.url), { status: 303 });
}
