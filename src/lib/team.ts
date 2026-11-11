import type { SupabaseClient } from "@supabase/supabase-js";
import type { Organization, Session } from "@/lib/db";
import { normEmail } from "@/lib/emails/optout";
import { createAdminClient } from "@/lib/supabase/admin";

export type Member = { userId: string; email: string; role: string; joinedAt: string; you: boolean };
export type Invite = { id: string; email: string; invited_by: string | null; created_at: string };

export const MAX_PENDING_INVITES = 10;

/** Everyone who can sign in to this organization's workspace. */
export async function loadTeam(session: Session, org: Organization): Promise<Member[]> {
  const { data } = await session.supabase.from("memberships").select("user_id,role,created_at").eq("org_id", org.id).order("created_at");
  const rows = (data ?? []) as { user_id: string; role: string; created_at: string }[];
  const admin = createAdminClient();
  const out: Member[] = [];
  for (const r of rows) {
    let email = r.user_id === session.userId ? session.email : "";
    if (!email && admin) {
      try {
        const { data: u } = await admin.auth.admin.getUserById(r.user_id);
        email = u.user?.email ?? "";
      } catch {
        /* show a placeholder below */
      }
    }
    out.push({ userId: r.user_id, email: email || "Coordinator", role: r.role, joinedAt: r.created_at, you: r.user_id === session.userId });
  }
  // Before the v6 database setup a person can only see their own row; make sure they at least see themselves.
  if (!out.some((m) => m.you)) out.unshift({ userId: session.userId, email: session.email, role: "coordinator", joinedAt: new Date().toISOString(), you: true });
  return out;
}

export async function loadInvites(session: Session, org: Organization): Promise<Invite[]> {
  try {
    const { data, error } = await session.supabase.from("org_invites").select("id,email,invited_by,created_at").eq("org_id", org.id).order("created_at");
    return error ? [] : ((data ?? []) as Invite[]);
  } catch {
    return [];
  }
}

/** Does someone with this email already belong to a workspace? Unknown counts as no. */
export async function alreadyHasWorkspace(admin: SupabaseClient, email: string): Promise<boolean> {
  try {
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = (data?.users ?? []).find((u) => normEmail(u.email) === normEmail(email));
    if (!user) return false;
    const { data: m } = await admin.from("memberships").select("org_id").eq("user_id", user.id).limit(1);
    return Boolean(m && m.length > 0);
  } catch {
    return false;
  }
}

/**
 * A signed-in person with no workspace: if an organization invited their email
 * address, add them to it. Signing in with a link sent to that address is the
 * proof that the address is theirs. Returns the organization id, or null.
 */
export async function acceptInvite(userId: string, email: string): Promise<string | null> {
  const admin = createAdminClient();
  const address = normEmail(email);
  if (!admin || !address) return null;
  try {
    // Only an address the person has proved is theirs (by opening a link sent to it) can accept.
    const { data: u } = await admin.auth.admin.getUserById(userId);
    if (!u.user || !u.user.email_confirmed_at || normEmail(u.user.email) !== address) return null;
    const { data: inv, error } = await admin.from("org_invites").select("id,org_id").eq("email", address).order("created_at").limit(1);
    if (error || !inv || inv.length === 0) return null;
    const orgId = inv[0].org_id as string;
    const { error: addError } = await admin.from("memberships").upsert({ org_id: orgId, user_id: userId, role: "coordinator" }, { onConflict: "org_id,user_id", ignoreDuplicates: true });
    if (addError) return null;
    await admin.from("org_invites").delete().eq("org_id", orgId).eq("email", address);
    return orgId;
  } catch {
    return null;
  }
}
