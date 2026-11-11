import { NextResponse, type NextRequest } from "next/server";
import { getOrg, getSession } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Coordinator approves hours (one or many), undoes an approval, or corrects one entry. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  const to = (path: string, error?: string) => {
    const url = new URL(path, request.url);
    if (error) url.searchParams.set("error", error);
    return NextResponse.redirect(url, { status: 303 });
  };
  if (!session) return to("/app");
  const org = await getOrg(session);
  if (!org) return to("/app/setup");

  const form = await request.formData();
  const intent = String(form.get("intent") || "");
  const rawBack = String(form.get("back") || "/app/hours");
  const back = rawBack.startsWith("/app/") && !rawBack.startsWith("//") ? rawBack : "/app/hours";
  const ids = form.getAll("id").map(String).filter((x) => /^[0-9a-f-]{36}$/i.test(x)).slice(0, 2000);
  if (ids.length === 0) return to(back);

  // Row-level security limits every update to the coordinator's own organization.
  let error: string | undefined;
  if (intent === "approve") {
    const r = await session.supabase.from("signups").update({ hours_approved_at: new Date().toISOString() }).in("id", ids).not("checked_in_at", "is", null);
    error = r.error?.message;
  } else if (intent === "unapprove") {
    const r = await session.supabase.from("signups").update({ hours_approved_at: null }).in("id", ids);
    error = r.error?.message;
  } else if (intent === "edit") {
    const raw = String(form.get("hours") || "").trim();
    let value: number | null = null;
    if (raw !== "") {
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0 || n > 24) return to(back, "Hours should be a number between 0 and 24.");
      value = Math.round(n * 100) / 100;
    }
    const r = await session.supabase.from("signups").update({ hours_override: value }).eq("id", ids[0]);
    error = r.error?.message;
  }
  if (error && /hours_(override|approved_at)/.test(error)) error = "Hours approval needs the latest database setup (v4). Run it in Supabase, then try again.";
  return to(back, error);
}
