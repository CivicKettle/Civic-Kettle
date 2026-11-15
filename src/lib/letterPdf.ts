import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import { fmtLetterHours, prettyCode, type Letter } from "@/lib/letters";

type Head = { name: string; address?: string | null; phone?: string | null; email?: string | null; timeZone: string };

/** The built-in PDF fonts cover Western European letters only. Anything else becomes "?" instead of crashing the letter. */
function safe(s: string): string {
  return [...s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-")].map((ch) => (ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) <= 255 ? ch : "?")).join("");
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of safe(text).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > width && line) { out.push(line); line = word; } else line = next;
  }
  if (line) out.push(line);
  return out;
}

function clip(text: string, font: PDFFont, size: number, width: number): string {
  let t = safe(text);
  if (font.widthOfTextAtSize(t, size) <= width) return t;
  while (t.length > 1 && font.widthOfTextAtSize(`${t}...`, size) > width) t = t.slice(0, -1);
  return `${t}...`;
}

const day = (iso: string, tz: string) => new Date(iso).toLocaleDateString("en-US", { timeZone: tz, year: "numeric", month: "long", day: "numeric" });
const shortDay = (iso: string, tz: string) => new Date(iso).toLocaleDateString("en-US", { timeZone: tz, year: "numeric", month: "short", day: "numeric" });

/** A US Letter PDF of one approved hours letter, with the check link and QR code. */
export async function buildLetterPdf(letter: Letter, head: Head, verifyUrl: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(safe(`Volunteer hours: ${letter.volunteer_name}`));
  pdf.setAuthor(safe(head.name));
  pdf.setCreator("CivicKettle");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const ink = rgb(0.13, 0.16, 0.14);
  const soft = rgb(0.38, 0.42, 0.38);
  const green = rgb(0.17, 0.24, 0.19);
  const W = 612, H = 792, M = 64, inner = W - M * 2;
  const tz = head.timeZone;

  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;
  const text = (s: string, x: number, size: number, font: PDFFont = regular, color = ink) => page.drawText(safe(s), { x, y, size, font, color });

  // Letterhead
  text(head.name, M, 20, bold, green); y -= 18;
  for (const l of [head.address, [head.phone, head.email].filter(Boolean).join("  |  ")].filter(Boolean) as string[]) { text(clip(l, regular, 10, inner), M, 10, regular, soft); y -= 13; }
  y -= 4; page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1.5, color: green }); y -= 34;

  text(day(letter.decided_at || letter.requested_at, tz), M, 11, regular, soft); y -= 34;
  text("Verified volunteer hours", M, 24, serif); y -= 30;

  const total = Number(letter.total_hours ?? 0);
  const span = letter.first_date && letter.last_date
    ? (shortDay(letter.first_date, tz) === shortDay(letter.last_date, tz) ? `on ${day(letter.first_date, tz)}` : `between ${day(letter.first_date, tz)} and ${day(letter.last_date, tz)}`)
    : "";
  const body = `This letter confirms that ${letter.volunteer_name} volunteered with ${head.name} for a total of ${fmtLetterHours(total)} ${span}. Each shift below was recorded when the volunteer checked in and out at the event, and the hours were reviewed and approved by a coordinator.`;
  for (const l of wrap(body, regular, 12, inner)) { text(l, M, 12); y -= 17; }
  y -= 14;

  // Table of shifts
  const cols = { date: M, event: M + 92, shift: M + 300, hours: W - M };
  const header = () => {
    text("Date", cols.date, 9, bold, soft); text("Event", cols.event, 9, bold, soft); text("Shift", cols.shift, 9, bold, soft);
    page.drawText("Hours", { x: cols.hours - bold.widthOfTextAtSize("Hours", 9), y, size: 9, font: bold, color: soft });
    y -= 6; page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.75, color: soft }); y -= 15;
  };
  header();
  for (const line of letter.lines) {
    if (y < 215) { page = pdf.addPage([W, H]); y = H - M; header(); }
    text(shortDay(line.date, tz), cols.date, 10.5);
    text(clip(line.title, regular, 10.5, cols.shift - cols.event - 10), cols.event, 10.5);
    text(clip(line.shift, regular, 10.5, cols.hours - cols.shift - 44), cols.shift, 10.5);
    const h = String(line.hours);
    page.drawText(h, { x: cols.hours - regular.widthOfTextAtSize(h, 10.5), y, size: 10.5, font: regular, color: ink });
    y -= 16;
  }
  y += 5; page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.75, color: soft }); y -= 16;
  text("Total", cols.date, 11, bold);
  const t = String(total);
  page.drawText(t, { x: cols.hours - bold.widthOfTextAtSize(t, 11), y, size: 11, font: bold, color: ink });

  // Approval, optional ink signature, and the check block sit at the foot of the last page
  if (y < 250) { page = pdf.addPage([W, H]); }
  y = 214;
  text(`Approved by ${letter.signer_name || "a coordinator"}${letter.signer_title ? `, ${letter.signer_title}` : ""}`, M, 12, bold); y -= 16;
  text(`${head.name}, ${day(letter.decided_at || letter.requested_at, tz)}`, M, 11, regular, soft); y -= 34;
  page.drawLine({ start: { x: M, y }, end: { x: M + 230, y }, thickness: 0.75, color: soft }); y -= 12;
  text("Signature (optional)", M, 9, regular, soft);

  const qr = await pdf.embedPng(await QRCode.toBuffer(verifyUrl, { margin: 0, width: 300, errorCorrectionLevel: "M" }));
  const boxY = 54, boxH = 78;
  page.drawRectangle({ x: M, y: boxY, width: inner, height: boxH, borderColor: soft, borderWidth: 0.75 });
  page.drawImage(qr, { x: M + 10, y: boxY + 10, width: boxH - 20, height: boxH - 20 });
  const tx = M + boxH + 6;
  page.drawText("Check that this letter is real", { x: tx, y: boxY + boxH - 22, size: 11, font: bold, color: ink });
  page.drawText(safe(`Scan the code, or go to ${verifyUrl.replace(/^https?:\/\//, "")}`), { x: tx, y: boxY + boxH - 38, size: 10, font: regular, color: ink });
  page.drawText(safe(`Letter code ${prettyCode(letter.code || "")}. The page shows the same name, hours and dates.`), { x: tx, y: boxY + boxH - 53, size: 9.5, font: regular, color: soft });
  page.drawText("Hours recorded and issued through CivicKettle.", { x: tx, y: boxY + boxH - 67, size: 9, font: regular, color: soft });

  return pdf.save();
}
