import nodemailer from "nodemailer";
import { env, isSmtpConfigured } from "../../env";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!isSmtpConfigured) {
    throw new Error("Email delivery is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS to enable it.");
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

export async function sendCsvEmail(to: string, csv: string, filename: string) {
  const transport = getTransporter();
  await transport.sendMail({
    from: env.smtp.from,
    to,
    subject: "Your Minto transaction export",
    text: "Attached is the transaction export you requested from Minto.",
    attachments: [{ filename, content: csv, contentType: "text/csv" }],
  });
}
