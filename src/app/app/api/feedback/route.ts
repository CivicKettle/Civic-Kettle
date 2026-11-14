import { NextResponse, type NextRequest } from "next/server";
import { getOrg, getSession } from "@/lib/db";
import { notifyFeedback } from "@/lib/notify";
import { withinLimits } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

function go(request: NextRequest, params: Record<string, string>) {
  const url = new URL("/app/feedback", request.url);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url, { status: 303 });
}

/** A signed-in coordinator sends a note to CivicKettle. It is emailed, not stored. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/app", request.url), { status: 303 });
  const org = await getOrg(session);
  if (!org) return NextResponse.redirect(new URL("/app/setup", request.url), { status: 303 });

  const form = await request.formData();
  const message = String(form.get("message") || "").trim().slice(0, 4000);
  if (message.length < 3) return go(request, { error: "Write a few words first." });

  if (!(await withinLimits([{ action: "feedback", who: session.userId, max: 10, minutes: 60 }]))) {
    return go(request, { error: "That's a lot of notes in one hour. Please try again a little later." });
  }
  const ok = await notifyFeedback({ orgName: org.name, email: session.email, message });
  return ok ? go(request, { sent: "1" }) : go(request, { error: "That didn't send. Please try again, or email us directly." });
}
