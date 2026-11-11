import { Resend } from "resend";

export function isEmailConfigured(): boolean {
  return Boolean((process.env.RESEND_API_KEY || "").trim());
}

/**
 * Sender address. Until civickettle.com is verified in Resend, Resend's test
 * sender is used, which can only deliver to the account owner's own inbox.
 */
export function fromAddress(): string {
  const from = (process.env.EMAIL_FROM || "").trim();
  return from || "CivicKettle <onboarding@resend.dev>";
}

export type SendResult = { ok: true; id: string | null } | { ok: false; error: string };

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string | null;
  headers?: Record<string, string>;
}): Promise<SendResult> {
  if (!isEmailConfigured()) return { ok: false, error: "Email isn't configured (RESEND_API_KEY missing)." };
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!.trim());
    const { data, error } = await resend.emails.send({
      from: fromAddress(),
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      replyTo: opts.replyTo || undefined,
      headers: opts.headers,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id ?? null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown email error" };
  }
}

export type BatchEmail = { to: string; subject: string; html: string; text: string; replyTo?: string | null; headers?: Record<string, string> };

/**
 * Send many emails in as few requests as possible (100 per request).
 * `key` makes a retry of the same send safe: the provider drops repeats for 24 hours.
 */
export async function sendBatch(emails: BatchEmail[], key: string): Promise<{ sent: number; failed: number; error?: string }> {
  if (!isEmailConfigured()) return { sent: 0, failed: emails.length, error: "Email isn't configured (RESEND_API_KEY missing)." };
  const resend = new Resend(process.env.RESEND_API_KEY!.trim());
  const from = fromAddress();
  let sent = 0;
  let failed = 0;
  let firstError: string | undefined;
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100);
    try {
      const { data, error } = await resend.batch.send(
        chunk.map((e) => ({ from, to: e.to, subject: e.subject, html: e.html, text: e.text, replyTo: e.replyTo || undefined, headers: e.headers })),
        { idempotencyKey: `${key}-${i / 100}`, batchValidation: "permissive" },
      );
      if (error) {
        failed += chunk.length;
        firstError ??= error.message;
        continue;
      }
      const bad = ((data as unknown as { errors?: { index: number; message: string }[] } | null)?.errors ?? []).length;
      failed += bad;
      sent += chunk.length - bad;
      if (bad) firstError ??= "Some addresses were rejected.";
    } catch (err) {
      failed += chunk.length;
      firstError ??= err instanceof Error ? err.message : "Unknown email error";
    }
  }
  return { sent, failed, error: firstError };
}
