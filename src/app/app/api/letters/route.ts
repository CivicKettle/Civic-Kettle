import { NextResponse, type NextRequest } from "next/server";
import { getOrg, getSession } from "@/lib/db";
import { buildLetterDeclined, buildLetterReady } from "@/lib/emails/templates";
import { sendEmail } from "@/lib/emails/send";
import { approvedLines, fmtLetterHours, LETTER_COLUMNS, newLetterCode, type Letter } from "@/lib/letters";
import { siteUrl } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function back(request: NextRequest, params: Record<string, string>) {
  const url = new URL("/app/hours/letters", request.url);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url, { status: 303 });
}

/** Coordinator: approve, decline or cancel an hours letter. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/app", request.url), { status: 303 });
  const org = await getOrg(session);
  if (!org || !session.hasPassword) return NextResponse.redirect(new URL("/app/setup", request.url), { status: 303 });

  const form = await request.formData();
  const intent = String(form.get("intent") || "");
  const id = String(form.get("id") || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return back(request, { error: "That request wasn't found." });

  const { data, error: loadError } = await session.supabase.from("hours_letters").select(LETTER_COLUMNS).eq("id", id).eq("org_id", org.id).maybeSingle();
  if (loadError) return back(request, { error: "Hours letters need database step 12 to be run in Supabase." });
  const letter = data as Letter | null;
  if (!letter) return back(request, { error: "That request wasn't found." });
  const site = siteUrl();
  const now = new Date().toISOString();

  if (intent === "approve") {
    if (letter.status !== "requested") return back(request, { error: "That request was already handled." });
    const signer = (org.signer_name || "").trim();
    if (!signer) return back(request, { error: "Add the name that approves letters in Settings first, then come back." });
    const { lines, total } = await approvedLines(session.supabase, org.id, letter.volunteer_name, letter.volunteer_email);
    if (total <= 0) return back(request, { error: `${letter.volunteer_name} has no approved hours yet. Approve their hours on the Hours page first.` });

    let code = "";
    for (let attempt = 0; attempt < 4; attempt++) {
      code = newLetterCode();
      const { error } = await session.supabase
        .from("hours_letters")
        .update({ status: "approved", code, decided_at: now, decided_by: session.userId, signer_name: signer, signer_title: (org.signer_title || "").trim() || null, total_hours: total, first_date: lines[0].date, last_date: lines[lines.length - 1].date, lines })
        .eq("id", letter.id)
        .eq("status", "requested");
      if (!error) break;
      if (!/duplicate|unique/i.test(error.message) || attempt === 3) return back(request, { error: "That couldn't be saved. Please try again." });
    }
    const msg = buildLetterReady({ orgName: org.name, name: letter.volunteer_name, hours: fmtLetterHours(total), url: `${site}/verify/${code}`, siteUrl: site });
    const sent = await sendEmail({ to: letter.volunteer_email, subject: msg.subject, html: msg.html, text: msg.text, replyTo: org.contact_email });
    if (!sent.ok) console.error(`[email] hours letter failed: ${sent.error}`);
    return back(request, sent.ok ? { ok: `Approved. The letter was emailed to ${letter.volunteer_email}.` } : { ok: "Approved.", error: "The email didn't go out, so send them the letter's link yourself. It is in the list below." });
  }

  if (intent === "decline") {
    if (letter.status !== "requested") return back(request, { error: "That request was already handled." });
    const { error } = await session.supabase.from("hours_letters").update({ status: "declined", decided_at: now, decided_by: session.userId }).eq("id", letter.id).eq("status", "requested");
    if (error) return back(request, { error: "That couldn't be saved. Please try again." });
    const msg = buildLetterDeclined({ orgName: org.name, name: letter.volunteer_name, contactEmail: org.contact_email, siteUrl: site });
    const sent = await sendEmail({ to: letter.volunteer_email, subject: msg.subject, html: msg.html, text: msg.text, replyTo: org.contact_email });
    if (!sent.ok) console.error(`[email] letter decline failed: ${sent.error}`);
    return back(request, { ok: "Declined. They were told by email." });
  }

  if (intent === "cancel") {
    if (letter.status !== "approved") return back(request, { error: "Only an issued letter can be cancelled." });
    const { error } = await session.supabase.from("hours_letters").update({ status: "cancelled", decided_at: now, decided_by: session.userId }).eq("id", letter.id).eq("status", "approved");
    if (error) return back(request, { error: "That couldn't be saved. Please try again." });
    return back(request, { ok: "Cancelled. Anyone who checks that letter's code will now see it is no longer valid." });
  }

  return back(request, {});
}
