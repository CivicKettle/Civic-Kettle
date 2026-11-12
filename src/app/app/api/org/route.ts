import { NextResponse, type NextRequest } from "next/server";
import { getOrg, getSession, slugify } from "@/lib/db";
import { TIME_ZONES } from "@/lib/time";
import { passwordProblem, saveFirstPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

function back(request: NextRequest, path: string, error?: string) {
  const url = new URL(path, request.url);
  if (error) url.searchParams.set("error", error);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return back(request, "/app");

  const form = await request.formData();
  const intent = String(form.get("intent") || "");
  const name = String(form.get("name") || "").trim();
  const tz = String(form.get("time_zone") || "America/Los_Angeles");
  const timeZone = TIME_ZONES.includes(tz) ? tz : "America/Los_Angeles";

  if (intent === "create") {
    if (name.length < 2) return back(request, "/app/setup", "Give the organization a name.");
    const existing = await getOrg(session);
    if (existing) return back(request, "/app/dashboard");

    // A new account chooses its password here, before the workspace is made.
    if (!session.hasPassword) {
      const password = String(form.get("password") || "");
      const problem = passwordProblem(password, String(form.get("password_again") || ""));
      if (problem) return back(request, "/app/setup", problem);
      const pwError = await saveFirstPassword(session.supabase, password);
      if (pwError) return back(request, "/app/setup", pwError);
    }

    const base = slugify(name);
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
      const { error } = await session.supabase.rpc("create_organization", {
        p_name: name,
        p_slug: slug,
        p_time_zone: timeZone,
      });
      if (!error) return back(request, "/app/dashboard");
      if (!/duplicate|unique/i.test(error.message)) {
        return back(request, "/app/setup", error.message);
      }
    }
    return back(request, "/app/setup", "Couldn't pick a unique address for that name. Try a slightly different name.");
  }

  if (intent === "update") {
    const org = await getOrg(session);
    if (!org) return back(request, "/app/setup");
    const contactEmail = String(form.get("contact_email") || "").trim() || null;
    if (name.length < 2) return back(request, "/app/settings", "Give the organization a name.");
    const { error } = await session.supabase
      .from("organizations")
      .update({ name, time_zone: timeZone, contact_email: contactEmail })
      .eq("id", org.id);
    return back(request, "/app/settings", error ? error.message : undefined);
  }

  return back(request, "/app/dashboard");
}
