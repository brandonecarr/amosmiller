import { Resend } from "resend";

// Lazy-load Resend client to avoid build-time errors
let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, text, replyTo }: SendEmailParams) {
  const fromEmail = process.env.EMAIL_FROM || "orders@amosmillerfarm.com";
  const fromName = process.env.EMAIL_FROM_NAME || "Amos Miller Farm";

  try {
    const result = await getResend().emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      replyTo,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

export { getResend };
