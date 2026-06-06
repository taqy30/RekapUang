import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, isSameOrigin } from "@/lib/auth";
import { registerSchema, safeParseJson } from "@/lib/validation";
import {
  generateOtp,
  hashOtp,
  otpExpiry,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { jsonBodyErrorResponse, readJsonBody } from "@/lib/security";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origin tidak valid" }, { status: 403 });
  }

  const ip = getClientIp(request.headers);
  const ipLimit = rateLimit(`register:ip:${ip}`, 10, 60 * 15);
  if (!ipLimit.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi nanti." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (err) {
    const parsed = jsonBodyErrorResponse(err);
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const parsed = safeParseJson(registerSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const emailLimit = rateLimit(`register:email:${email}`, 5, 60 * 15);
  if (!emailLimit.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan untuk email ini." },
      { status: 429 }
    );
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "Email sudah terdaftar. Gunakan email lain atau login.",
        },
        { status: 409 }
      );
    }

    const code = generateOtp();
    const passwordHash = await hashPassword(password);
    const otpHash = await hashOtp(code);
    const expiresAt = otpExpiry();

    const existing = await prisma.pendingRegistration.findUnique({
      where: { email },
    });

    if (existing) {
      const secondsSinceLast =
        (Date.now() - existing.lastSentAt.getTime()) / 1000;
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
    }

    await prisma.pendingRegistration.upsert({
      where: { email },
      update: {
        name,
        passwordHash,
        otpHash,
        attempts: 0,
        expiresAt,
        lastSentAt: new Date(),
      },
      create: {
        email,
        name,
        passwordHash,
        otpHash,
        expiresAt,
      },
    });

    try {
      await sendOtpEmail(email, name, code);
    } catch (err) {
      console.error("Gagal kirim email OTP:", err);
      await prisma.pendingRegistration.delete({ where: { email } }).catch(() => {});
      return NextResponse.json(
        {
          error:
            "Gagal mengirim kode ke email. Periksa alamat email lalu coba lagi.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      message: "Kode OTP telah dikirim ke Inbox Utama email Anda.",
      email,
    });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Coba lagi." },
      { status: 500 }
    );
  }
}
