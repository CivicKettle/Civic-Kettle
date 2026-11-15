import { after, NextResponse, type NextRequest } from "next/server";
import { buildLetterAsk } from "@/lib/emails/templates";
import { sendEmail } from "@/lib/emails/send";
import { approvedLines, fmtLetterHours } from "@/lib/letters";
import { loadSignupByCancelToken } from "@/lib/public";
import { clientIp, withinLimits } from "@/lib/rateLimit";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Public: a volunteer asks for a verified hours letter. Nothing is issued until a coordinator approves it. */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const token = String(form.get("token") || "");
  const name = String(form.get("name") || "").trim();
  if (!/^[a-f0-9]{16,64}$/i.test(token)) return NextResponse.redirect(new URL("/", request.url), { status: 303 });
  const back = (key: "letter" | "error", value: string) => {
    const url = new URL(`/v/mine/${token}`, request.url);
    url.searchParams.set(key, value);
    url.hash = "letters";
    return NextResponse.redirect(url, { status: 303 });
  };
  if (!name || name.length > 80) return back("error", "Pick whose letter you want.");

  const admin = createAdminClient();
  const base = await loadSignupByCancelToken(token);
  const email = (base?.signup.email || "").trim().toLowerCase();
  if (!admin || !base || !email) return back("error", "That link no longer works. Open the newest email from the organization and try again.");
  const orgId = base.event.org_id as string;

  const allowed = await withinLimits([
    { action: "letter-ip", who: clientIp(request), max: 10, minutes: 60 },
    { action: "letter-email", who: `${orgId}|${email}`, max: 8, minutes: 24 * 60 },
  ]);
  if (!allowed) return back("error", "You have asked a few times already. The coordinator has your request.");

  const { total } = await approvedLines(admin, orgId, name, email);
  if (total <= 0) return back("error", "There are no approved hours for that name yet. Hours appear once the coordinator approves them.");

  const { data: open, error: lookError } = await admin.from("hours_letters").select("id").eq("org_id", orgId).eq("status", "requested").eq("volunteer_email", email).ilike("volunteer_name", name).limit(1);
  if (lookError) return back("error", "Hours letters aren't switched on for this organization yet.");
  if (open && open.length > 0) return back("letter", "already");

  const { error } = await admin.from("hours_letters").insert({ org_id: orgId, volunteer_name: name, volunteer_email: email });
  if (error && !/duplicate|unique/i.test(error.message)) return back("error", "That couldn't be sent. Please try again in a minute.");

  after(async () => {
    try {
      const { data: org } = await admin.from("organizations").select("name,contact_email").eq("id", orgId).maybeSingle();
      if (!org?.contact_email) return;
      const base = siteUrl();
      const msg = buildLetterAsk({ orgName: org.name, name, hours: fmtLetterHours(total), url: `${base}/app/hours/letters`, siteUrl: base });
      const result = await sendEmail({ to: org.contact_email, subject: msg.subject, html: msg.html, text: msg.text });
      if (!result.ok) console.error(`[email] letter request notice failed: ${result.error}`);
    } catch (err) {
      console.error("[letter] notice failed", err);
    }
  });

  return back("letter", "asked");
}
