import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Public: a volunteer says "Yes, I'll be there" from the day-before email.
 * A button press (POST), not a link, so an email scanner opening the link
 * can't confirm for someone.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const token = String(form.get("cancel_token") || "");
  const admin = createAdminClient();
  if (!admin || !/^[a-f0-9]{16,64}$/i.test(token)) return NextResponse.redirect(new URL("/", request.url), { status: 303 });

  const back = (flag: string) => NextResponse.redirect(new URL(`/v/confirm/${token}?${flag}=1`, request.url), { status: 303 });
  const { data: signup } = await admin.from("signups").select("id,status").eq("cancel_token", token).maybeSingle();
  if (!signup || signup.status !== "confirmed") return back("gone");
  const { error } = await admin.from("signups").update({ attending_confirmed_at: new Date().toISOString() }).eq("id", signup.id);
  return back(error ? "error" : "done");
}
