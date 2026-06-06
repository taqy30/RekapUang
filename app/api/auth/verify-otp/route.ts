import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createSession, isSameOrigin } from "@/lib/auth";
import { verifyOtpSchema, safeParseJson } from "@/lib/validation";
import { OTP_MAX_ATTEMPTS, verifyOtp } from "@/lib/otp";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { jsonBodyErrorResponse, readJsonBody } from "@/lib/security";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origin tidak valid" }, { status: 403 });
  }

  const ip = getClientIp(request.headers);
  const ipLimit = rateLimit(`verify:ip:${ip}`, 20, 60 * 15);
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

  const parsed = safeParseJson(verifyOtpSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { email, code } = parsed.data;

  const emailLimit = rateLimit(`verify:email:${email}`, 10, 60 * 15);
  if (!emailLimit.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan verifikasi untuk email ini." },
      { status: 429 }
    );
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      await prisma.pendingRegistration.delete({ where: { email } }).catch(() => {});
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan login." },
        { status: 409 }
      );
    }

    const pending = await prisma.pendingRegistration.findUnique({
      where: { email },
    });

    if (!pending) {
      return NextResponse.json(
        { error: "Kode OTP tidak ditemukan atau sudah kedaluwarsa." },
        { status: 400 }
      );
    }

    if (pending.expiresAt.getTime() < Date.now()) {
      await prisma.pendingRegistration.delete({ where: { email } }).catch(() => {});
      return NextResponse.json(
        { error: "Kode OTP sudah kedaluwarsa. Daftar ulang." },
        { status: 400 }
      );
    }

    if (pending.attempts >= OTP_MAX_ATTEMPTS) {
      await prisma.pendingRegistration.delete({ where: { email } }).catch(() => {});
      return NextResponse.json(
        { error: "Terlalu banyak percobaan salah. Daftar ulang." },
        { status: 429 }
      );
    }

    const valid = await verifyOtp(code, pending.otpHash);

    if (!valid) {
      await prisma.pendingRegistration.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });
      const sisa = OTP_MAX_ATTEMPTS - (pending.attempts + 1);
      return NextResponse.json(
        {
          error:
            sisa > 0
              ? `Kode salah. Sisa percobaan: ${sisa}.`
              : "Kode salah. Daftar ulang.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name: pending.name,
          email: pending.email,
          passwordHash: pending.passwordHash,
          emailVerified: true,
        },
      });
      await tx.pendingRegistration.delete({ where: { email } });
      return u;
    });

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return NextResponse.json({
      message: "Verifikasi berhasil. Selamat datang!",
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan login." },
        { status: 409 }
      );
    }
    console.error("Verify OTP error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Coba lagi." },
      { status: 500 }
    );
  }
}
