import { NextResponse, type NextRequest } from "next/server";
import { getOrg, getSession } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Coordinator cancels a volunteer's sign-up from the event page. */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/app", request.url), { status: 303 });
  const org = await getOrg(session);
  if (!org) return NextResponse.redirect(new URL("/app/setup", request.url), { status: 303 });

  const form = await request.formData();
  const eventId = String(form.get("event_id") || "");
  // RLS guarantees this only touches the coordinator's own org's sign-ups.
  await session.supabase.from("signups").update({ status: "cancelled" }).eq("id", id);
  return NextResponse.redirect(new URL(eventId ? `/app/events/${eventId}` : "/app/events", request.url), { status: 303 });
}
