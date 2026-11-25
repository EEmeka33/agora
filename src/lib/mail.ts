import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Optional email delivery.
 *   SMTP_URL=smtps://user:password@smtp.example.org:465   → real emails
 *   SMTP_URL=log                                          → printed in the server console (development)
 *   (unset)                                               → no emails, in-app notifications only
 */
export function mailEnabled() {
  return !!process.env.SMTP_URL;
}

let transporter: Transporter | null = null;

function transport() {
  if (!transporter) {
    const url = process.env.SMTP_URL!;
    transporter = url === "log" ? nodemailer.createTransport({ jsonTransport: true }) : nodemailer.createTransport(url);
  }
  return transporter;
}

export async function sendMail(message: { to: string; subject: string; text: string; html?: string }) {
  if (!mailEnabled()) return false;
  try {
    const info = await transport().sendMail({
      from: process.env.MAIL_FROM ?? "Agora <no-reply@localhost>",
      ...message,
    });
    if (process.env.SMTP_URL === "log") console.log("[mail]", message.to, "—", message.subject, "\n" + message.text);
    return !!info;
  } catch (error) {
    console.error("[mail] failed to send", error);
    return false;
  }
}

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Minimal, accessible HTML email with one call-to-action button. */
export function emailLayout({
  heading,
  body,
  cta,
  url,
  footer,
}: {
  heading: string;
  body: string;
  cta?: string;
  url?: string;
  footer: string;
}) {
  const button =
    cta && url
      ? `<p style="margin:24px 0"><a href="${escape(url)}" style="background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">${escape(cta)}</a></p>`
      : "";
  return `<!doctype html><html><body style="margin:0;background:#f6f7f9;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#1f2328">
<div style="max-width:520px;margin:24px auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:28px">
<h1 style="font-size:18px;margin:0 0 12px">${escape(heading)}</h1>
<p style="font-size:15px;line-height:1.5;margin:0">${escape(body).replace(/\n/g, "<br>")}</p>${button}
<p style="font-size:12px;color:#6b7280;margin:24px 0 0">${escape(footer)}</p></div></body></html>`;
}
