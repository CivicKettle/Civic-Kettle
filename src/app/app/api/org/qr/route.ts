import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";
import { getOrg, getSession } from "@/lib/db";
import { siteUrl } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * The QR code for the organization's page (every upcoming event). Shown on
 * the Events page, and downloaded as a print-quality PNG with ?download=1.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/app", request.url), { status: 303 });
  const org = await getOrg(session);
  if (!org) return NextResponse.redirect(new URL("/app/setup", request.url), { status: 303 });
  const download = request.nextUrl.searchParams.get("download") === "1";

  const png = await QRCode.toBuffer(`${siteUrl()}/o/${org.slug}`, {
    type: "png",
    width: download ? 1200 : 360,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#1f2a24", light: "#ffffff" },
  });
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      ...(download ? { "Content-Disposition": `attachment; filename="civickettle-qr-${org.slug}.png"` } : {}),
      "Cache-Control": "private, no-store",
    },
  });
}
