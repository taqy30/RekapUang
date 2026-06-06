import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isSameOrigin } from "@/lib/auth";
import { transactionSchema, safeParseJson, cuidSchema } from "@/lib/validation";
import { parseTransactionDate } from "@/lib/utils";
import { jsonBodyErrorResponse, readJsonBody } from "@/lib/security";

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
  const idParsed = cuidSchema.safeParse(id);
  if (!idParsed.success) {
    return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (err) {
    const parsed = jsonBodyErrorResponse(err);
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const parsed = safeParseJson(transactionSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const existing = await prisma.transaction.findFirst({
      where: { id: idParsed.data, userId: session.userId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    const { type, amount, categoryId, fundSourceId, description, date } =
      parsed.data;

    const [category, fundSource] = await Promise.all([
      prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      }),
      prisma.fundSource.findUnique({
        where: { id: fundSourceId },
        select: { id: true },
      }),
    ]);
    if (!category) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan" },
        { status: 404 }
      );
    }
    if (!fundSource) {
      return NextResponse.json(
        { error: "Tipe penyimpanan tidak ditemukan" },
        { status: 404 }
      );
    }

    const transaction = await prisma.transaction.update({
      where: { id: idParsed.data },
      data: {
        type,
        amount,
        categoryId,
        fundSourceId,
        description: description || null,
        date: date ? parseTransactionDate(date) : undefined,
      },
      include: { category: true, fundSource: true },
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
  const idParsed = cuidSchema.safeParse(id);
  if (!idParsed.success) {
    return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  }

  const existing = await prisma.transaction.findFirst({
    where: { id: idParsed.data, userId: session.userId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Transaksi tidak ditemukan" },
      { status: 404 }
    );
  }

  await prisma.transaction.delete({ where: { id: idParsed.data } });
  return NextResponse.json({ message: "Transaksi dihapus" });
}
