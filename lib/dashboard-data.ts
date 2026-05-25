import { prisma } from "@/lib/db";
import { sortFundSources } from "@/lib/fund-sources";

export type DashboardSummary = {
  saldo: number;
  totalMasuk: number;
  totalKeluar: number;
};

export type SummaryRow = {
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

export type FundSourceOption = {
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
  fundSourceId: string | null;
  category: CategoryOption;
  fundSource: FundSourceOption | null;
};

export type DashboardData = {
  transactions: DashboardTransaction[];
  summary: DashboardSummary;
  categorySummary: SummaryRow[];
  fundSourceSummary: SummaryRow[];
  categories: CategoryOption[];
  fundSources: FundSourceOption[];
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
  fundSourceId: true,
  category: {
    select: { id: true, name: true, slug: true, color: true },
  },
  fundSource: {
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
    fundSourceId: tx.fundSourceId,
    category: tx.category,
    fundSource: tx.fundSource,
  }));
}

function buildSummary(
  items: { id: string; name: string; slug: string; color: string }[],
  byId: Map<string, { masuk: number; keluar: number }>
): SummaryRow[] {
  return items.map((item) => {
    const sum = byId.get(item.id) ?? { masuk: 0, keluar: 0 };
    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      color: item.color,
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

  const [categoriesRaw, fundSourcesRaw] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, color: true },
    }),
    prisma.fundSource.findMany({
      select: { id: true, name: true, slug: true, color: true },
    }),
  ]);

  const categories = categoriesRaw;
  const fundSources = sortFundSources(fundSourcesRaw);

  if (limit) {
    const [
      transactions,
      typeGroups,
      categoryGroups,
      fundSourceGroups,
    ] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        take: limit,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        select: txSelect,
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
      prisma.transaction.groupBy({
        by: ["fundSourceId", "type"],
        where: { userId, fundSourceId: { not: null } },
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

    const byFundSource = new Map<string, { masuk: number; keluar: number }>();
    for (const row of fundSourceGroups) {
      if (!row.fundSourceId) continue;
      const bucket = byFundSource.get(row.fundSourceId) ?? {
        masuk: 0,
        keluar: 0,
      };
      const sum = row._sum.amount ?? 0;
      if (row.type === "masuk") bucket.masuk += sum;
      else if (row.type === "keluar") bucket.keluar += sum;
      byFundSource.set(row.fundSourceId, bucket);
    }

    return {
      transactions: mapTransactions(transactions),
      summary: {
        saldo: totalMasuk - totalKeluar,
        totalMasuk,
        totalKeluar,
      },
      categorySummary: buildSummary(categories, byCategory),
      fundSourceSummary: buildSummary(fundSources, byFundSource),
      categories,
      fundSources,
    };
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: txSelect,
  });

  let totalMasuk = 0;
  let totalKeluar = 0;
  const byCategory = new Map<string, { masuk: number; keluar: number }>();
  const byFundSource = new Map<string, { masuk: number; keluar: number }>();

  for (const tx of transactions) {
    if (tx.type === "masuk") totalMasuk += tx.amount;
    else if (tx.type === "keluar") totalKeluar += tx.amount;

    const catBucket = byCategory.get(tx.categoryId) ?? { masuk: 0, keluar: 0 };
    if (tx.type === "masuk") catBucket.masuk += tx.amount;
    else if (tx.type === "keluar") catBucket.keluar += tx.amount;
    byCategory.set(tx.categoryId, catBucket);

    if (tx.fundSourceId) {
      const fsBucket = byFundSource.get(tx.fundSourceId) ?? {
        masuk: 0,
        keluar: 0,
      };
      if (tx.type === "masuk") fsBucket.masuk += tx.amount;
      else if (tx.type === "keluar") fsBucket.keluar += tx.amount;
      byFundSource.set(tx.fundSourceId, fsBucket);
    }
  }

  return {
    transactions: mapTransactions(transactions),
    summary: {
      saldo: totalMasuk - totalKeluar,
      totalMasuk,
      totalKeluar,
    },
    categorySummary: buildSummary(categories, byCategory),
    fundSourceSummary: buildSummary(fundSources, byFundSource),
    categories,
    fundSources,
  };
}
