import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function emailShell(content: string): string {
  return `
    <!doctype html>
    <html>
      <body style="margin:0;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#111827">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6fb;padding:28px 12px">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden">
                <tr>
                  <td style="background:#0f172a;padding:24px 28px;color:#ffffff">
                    <div style="font-size:12px;letter-spacing:1.8px;text-transform:uppercase;color:#93c5fd">PhoneTrack</div>
                    <div style="font-size:24px;font-weight:700;margin-top:6px">IMEI Guardian Pro</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px">
                    ${content}
                  </td>
                </tr>
                <tr>
                  <td style="background:#f8fafc;padding:18px 28px;color:#64748b;font-size:12px;line-height:1.6">
                    This automated message was sent by IMEI Guardian Pro. Keep account and customer access requests private.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #edf2f7;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.8px;width:150px">${label}</td>
      <td style="padding:12px 0;border-bottom:1px solid #edf2f7;color:#111827;font-size:14px;font-weight:600">${value}</td>
    </tr>
  `;
}

function assertEmailConfigured(): void {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new AppError(
      "Email delivery is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM, and ADMIN_CONTACT_EMAIL in backend .env",
      503,
      "EMAIL_DELIVERY_NOT_CONFIGURED",
    );
  }
}

export async function sendEmail(payload: MailPayload): Promise<void> {
  assertEmailConfigured();
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: env.SMTP_FROM ?? env.DEFAULT_ADMIN_EMAIL,
    ...payload,
  });
}

export async function sendPasswordResetNotice(email: string, otp: string): Promise<void> {
  const safeEmail = escapeHtml(email);
  const safeOtp = escapeHtml(otp);
  await sendEmail({
    to: email,
    subject: "Your IMEI Guardian Pro verification code",
    text: `Your IMEI Guardian Pro password reset verification code is ${otp}. It expires in 10 minutes.`,
    html: emailShell(`
      <div style="display:inline-block;background:#fff7ed;color:#9a3412;border:1px solid #fed7aa;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:700">Security request</div>
      <h1 style="margin:18px 0 10px;font-size:26px;line-height:1.25;color:#0f172a">Verify your reset request</h1>
      <p style="margin:0;color:#475569;font-size:15px;line-height:1.7">
        Use this 6 digit code to verify the password reset request for your admin account.
      </p>
      <div style="margin:24px 0;background:#0f172a;color:#ffffff;border-radius:16px;padding:22px;text-align:center">
        <div style="font-size:12px;color:#93c5fd;letter-spacing:1.4px;text-transform:uppercase">Verification code</div>
        <div style="font-size:36px;letter-spacing:8px;font-weight:800;margin-top:8px">${safeOtp}</div>
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px">
        ${detailRow("Account", safeEmail)}
        ${detailRow("Expires", "10 minutes")}
      </table>
      <div style="margin-top:24px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:16px;color:#1e3a8a;font-size:14px;line-height:1.6">
        If you did not request this code, keep your account secure and ignore this message.
      </div>
    `),
  });
}

export async function sendAdminContactNotice(input: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  const adminEmail = env.ADMIN_CONTACT_EMAIL ?? env.DEFAULT_ADMIN_EMAIL;
  const safeName = escapeHtml(input.name);
  const safeEmail = escapeHtml(input.email);
  const safeMessage = escapeHtml(input.message || "No message provided");
  const requestedAt = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  await sendEmail({
    to: adminEmail,
    subject: `IMEI Guardian Pro access request from ${input.name}`,
    text: `Name: ${input.name}\nEmail: ${input.email}\nMessage: ${input.message || "No message provided"}`,
    html: emailShell(`
      <div style="display:inline-block;background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:700">New access request</div>
      <h1 style="margin:18px 0 10px;font-size:26px;line-height:1.25;color:#0f172a">${safeName} wants admin access</h1>
      <p style="margin:0;color:#475569;font-size:15px;line-height:1.7">
        Review this request before creating or approving an IMEI Guardian Pro account.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px">
        ${detailRow("Name", safeName)}
        ${detailRow("Email", `<a href="mailto:${safeEmail}" style="color:#2563eb;text-decoration:none">${safeEmail}</a>`)}
        ${detailRow("Requested", escapeHtml(requestedAt))}
      </table>
      <div style="margin-top:24px">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:.8px;color:#64748b;font-weight:700;margin-bottom:8px">Message</div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px;color:#334155;font-size:14px;line-height:1.7">${safeMessage}</div>
      </div>
      <div style="margin-top:26px">
        <a href="mailto:${safeEmail}?subject=IMEI Guardian Pro access request" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:10px;padding:12px 18px;font-size:14px;font-weight:700">Reply to requester</a>
      </div>
    `),
  });
}

export async function sendAccessRequestDecisionNotice(input: {
  name: string;
  email: string;
  status: "approved" | "rejected";
  role: "admin" | "staff";
  temporaryPassword?: string;
  note?: string;
}): Promise<void> {
  const safeName = escapeHtml(input.name);
  const safeEmail = escapeHtml(input.email);
  const safeRole = escapeHtml(input.role);
  const safeNote = escapeHtml(input.note || "No admin note provided");
  const isApproved = input.status === "approved";
  const safePassword = input.temporaryPassword ? escapeHtml(input.temporaryPassword) : "";

  await sendEmail({
    to: input.email,
    subject: isApproved
      ? "Your IMEI Guardian Pro access request was approved"
      : "Your IMEI Guardian Pro access request was rejected",
    text: isApproved
      ? `Hello ${input.name}, your access request was approved with ${input.role} role. Temporary password: ${input.temporaryPassword ?? ""}`
      : `Hello ${input.name}, your access request was rejected. Note: ${input.note || "No admin note provided"}`,
    html: emailShell(`
      <div style="display:inline-block;background:${isApproved ? "#ecfdf5" : "#fef2f2"};color:${isApproved ? "#047857" : "#b91c1c"};border:1px solid ${isApproved ? "#a7f3d0" : "#fecaca"};border-radius:999px;padding:7px 12px;font-size:12px;font-weight:700">
        Access request ${isApproved ? "approved" : "rejected"}
      </div>
      <h1 style="margin:18px 0 10px;font-size:26px;line-height:1.25;color:#0f172a">Hello ${safeName}</h1>
      <p style="margin:0;color:#475569;font-size:15px;line-height:1.7">
        Your IMEI Guardian Pro access request has been ${isApproved ? "approved" : "reviewed and rejected"} by the administrator.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px">
        ${detailRow("Account", safeEmail)}
        ${detailRow("Role", safeRole)}
        ${detailRow("Status", isApproved ? "Approved" : "Rejected")}
        ${isApproved && safePassword ? detailRow("Temp password", safePassword) : ""}
      </table>
      ${
        isApproved
          ? `<div style="margin-top:24px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:16px;color:#1e3a8a;font-size:14px;line-height:1.6">
              Sign in with this temporary password, then use Forgot Password to set your own password if needed. Only admin role accounts can access the site.
            </div>`
          : `<div style="margin-top:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px;color:#334155;font-size:14px;line-height:1.7">${safeNote}</div>`
      }
    `),
  });
}
