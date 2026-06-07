import nodemailer from "nodemailer";
import { appConfig } from "@/lib/env";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: port ? parseInt(port, 10) : 587,
    secure: port === "465",
    auth: { user, pass },
  });
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || appConfig.supportEmail;

  if (!transporter) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Email] SMTP not configured. Would send:", { to, subject });
      return true;
    }
    return false;
  }

  await transporter.sendMail({ from, to, subject, html, text: text ?? html.replace(/<[^>]+>/g, "") });
  return true;
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const resetUrl = `${appConfig.url}/reset-password?token=${token}`;
  return sendEmail({
    to: email,
    subject: `Reset your ${appConfig.name} password`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Password Reset</h1>
        <p>You requested a password reset for your ${appConfig.name} account.</p>
        <p><a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #b8860b; color: #fff; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
        <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
}

export async function sendContactNotification({
  name,
  email,
  subject,
  message,
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<boolean> {
  return sendEmail({
    to: appConfig.supportEmail,
    subject: `[Contact] ${subject}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
    `,
  });
}

export async function sendNewsletterConfirmation(email: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `Welcome to the ${appConfig.name} newsletter`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Welcome to ${appConfig.name}</h1>
        <p>Thank you for subscribing to our newsletter. You'll be the first to know about new fragrances, exclusive offers, and luxury collections.</p>
      </div>
    `,
  });
}
