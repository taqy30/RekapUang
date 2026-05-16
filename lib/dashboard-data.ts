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

export type LoadDashboardOptions = {
  transactionLimit?: number;
};

const txSelect = {
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
} as const;

function mapTransactions(
  transactions: Awaited<
    ReturnType<typeof prisma.transaction.findMany<{ select: typeof txSelect }>>
  >
): DashboardTransaction[] {
  return transactions.map((tx) => ({
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    description: tx.description,
    date: tx.date.toISOString(),
    createdAt: tx.createdAt.toISOString(),
    categoryId: tx.categoryId,
    category: tx.category,
  }));
}

function buildCategorySummary(
  categories: CategoryOption[],
  byCategory: Map<string, { masuk: number; keluar: number }>
): DashboardCategoryRow[] {
  return categories.map((cat) => {
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
}

export async function loadDashboardData(
  userId: string,
  options?: LoadDashboardOptions
): Promise<DashboardData> {
  const limit = options?.transactionLimit;

  if (limit) {
    const [transactions, categories, typeGroups, categoryGroups] =
      await Promise.all([
        prisma.transaction.findMany({
          where: { userId },
          take: limit,
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          select: txSelect,
        }),
        prisma.category.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true, slug: true, color: true },
        }),
        prisma.transaction.groupBy({
          by: ["type"],
          where: { userId },
          _sum: { amount: true },
        }),
        prisma.transaction.groupBy({
          by: ["categoryId", "type"],
          where: { userId },
          _sum: { amount: true },
        }),
      ]);

    let totalMasuk = 0;
    let totalKeluar = 0;
    for (const row of typeGroups) {
      const sum = row._sum.amount ?? 0;
      if (row.type === "masuk") totalMasuk = sum;
      else if (row.type === "keluar") totalKeluar = sum;
    }

    const byCategory = new Map<string, { masuk: number; keluar: number }>();
    for (const row of categoryGroups) {
      const bucket = byCategory.get(row.categoryId) ?? {
        masuk: 0,
        keluar: 0,
      };
      const sum = row._sum.amount ?? 0;
      if (row.type === "masuk") bucket.masuk += sum;
      else if (row.type === "keluar") bucket.keluar += sum;
      byCategory.set(row.categoryId, bucket);
    }

    return {
      transactions: mapTransactions(transactions),
      summary: {
        saldo: totalMasuk - totalKeluar,
        totalMasuk,
        totalKeluar,
      },
      categorySummary: buildCategorySummary(categories, byCategory),
      categories,
    };
  }

  const [transactions, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      select: txSelect,
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

  return {
    transactions: mapTransactions(transactions),
    summary: {
      saldo: totalMasuk - totalKeluar,
      totalMasuk,
      totalKeluar,
    },
    categorySummary: buildCategorySummary(categories, byCategory),
    categories,
  };
}
