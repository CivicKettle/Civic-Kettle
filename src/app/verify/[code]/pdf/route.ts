import { NextResponse, type NextRequest } from "next/server";
import { buildLetterPdf } from "@/lib/letterPdf";
import { cleanCode, LETTER_COLUMNS, type Letter } from "@/lib/letters";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Public: the PDF of an approved hours letter. A cancelled or unknown code gets nothing. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = cleanCode(raw);
  const admin = createAdminClient();
  if (!code || !admin) return new NextResponse("Not found", { status: 404 });
  const { data } = await admin.from("hours_letters").select(LETTER_COLUMNS).eq("code", code).eq("status", "approved").maybeSingle();
  const letter = data as Letter | null;
  if (!letter) return new NextResponse("Not found", { status: 404 });
  const { data: org } = await admin.from("organizations").select("*").eq("id", letter.org_id).maybeSingle();
  if (!org) return new NextResponse("Not found", { status: 404 });

  const bytes = await buildLetterPdf(
    letter,
    { name: org.name, address: org.letter_address ?? null, phone: org.letter_phone ?? null, email: org.contact_email ?? null, timeZone: org.time_zone },
    `${siteUrl()}/verify/${code}`,
  );
  const file = `hours-letter-${letter.volunteer_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "volunteer"}.pdf`;
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${file}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
