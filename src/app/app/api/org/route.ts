import { NextResponse, type NextRequest } from "next/server";
import { getOrg, getSession, slugify } from "@/lib/db";
import { TIME_ZONES } from "@/lib/time";
import { notifyNewOrg } from "@/lib/notify";
import { passwordProblem, saveFirstPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

function back(request: NextRequest, path: string, error?: string, at?: string) {
  const url = new URL(path, request.url);
  if (error) url.searchParams.set("error", error);
  if (at) { url.searchParams.set("at", at); url.hash = at; }
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
    if (name.length > 80) return back(request, "/app/setup", "That name is too long. Use 80 characters or fewer.");
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
      if (!error) {
        await notifyNewOrg({ name, timeZone }, session.email);
        return back(request, "/app/dashboard");
      }
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
    if (name.length > 80) return back(request, "/app/settings", "That name is too long. Use 80 characters or fewer.");
    if (contactEmail && (contactEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))) {
      return back(request, "/app/settings", "That contact email doesn't look right.");
    }
    const { error } = await session.supabase
      .from("organizations")
      .update({ name, time_zone: timeZone, contact_email: contactEmail })
      .eq("id", org.id);
    return back(request, "/app/settings", error ? error.message : undefined);
  }

  if (intent === "value") {
    const org = await getOrg(session);
    if (!org) return back(request, "/app/setup");
    const raw = String(form.get("hour_value") || "").replace(/[$,\s]/g, "");
    const value = Math.round(Number(raw) * 100) / 100;
    if (!raw || !Number.isFinite(value) || value < 0 || value > 500) {
      return back(request, "/app/settings", "Enter a dollar amount between 0 and 500, like 41.75.", "value");
    }
    const { error } = await session.supabase.from("organizations").update({ hour_value: value }).eq("id", org.id);
    return back(request, "/app/settings", error ? "That couldn't be saved yet. This setting needs database step 11 to be run in Supabase." : undefined, "value");
  }

  return back(request, "/app/dashboard");
}
