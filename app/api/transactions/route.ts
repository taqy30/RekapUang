import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isSameOrigin } from "@/lib/auth";
import { transactionSchema, safeParseJson } from "@/lib/validation";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.userId },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  const masuk = transactions
    .filter((t) => t.type === "masuk")
    .reduce((sum, t) => sum + t.amount, 0);
  const keluar = transactions
    .filter((t) => t.type === "keluar")
    .reduce((sum, t) => sum + t.amount, 0);

  const byCategory = await prisma.transaction.groupBy({
    by: ["categoryId", "type"],
    where: { userId: session.userId },
    _sum: { amount: true },
  });

  const categories = await prisma.category.findMany();

  const categorySummary = categories.map((cat) => {
    const masukCat = byCategory.find(
      (g) => g.categoryId === cat.id && g.type === "masuk"
    );
    const keluarCat = byCategory.find(
      (g) => g.categoryId === cat.id && g.type === "keluar"
    );
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      color: cat.color,
      masuk: masukCat?._sum.amount || 0,
      keluar: keluarCat?._sum.amount || 0,
    };
  });

  return NextResponse.json({
    transactions,
    summary: {
      saldo: masuk - keluar,
      totalMasuk: masuk,
      totalKeluar: keluar,
    },
    categorySummary,
  });
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
        date: date ? new Date(date) : new Date(),
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
