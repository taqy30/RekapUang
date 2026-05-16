import { prisma } from "@/lib/db";

export type DashboardSummary = {
  saldo: number;
  totalMasuk: number;
  totalKeluar: number;
};

export type DashboardCategoryRow = {
  id: string;
  name: string;
  slug: string;
  color: string;
  masuk: number;
  keluar: number;
};

export type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  color: string;
};

export type DashboardTransaction = {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  date: string;
  createdAt: string;
  categoryId: string;
  category: CategoryOption;
};

export type DashboardData = {
  transactions: DashboardTransaction[];
  summary: DashboardSummary;
  categorySummary: DashboardCategoryRow[];
  categories: CategoryOption[];
};

export async function loadDashboardData(userId: string): Promise<DashboardData> {
  const [transactions, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        date: true,
        createdAt: true,
        categoryId: true,
        category: {
          select: { id: true, name: true, slug: true, color: true },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, color: true },
    }),
  ]);

  let totalMasuk = 0;
  let totalKeluar = 0;
  const byCategory = new Map<string, { masuk: number; keluar: number }>();

  for (const tx of transactions) {
    if (tx.type === "masuk") totalMasuk += tx.amount;
    else if (tx.type === "keluar") totalKeluar += tx.amount;

    const bucket = byCategory.get(tx.categoryId) ?? { masuk: 0, keluar: 0 };
    if (tx.type === "masuk") bucket.masuk += tx.amount;
    else if (tx.type === "keluar") bucket.keluar += tx.amount;
    byCategory.set(tx.categoryId, bucket);
  }

  const categorySummary: DashboardCategoryRow[] = categories.map((cat) => {
    const sum = byCategory.get(cat.id) ?? { masuk: 0, keluar: 0 };
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      color: cat.color,
      masuk: sum.masuk,
      keluar: sum.keluar,
    };
  });

  return {
    transactions: transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      date: tx.date.toISOString(),
      createdAt: tx.createdAt.toISOString(),
      categoryId: tx.categoryId,
      category: tx.category,
    })),
    summary: {
      saldo: totalMasuk - totalKeluar,
      totalMasuk,
      totalKeluar,
    },
    categorySummary,
    categories,
  };
}
