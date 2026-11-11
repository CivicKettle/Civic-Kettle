import { NextResponse, type NextRequest } from "next/server";
import { getOrg, getRole, getSession } from "@/lib/db";
import { normEmail } from "@/lib/emails/optout";
import { sendEmail } from "@/lib/emails/send";
import { buildInvite } from "@/lib/emails/templates";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/supabase/server";
import { alreadyHasWorkspace, loadInvites, loadTeam, MAX_PENDING_INVITES } from "@/lib/team";

export const dynamic = "force-dynamic";

function go(request: NextRequest, params: Record<string, string> = {}, path = "/app/settings") {
  const url = new URL(path, request.url);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url, { status: 303 });
}

const NEEDS_V6 = "Adding coordinators needs the latest database setup (v6). Run it in Supabase, then try again.";

/** The workspace owner adds or removes coordinators. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return go(request, {}, "/app");
  const org = await getOrg(session);
  if (!org) return go(request, {}, "/app/setup");
  const fail = (teamError: string) => go(request, { teamError });

  if ((await getRole(session, org.id)) !== "owner") return fail("Only the person who set up this workspace can change the team.");
  const admin = createAdminClient();
  if (!admin) return fail("This site isn't fully set up yet.");

  const form = await request.formData();
  const intent = String(form.get("intent") || "");

  if (intent === "invite") {
    const email = normEmail(String(form.get("email") || ""));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200) return fail("Enter a full email address.");
    const [team, invites] = await Promise.all([loadTeam(session, org), loadInvites(session, org)]);
    if (team.some((m) => normEmail(m.email) === email)) return fail("That person is already on the team.");
    if (invites.some((i) => normEmail(i.email) === email)) return fail("That person has already been invited. They join the next time they sign in.");
    if (invites.length >= MAX_PENDING_INVITES) return fail(`You have ${MAX_PENDING_INVITES} invitations waiting. Cancel one before adding another.`);
    if (await alreadyHasWorkspace(admin, email)) {
      return fail("That email address already has its own CivicKettle workspace, so it can't join yours. Ask them for a different address.");
    }

    const { error } = await admin.from("org_invites").upsert({ org_id: org.id, email, invited_by: session.email }, { onConflict: "org_id,email", ignoreDuplicates: true });
    if (error) return fail(/org_invites/.test(error.message) ? NEEDS_V6 : error.message);

    const msg = buildInvite({ orgName: org.name, invitedBy: session.email, email, siteUrl: siteUrl() });
    const sent = await sendEmail({ to: email, subject: msg.subject, html: msg.html, text: msg.text, replyTo: session.email });
    return go(request, sent.ok ? { invited: email } : { invited: email, noEmail: "1" });
  }

  if (intent === "cancel") {
    const id = String(form.get("id") || "");
    const { error } = await admin.from("org_invites").delete().eq("id", id).eq("org_id", org.id);
    return error ? fail(error.message) : go(request, { cancelled: "1" });
  }

  if (intent === "remove") {
    const userId = String(form.get("user_id") || "");
    if (userId === session.userId) return fail("You can't remove yourself.");
    const { data: target } = await admin.from("memberships").select("role").eq("org_id", org.id).eq("user_id", userId).maybeSingle();
    if (!target) return fail("That person isn't on the team.");
    if (target.role === "owner") return fail("The workspace owner can't be removed.");
    const { error } = await admin.from("memberships").delete().eq("org_id", org.id).eq("user_id", userId);
    return error ? fail(error.message) : go(request, { removed: "1" });
  }

  return go(request);
}
