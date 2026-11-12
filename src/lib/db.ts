import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  time_zone: string;
  contact_email: string | null;
  created_at?: string;
};

export type Event = {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  location: string | null;
  notes_for_volunteers: string | null;
  starts_at: string;
  ends_at: string;
  status: "draft" | "published" | "cancelled";
  public_token: string;
  summary_notes?: string | null;
  created_at: string;
};

export type Shift = {
  id: string;
  event_id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  sort_order: number;
};

export type Signup = {
  id: string;
  event_id: string;
  shift_id: string;
  volunteer_name: string;
  phone: string | null;
  email: string | null;
  is_minor: boolean;
  guardian_name: string | null;
  guardian_phone: string | null;
  status: "confirmed" | "cancelled" | "waitlist";
  cancel_token: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
  /** Coordinator's correction, in hours. Null means "use the check-in and check-out times". */
  hours_override?: number | null;
  hours_approved_at?: string | null;
  created_at: string;
};

export type Session = {
  supabase: SupabaseClient;
  userId: string;
  email: string;
};

/** The signed-in coordinator, or null (not configured / not signed in). */
export async function getSession(): Promise<Session | null> {
  try {
    const supabase = await createClient();
    if (!supabase) return null;
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    return { supabase, userId: data.user.id, email: data.user.email ?? "" };
  } catch {
    return null;
  }
}

/** The coordinator's organization (first membership), or null if they have none yet. */
export async function getOrg(session: Session): Promise<Organization | null> {
  const { data: m } = await session.supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  let orgId = (m?.org_id as string | undefined) ?? null;
  if (!orgId) {
    // No workspace yet: join the one that invited this email address, if any.
    const { acceptInvite } = await import("@/lib/team");
    orgId = await acceptInvite(session.userId, session.email);
  }
  if (!orgId) return null;
  const { data: org } = await session.supabase
    .from("organizations")
    .select("id,name,slug,time_zone,contact_email,created_at")
    .eq("id", orgId)
    .maybeSingle();
  return (org as Organization) ?? null;
}

/** "owner" for the person who created the workspace, "coordinator" for people they added. */
export async function getRole(session: Session, orgId: string): Promise<string> {
  const { data } = await session.supabase.from("memberships").select("role").eq("org_id", orgId).eq("user_id", session.userId).maybeSingle();
  return (data?.role as string | undefined) ?? "coordinator";
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "org";
}

/** US mobile number → "(949) 555-0100", or null if it isn't a 10-digit number. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits.startsWith("1"))
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return null;
}

export type ShiftWithCounts = Shift & { confirmed: number; open: number; waiting: number };

export function withCounts(shifts: Shift[], signups: Pick<Signup, "shift_id" | "status">[]): ShiftWithCounts[] {
  return shifts.map((s) => {
    const confirmed = signups.filter((x) => x.shift_id === s.id && x.status === "confirmed").length;
    const waiting = signups.filter((x) => x.shift_id === s.id && x.status === "waitlist").length;
    return { ...s, confirmed, open: Math.max(0, s.capacity - confirmed), waiting };
  });
}
