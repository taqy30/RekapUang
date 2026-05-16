import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, isSameOrigin, verifyPassword } from "@/lib/auth";
import { loginSchema, safeParseJson } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origin tidak valid" }, { status: 403 });
  }

  const ip = getClientIp(request.headers);
  const ipLimit = rateLimit(`login:ip:${ip}`, 20, 60 * 15);
  if (!ipLimit.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi nanti." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format tidak valid" }, { status: 400 });
  }

  const parsed = safeParseJson(loginSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const emailLimit = rateLimit(`login:email:${email}`, 8, 60 * 15);
  if (!emailLimit.ok) {
    return NextResponse.json(
      { error: "Akun terkunci sementara karena percobaan berulang." },
      { status: 429 }
    );
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    const invalidMsg = "Email atau password salah";

    if (!user) {
      await verifyPassword(password, "$2a$12$invalidhashinvalidhashinvalidhashinvali");
      return NextResponse.json({ error: invalidMsg }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: invalidMsg }, { status: 401 });
    }

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return NextResponse.json({
      message: "Login berhasil",
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Coba lagi." },
      { status: 500 }
    );
  }
}
