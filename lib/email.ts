import nodemailer, { type Transporter } from "nodemailer";
import { OTP_TTL_MINUTES } from "./otp";

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) return null;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return cachedTransporter;
}

function fromAddress(): string {
  return (
    process.env.SMTP_FROM ||
    `RekapUang <${process.env.SMTP_USER || "noreply@rekapuang.local"}>`
  );
}

function otpEmailHtml(name: string, code: string): string {
  const safeName = escapeHtml(name);
  return `<!doctype html>
<html lang="id">
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 8px 28px;">
              <div style="display:inline-block;width:44px;height:44px;background:#ccfbf1;border-radius:10px;line-height:44px;text-align:center;font-size:22px;color:#0f766e;font-weight:700;">R</div>
              <h1 style="margin:16px 0 4px 0;font-size:20px;color:#0f172a;">Verifikasi Email</h1>
              <p style="margin:0;font-size:14px;color:#64748b;">Halo ${safeName}, masukkan kode berikut untuk menyelesaikan pendaftaran:</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 8px 28px;">
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;text-align:center;">
                <div style="font-size:32px;letter-spacing:10px;color:#0f172a;font-weight:700;font-family:'Courier New',monospace;">${code}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px 28px;font-size:13px;color:#64748b;line-height:1.6;">
              Kode berlaku selama <strong>${OTP_TTL_MINUTES} menit</strong>. Jangan bagikan kode ini ke siapa pun.
              <br><br>
              Jika Anda tidak meminta kode ini, abaikan email ini.
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0 0;font-size:12px;color:#94a3b8;">© RekapUang</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendOtpEmail(
  to: string,
  name: string,
  code: string
): Promise<void> {
  const transporter = getTransporter();

  if (!transporter) {
    const banner = "═".repeat(58);
    console.log(
      `\n${banner}\n  [DEV] OTP untuk ${to}\n  Nama  : ${name}\n  Kode  : ${code}\n  Masa berlaku: ${OTP_TTL_MINUTES} menit\n  (SMTP belum dikonfigurasi - kode tidak dikirim ke email)\n${banner}\n`
    );
    return;
  }

  await transporter.sendMail({
    from: fromAddress(),
    to,
    subject: `Kode Verifikasi: ${code}`,
    text: `Halo ${name},\n\nKode verifikasi RekapUang Anda: ${code}\nBerlaku ${OTP_TTL_MINUTES} menit.\n\nJangan bagikan kode ini ke siapa pun.\n`,
    html: otpEmailHtml(name, code),
  });
}
