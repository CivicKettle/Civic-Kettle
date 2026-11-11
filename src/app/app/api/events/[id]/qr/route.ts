import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";
import { getOrg, getSession, slugify } from "@/lib/db";
import { siteUrl } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Coordinator downloads the event's QR code as a print-quality PNG. */
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/app", request.url), { status: 303 });
  const org = await getOrg(session);
  if (!org) return NextResponse.redirect(new URL("/app/setup", request.url), { status: 303 });

  const { data: ev } = await session.supabase
    .from("events")
    .select("title,public_token")
    .eq("id", id)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!ev) return new NextResponse("Not found", { status: 404 });

  const png = await QRCode.toBuffer(`${siteUrl()}/v/${ev.public_token}`, {
    type: "png",
    width: 1200,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#1f2a24", light: "#ffffff" },
  });
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="civickettle-qr-${slugify(ev.title)}.png"`,
      "Cache-Control": "private, no-store",
    },
  });
}
