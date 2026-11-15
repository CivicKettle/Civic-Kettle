import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  time_zone: string;
  contact_email: string | null;
  created_at?: string;
  /** Settings from database step 11. Undefined until that step has been run. */
  hour_value?: number | null;
  level_bronze?: number | null;
  level_silver?: number | null;
  level_gold?: number | null;
  letter_address?: string | null;
  letter_phone?: string | null;
  signer_name?: string | null;
  signer_title?: string | null;
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
  /** Which automatic reminders go out. Missing means on. */
  remind_day_before?: boolean;
  remind_morning_of?: boolean;
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
  /** When the volunteer tapped "Yes, I'll be there" in the day-before email. */
  attending_confirmed_at?: string | null;
  /** Coordinator's correction, in hours. Null means "use the check-in and check-out times". */
  hours_override?: number | null;
  hours_approved_at?: string | null;
  created_at: string;
};

export type Session = {
  supabase: SupabaseClient;
  userId: string;
  email: string;
  /** Every coordinator account needs a password. False until they create one. */
  hasPassword: boolean;
};

/** The signed-in coordinator, or null (not configured / not signed in). */
export async function getSession(): Promise<Session | null> {
  try {
    const supabase = await createClient();
    if (!supabase) return null;
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    // The note on the account says a password was chosen, but the account's
    // owner can edit that note. So when it says yes, the database confirms it
    // from the password record itself. If that check isn't installed yet
    // (database step 10), the note is used as before.
    let hasPassword = (data.user.user_metadata as { has_password?: boolean } | null)?.has_password === true;
    if (hasPassword) {
      const { data: confirmed, error } = await supabase.rpc("has_password");
      if (!error && confirmed === false) hasPassword = false;
    }
    return { supabase, userId: data.user.id, email: data.user.email ?? "", hasPassword };
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
  const base = "id,name,slug,time_zone,contact_email,created_at";
  const full = await session.supabase
    .from("organizations")
    .select(`${base},hour_value,level_bronze,level_silver,level_gold,letter_address,letter_phone,signer_name,signer_title`)
    .eq("id", orgId)
    .maybeSingle();
  if (!full.error) return (full.data as Organization) ?? null;
  // Database step 11 hasn't been run yet: carry on with the built-in defaults.
  const { data: org } = await session.supabase.from("organizations").select(base).eq("id", orgId).maybeSingle();
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
