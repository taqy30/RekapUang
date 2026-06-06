import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/db";
import { isSameOrigin } from "@/lib/auth";
import { forgotPasswordSchema, safeParseJson } from "@/lib/validation";
import { sendPasswordResetEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { jsonBodyErrorResponse, readJsonBody } from "@/lib/security";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origin tidak valid" }, { status: 403 });
  }

  const ip = getClientIp(request.headers);
  const ipLimit = rateLimit(`forgot:ip:${ip}`, 10, 60 * 15);
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

  const parsed = safeParseJson(forgotPasswordSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { email } = parsed.data;

  const emailLimit = rateLimit(`forgot:email:${email}`, 3, 60 * 15);
  if (!emailLimit.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan untuk email ini." },
      { status: 429 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (user) {
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 menit

      await prisma.$transaction([
        prisma.passwordResetToken.deleteMany({
          where: { email: user.email, usedAt: null },
        }),
        prisma.passwordResetToken.create({
          data: {
            email: user.email,
            tokenHash,
            expiresAt,
          },
        }),
      ]);

      const reqUrl = new URL(request.url);
      const appUrl = process.env.APP_URL || reqUrl.origin;
      const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

      try {
        await sendPasswordResetEmail(user.email, user.name, resetUrl);
      } catch (err) {
        console.error("Gagal kirim email reset password:", err);
      }
    }

    return NextResponse.json({
      message: "Jika email terdaftar, link reset telah dikirim.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Coba lagi." },
      { status: 500 }
    );
  }
}
