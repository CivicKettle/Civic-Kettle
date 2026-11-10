import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Landing-page "founding organization" form. Saves to the inquiries table. */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const go = (path: string) => NextResponse.redirect(new URL(path, request.url), { status: 303 });

  // Honeypot: bots fill every field.
  if (String(form.get("bot-field") || "")) return go("/thanks");

  const organization = String(form.get("organization") || "").trim();
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  if (!organization || !name || !email.includes("@")) return go("/#contact");

  const admin = createAdminClient();
  if (admin) {
    await admin.from("inquiries").insert({
      organization,
      name,
      email,
      org_type: String(form.get("org_type") || "") || null,
      volunteers: String(form.get("volunteers") || "") || null,
      current_process: String(form.get("current_process") || "").trim() || null,
      biggest_pain: String(form.get("biggest_pain") || "").trim() || null,
    });
  }
  return go("/thanks");
}
