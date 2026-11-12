import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/db";

export const dynamic = "force-dynamic";

function go(request: NextRequest, params: Record<string, string>) {
  const url = new URL("/app/settings", request.url);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.hash = "password";
  return NextResponse.redirect(url, { status: 303 });
}

/** A signed-in coordinator sets or changes their own password. Optional: the emailed link keeps working. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/app", request.url), { status: 303 });
  const form = await request.formData();
  const password = String(form.get("password") || "");
  const again = String(form.get("password_again") || "");
  if (password.length < 8) return go(request, { pwError: "Use at least 8 characters." });
  if (password.length > 72) return go(request, { pwError: "Keep it under 72 characters." });
  if (password !== again) return go(request, { pwError: "The two passwords don't match." });

  const { error } = await session.supabase.auth.updateUser({ password });
  if (error) {
    const msg = /different from the old/i.test(error.message)
      ? "That's already your password."
      : /reauth|recent/i.test(error.message)
        ? "For safety, sign out, sign back in with an emailed link, then set the password."
        : /weak|should contain|at least/i.test(error.message)
          ? "That password is too easy to guess. Try a longer one."
          : error.message;
    return go(request, { pwError: msg });
  }
  return go(request, { pw: "1" });
}
