import { NextResponse, type NextRequest } from "next/server";
import { getOrg, getSession } from "@/lib/db";
import { normEmail } from "@/lib/emails/optout";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadVolunteers } from "@/lib/volunteers";
import { promoteEvent } from "@/lib/waitlist";

export const dynamic = "force-dynamic";

function go(request: NextRequest, path: string, params: Record<string, string> = {}) {
  const url = new URL(path, request.url);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url, { status: 303 });
}

/**
 * Permanently delete one person's records from this organization: every
 * sign-up, with its check-in times, hours and message log. Used to honor a
 * deletion request. Runs as the signed-in coordinator, so the database only
 * lets it touch their own organization's rows.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return go(request, "/app");
  const org = await getOrg(session);
  if (!org) return go(request, "/app/setup");

  const form = await request.formData();
  const key = String(form.get("key") || "");
  const back = `/app/volunteers/delete?key=${encodeURIComponent(key)}`;
  if (form.get("confirm") !== "yes") return go(request, back, { error: "Tick the box to confirm." });

  const person = (await loadVolunteers(session, org)).find((v) => v.key === key);
  if (!person) return go(request, "/app/volunteers", { error: "That person's records are already gone." });

  for (let i = 0; i < person.signupIds.length; i += 100) {
    const { error } = await session.supabase.from("signups").delete().in("id", person.signupIds.slice(i, i + 100));
    if (error) return go(request, back, { error: `Couldn't delete: ${error.message}` });
  }

  // Forget their email preference too, unless the same address still has sign-ups
  // under another name (a parent with a second child, for example).
  const email = normEmail(person.email);
  const admin = createAdminClient();
  if (email && admin) {
    const others = (await loadVolunteers(session, org)).some((v) => normEmail(v.email) === email);
    if (!others) await admin.from("email_optouts").delete().eq("org_id", org.id).eq("email", email);
  }

  if (admin) for (const eventId of new Set(person.history.map((h) => h.eventId))) await promoteEvent(admin, eventId);

  return go(request, "/app/volunteers", { deleted: person.name, n: String(person.signupIds.length) });
}
