import nodemailer from "nodemailer";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }

  return value;
}

function createTransport() {
  return nodemailer.createTransport({
    host: getRequiredEnv("SMTP_HOST"),
    port: Number(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: getRequiredEnv("SMTP_USER"),
      pass: getRequiredEnv("SMTP_PASS"),
    },
  });
}

export async function sendPasswordResetEmail({
  email,
  name,
  resetUrl,
}: {
  email: string;
  name?: string | null;
  resetUrl: string;
}) {
  const transporter = createTransport();
  const from = process.env.SMTP_FROM ?? getRequiredEnv("SMTP_USER");

  await transporter.sendMail({
    from,
    to: email,
    subject: "AlphaLedger password reset",
    text: [
      `Hello${name ? ` ${name}` : ""},`,
      "",
      "We received a request to reset your AlphaLedger password.",
      `Open this link to set a new password: ${resetUrl}`,
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #111827;">
        <h2>AlphaLedger password reset</h2>
        <p>Hello${name ? ` ${name}` : ""},</p>
        <p>We received a request to reset your AlphaLedger password.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#34d399;color:#04130d;text-decoration:none;font-weight:700;">
            Reset password
          </a>
        </p>
        <p>If the button does not work, open this link:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function sendSignupVerificationEmail({
  email,
  name,
  code,
}: {
  email: string;
  name?: string | null;
  code: string;
}) {
  const transporter = createTransport();
  const from = process.env.SMTP_FROM ?? getRequiredEnv("SMTP_USER");

  await transporter.sendMail({
    from,
    to: email,
    subject: "AlphaLedger verification code",
    text: [
      `Hello${name ? ` ${name}` : ""},`,
      "",
      "Use this code to finish creating your AlphaLedger account:",
      code,
      "",
      "The code expires in 10 minutes.",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #111827;">
        <h2>AlphaLedger verification code</h2>
        <p>Hello${name ? ` ${name}` : ""},</p>
        <p>Use this code to finish creating your AlphaLedger account:</p>
        <p style="margin: 24px 0;">
          <span style="display:inline-block;padding:14px 18px;border-radius:14px;background:#111827;color:#f8fafc;font-size:28px;font-weight:700;letter-spacing:0.3em;">
            ${code}
          </span>
        </p>
        <p>The code expires in 10 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}
