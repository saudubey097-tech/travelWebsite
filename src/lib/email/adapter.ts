import "server-only";

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailSendResult {
  ok: boolean;
  provider: "resend" | "console" | "test";
  providerMessageId?: string;
  error?: string;
}

export interface EmailAdapter {
  send(email: OutgoingEmail): Promise<EmailSendResult>;
}

/**
 * Dev-safe default: logs the email instead of sending it. This is what
 * runs whenever RESEND_API_KEY/EMAIL_FROM aren't configured, so every
 * verification/invitation/reset flow in PR1 works end-to-end locally
 * without needing a live Resend account — exactly what was asked for
 * ("don't require live email/MFA provider configuration yet").
 */
class ConsoleEmailAdapter implements EmailAdapter {
  async send(email: OutgoingEmail): Promise<EmailSendResult> {
    console.log(
      `\n[email:console-adapter] → ${email.to}\nSubject: ${email.subject}\n${"-".repeat(40)}\n${email.text}\n${"-".repeat(40)}\n`
    );
    return { ok: true, provider: "console" };
  }
}

class UnconfiguredEmailAdapter implements EmailAdapter {
  async send(): Promise<EmailSendResult> {
    return {
      ok: false,
      provider: "console",
      error: "Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.",
    };
  }
}

/** Captures emails in memory instead of sending or logging — used by tests. */
class TestEmailAdapter implements EmailAdapter {
  sent: OutgoingEmail[] = [];
  async send(email: OutgoingEmail): Promise<EmailSendResult> {
    this.sent.push(email);
    return { ok: true, provider: "test" };
  }
}

class ResendEmailAdapter implements EmailAdapter {
  constructor(private apiKey: string, private from: string) {}

  async send(email: OutgoingEmail): Promise<EmailSendResult> {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(this.apiKey);
      const result = await resend.emails.send({
        from: this.from,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });
      if (result.error) {
        return { ok: false, provider: "resend", error: result.error.message };
      }
      return { ok: true, provider: "resend", providerMessageId: result.data?.id };
    } catch (err) {
      return { ok: false, provider: "resend", error: err instanceof Error ? err.message : "Unknown error" };
    }
  }
}

let testAdapterInstance: TestEmailAdapter | null = null;

/** Picks the adapter based on environment — this is the "environment-variable adapter" pattern requested. */
export function getEmailAdapter(): EmailAdapter {
  if (process.env.NODE_ENV === "test") {
    testAdapterInstance ??= new TestEmailAdapter();
    return testAdapterInstance;
  }
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (apiKey && from) {
    return new ResendEmailAdapter(apiKey, from);
  }
  // Never write one-time URLs to production logs. Local development still
  // gets the convenient console adapter; production fails closed until a
  // real email provider is configured.
  return process.env.NODE_ENV === "production" ? new UnconfiguredEmailAdapter() : new ConsoleEmailAdapter();
}

/** Test-only helper to inspect what's been "sent". */
export function getTestSentEmails(): OutgoingEmail[] {
  return testAdapterInstance?.sent ?? [];
}

export function resetTestEmails(): void {
  testAdapterInstance = new TestEmailAdapter();
}
