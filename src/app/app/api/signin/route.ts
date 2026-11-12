import { NextResponse, type NextRequest } from "next/server";
import { createClient, siteUrl } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let email = "";
  try {
    const body = (await request.json()) as { email?: string };
    email = String(body.email || "").trim().toLowerCase();
  } catch {
    email = "";
  }
  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { status: "error", message: "Enter the email you use for your organization." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({
        status: "unconfigured",
        email,
        message: "Sign-in isn't switched on yet. The database connection is still being set up.",
      });
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl()}/app/auth/callback` },
    });
    if (error) {
      // Say what to do, not what the mail system called it.
      const message = /security purposes|only request this after/i.test(error.message)
        ? "You just asked for a link. Check your email, or wait a minute and try again."
        : /rate limit/i.test(error.message)
          ? "Too many sign-in emails just went out. Wait a few minutes and try again."
          : error.message;
      return NextResponse.json({ status: "error", email, message }, { status: 400 });
    }
    return NextResponse.json({ status: "sent", email });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong sending the link.";
    return NextResponse.json({ status: "error", email, message }, { status: 500 });
  }
}
