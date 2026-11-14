import { NextResponse, type NextRequest } from "next/server";
import { runReminders } from "@/lib/emails/reminders";
import { clearOldAttempts } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Scheduled by vercel.json. Vercel sends Authorization: Bearer <CRON_SECRET>. */
export async function GET(request: NextRequest) {
  const secret = (process.env.CRON_SECRET || "").trim();
  const auth = request.headers.get("authorization") || "";
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  await clearOldAttempts();
  const result = await runReminders("day_before");
  return NextResponse.json(result);
}
