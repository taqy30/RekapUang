import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isSameOrigin } from "@/lib/auth";
import { transactionSchema, safeParseJson } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origin tidak valid" }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format tidak valid" }, { status: 400 });
  }

  const parsed = safeParseJson(transactionSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: session.userId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    const { type, amount, categoryId, description, date } = parsed.data;

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        type,
        amount,
        categoryId,
        description: description || null,
        date: date ? new Date(date) : undefined,
      },
      include: { category: true },
    });

    return NextResponse.json(transaction);
  } catch (err) {
    console.error("Update transaction error:", err);
    return NextResponse.json(
      { error: "Gagal mengubah transaksi" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origin tidak valid" }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: session.userId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Transaksi tidak ditemukan" },
      { status: 404 }
    );
  }

  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ message: "Transaksi dihapus" });
}
