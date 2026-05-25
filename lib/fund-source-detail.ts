import { prisma } from "@/lib/db";
import { sortFundSources } from "@/lib/fund-sources";
import type {
  DashboardTransaction,
  FundSourceOption,
  SummaryRow,
} from "@/lib/dashboard-data";

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

export type FundSourceSummary = SummaryRow & { saldo: number };

export type FundSourceDetailData = {
  fundSource: FundSourceOption;
  summary: {
    saldo: number;
    totalMasuk: number;
    totalKeluar: number;
  };
  transactions: DashboardTransaction[];
};

export async function loadFundSourceHubSummary(
  userId: string
): Promise<FundSourceSummary[]> {
  const [fundSources, groups] = await Promise.all([
    prisma.fundSource.findMany({
      select: { id: true, name: true, slug: true, color: true },
    }),
    prisma.transaction.groupBy({
      by: ["fundSourceId", "type"],
      where: { userId, fundSourceId: { not: null } },
      _sum: { amount: true },
    }),
  ]);

  const byId = new Map<string, { masuk: number; keluar: number }>();
  for (const row of groups) {
    if (!row.fundSourceId) continue;
    const bucket = byId.get(row.fundSourceId) ?? { masuk: 0, keluar: 0 };
    const sum = row._sum.amount ?? 0;
    if (row.type === "masuk") bucket.masuk += sum;
    else if (row.type === "keluar") bucket.keluar += sum;
    byId.set(row.fundSourceId, bucket);
  }

  return sortFundSources(fundSources).map((fs) => {
    const sum = byId.get(fs.id) ?? { masuk: 0, keluar: 0 };
    return {
      id: fs.id,
      name: fs.name,
      slug: fs.slug,
      color: fs.color,
      masuk: sum.masuk,
      keluar: sum.keluar,
      saldo: sum.masuk - sum.keluar,
    };
  });
}

export async function loadFundSourceDetail(
  userId: string,
  slug: string
): Promise<FundSourceDetailData | null> {
  const fundSource = await prisma.fundSource.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, color: true },
  });

  if (!fundSource) return null;

  const transactions = await prisma.transaction.findMany({
    where: { userId, fundSourceId: fundSource.id },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: txSelect,
  });

  let totalMasuk = 0;
  let totalKeluar = 0;
  for (const tx of transactions) {
    if (tx.type === "masuk") totalMasuk += tx.amount;
    else if (tx.type === "keluar") totalKeluar += tx.amount;
  }

  return {
    fundSource,
    summary: {
      saldo: totalMasuk - totalKeluar,
      totalMasuk,
      totalKeluar,
    },
    transactions: mapTransactions(transactions),
  };
}
