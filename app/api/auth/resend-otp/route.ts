import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isSameOrigin } from "@/lib/auth";
import { resendOtpSchema, safeParseJson } from "@/lib/validation";
import {
  generateOtp,
  hashOtp,
  otpExpiry,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origin tidak valid" }, { status: 403 });
  }

  const ip = getClientIp(request.headers);
  const ipLimit = rateLimit(`resend:ip:${ip}`, 10, 60 * 15);
  if (!ipLimit.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format tidak valid" }, { status: 400 });
  }

  const parsed = safeParseJson(resendOtpSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { email } = parsed.data;

  try {
    const pending = await prisma.pendingRegistration.findUnique({
      where: { email },
    });

    if (!pending) {
      return NextResponse.json({
        message: "Jika email valid, kode baru telah dikirim.",
      });
    }

    const secondsSinceLast =
      (Date.now() - pending.lastSentAt.getTime()) / 1000;

    if (secondsSinceLast < OTP_RESEND_COOLDOWN_SECONDS) {
      return NextResponse.json(
        {
          error: `Tunggu ${Math.ceil(
            OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLast
          )} detik sebelum meminta kode baru.`,
        },
        { status: 429 }
      );
    }

    const code = generateOtp();
    const otpHash = await hashOtp(code);

    await prisma.pendingRegistration.update({
      where: { email },
      data: {
        otpHash,
        attempts: 0,
        expiresAt: otpExpiry(),
        lastSentAt: new Date(),
      },
    });

    try {
      await sendOtpEmail(email, pending.name, code);
    } catch (err) {
      console.error("Gagal kirim email OTP:", err);
      return NextResponse.json(
        {
          error:
            "Gagal mengirim kode ke email. Periksa koneksi SMTP atau coba lagi.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      message: "Kode OTP baru telah dikirim ke Inbox Utama email Anda.",
    });
  } catch (err) {
    console.error("Resend OTP error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Coba lagi." },
      { status: 500 }
    );
  }
}
