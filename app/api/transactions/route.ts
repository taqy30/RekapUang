import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isSameOrigin } from "@/lib/auth";
import { transactionSchema, safeParseJson } from "@/lib/validation";
import { parseTransactionDate } from "@/lib/utils";
import { loadDashboardData } from "@/lib/dashboard-data";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await loadDashboardData(session.userId, {
    transactionLimit: 60,
  });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origin tidak valid" }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const { type, amount, categoryId, description, date } = parsed.data;

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan" },
        { status: 404 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.userId,
        categoryId,
        type,
        amount,
        description: description || null,
        date: parseTransactionDate(date),
      },
      include: { category: true },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (err) {
    console.error("Create transaction error:", err);
    return NextResponse.json(
      { error: "Gagal menambah transaksi" },
      { status: 500 }
    );
  }
}
