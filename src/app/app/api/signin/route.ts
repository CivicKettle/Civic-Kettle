import { NextResponse, type NextRequest } from "next/server";
import { createClient, siteUrl } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let email = "";
  let password = "";
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    email = String(body.email || "").trim().toLowerCase();
    password = String(body.password || "");
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
    if (password) {
      // Optional password, set in Settings. The cookies for the session are written by the client above.
      const { error: pwError } = await supabase.auth.signInWithPassword({ email, password });
      if (pwError) {
        const message = /invalid login/i.test(pwError.message)
          ? "That email and password don't match. If you haven't set a password, use the emailed link."
          : /rate limit|too many/i.test(pwError.message)
            ? "Too many tries. Wait a few minutes, or use the emailed link."
            : pwError.message;
        return NextResponse.json({ status: "error", email, message }, { status: 400 });
      }
      return NextResponse.json({ status: "signed_in", email });
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
