import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/db";
import { passwordErrorMessage, passwordProblem } from "@/lib/password";

export const dynamic = "force-dynamic";

function go(request: NextRequest, params: Record<string, string>, path = "/app/settings") {
  const url = new URL(path, request.url);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  if (path === "/app/settings") url.hash = "password";
  return NextResponse.redirect(url, { status: 303 });
}

/** A signed-in coordinator sets or changes their own password. Optional: the emailed link keeps working. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/app", request.url), { status: 303 });
  const form = await request.formData();
  const password = String(form.get("password") || "");
  const again = String(form.get("password_again") || "");
  // During first-time setup the form sends people on to the dashboard, and errors back to setup.
  const fromSetup = String(form.get("from") || "") === "setup";
  const problem = passwordProblem(password, again);
  if (problem) return fromSetup ? go(request, { error: problem }, "/app/setup") : go(request, { pwError: problem });

  const { error } = await session.supabase.auth.updateUser({ password, data: { has_password: true } });
  if (error) {
    const msg = passwordErrorMessage(error.message);
    return fromSetup ? go(request, { error: msg }, "/app/setup") : go(request, { pwError: msg });
  }
  return fromSetup ? go(request, {}, "/app/dashboard") : go(request, { pw: "1" });
}
