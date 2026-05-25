import type { Transaction } from "@/components/TransactionModal";
import { orderRecapAllRows } from "@/lib/fund-sources";

export type RecapViewMode = "kategori" | "penyimpanan";

export type PeriodMode = "harian" | "bulanan";
export type TxTypeFilter = "all" | "masuk" | "keluar";

export function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTransactionDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function sortTransactionsNewestFirst(a: Transaction, b: Transaction) {
  const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
  if (dateDiff !== 0) return dateDiff;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export function getLocalDateKey(dateStr: string) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getLocalMonthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function todayDateKey() {
  return getLocalDateKey(new Date().toISOString());
}

export function currentMonthKey() {
  return getLocalMonthKey(new Date().toISOString());
}

export function formatPeriodLabel(mode: PeriodMode, value: string) {
  if (mode === "harian") {
    const d = new Date(value + "T12:00:00");
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  const [y, m] = value.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export function filterTransactions(
  transactions: Transaction[],
  mode: PeriodMode,
  periodValue: string,
  typeFilter: TxTypeFilter
) {
  const list = transactions.filter((tx) => {
    const key =
      mode === "harian"
        ? getLocalDateKey(tx.date)
        : getLocalMonthKey(tx.date);
    return key === periodValue;
  });

  const typed =
    typeFilter === "all" ? list : list.filter((t) => t.type === typeFilter);

  return [...typed].sort(sortTransactionsNewestFirst);
}

export function summarizeTransactions(transactions: Transaction[]) {
  const masuk = transactions
    .filter((t) => t.type === "masuk")
    .reduce((s, t) => s + t.amount, 0);
  const keluar = transactions
    .filter((t) => t.type === "keluar")
    .reduce((s, t) => s + t.amount, 0);
  return { masuk, keluar, net: masuk - keluar, count: transactions.length };
}

export type CategoryPeriodRow = {
  id: string;
  name: string;
  slug?: string;
  color: string;
  masuk: number;
  keluar: number;
};

export function summarizeByCategory(
  transactions: Transaction[]
): CategoryPeriodRow[] {
  const map = new Map<string, CategoryPeriodRow>();

  for (const tx of transactions) {
    const existing = map.get(tx.categoryId) ?? {
      id: tx.category.id,
      name: tx.category.name,
      color: tx.category.color,
      masuk: 0,
      keluar: 0,
    };
    if (tx.type === "masuk") existing.masuk += tx.amount;
    else existing.keluar += tx.amount;
    map.set(tx.categoryId, existing);
  }

  return [...map.values()].sort((a, b) => {
    const totalA = a.masuk + a.keluar;
    const totalB = b.masuk + b.keluar;
    return totalB - totalA;
  });
}

export function summarizeByFundSource(
  transactions: Transaction[]
): CategoryPeriodRow[] {
  const map = new Map<string, CategoryPeriodRow>();

  for (const tx of transactions) {
    if (!tx.fundSourceId || !tx.fundSource) continue;
    const existing = map.get(tx.fundSourceId) ?? {
      id: tx.fundSource.id,
      name: tx.fundSource.name,
      color: tx.fundSource.color,
      masuk: 0,
      keluar: 0,
    };
    if (tx.type === "masuk") existing.masuk += tx.amount;
    else existing.keluar += tx.amount;
    map.set(tx.fundSourceId, existing);
  }

  return [...map.values()].sort((a, b) => {
    const totalA = a.masuk + a.keluar;
    const totalB = b.masuk + b.keluar;
    return totalB - totalA;
  });
}

type FundSourceOption = {
  id: string;
  name: string;
  slug: string;
  color: string;
};

/** Rekap periode untuk semua tipe penyimpanan (urutan standar). */
export function buildFundSourcePeriodRows(
  transactions: Transaction[],
  allFundSources: FundSourceOption[]
): CategoryPeriodRow[] {
  const summarized = summarizeByFundSource(transactions);
  const byId = new Map(summarized.map((r) => [r.id, r]));

  const rows = allFundSources.map((fs) => {
    const sum = byId.get(fs.id);
    return {
      id: fs.id,
      name: fs.name,
      slug: fs.slug,
      color: fs.color,
      masuk: sum?.masuk ?? 0,
      keluar: sum?.keluar ?? 0,
    };
  });

  return orderRecapAllRows(rows);
}

export function formatRecapAmountLine(
  row: CategoryPeriodRow,
  typeFilter: TxTypeFilter
): string {
  if (typeFilter === "masuk") {
    return `Masuk: ${formatRupiah(row.masuk)}`;
  }
  if (typeFilter === "keluar") {
    return `Keluar: ${formatRupiah(row.keluar)}`;
  }
  return `+${formatRupiah(row.masuk)} · −${formatRupiah(row.keluar)}`;
}

export function recapRowNet(
  row: CategoryPeriodRow,
  typeFilter: TxTypeFilter
): number {
  if (typeFilter === "masuk") return row.masuk;
  if (typeFilter === "keluar") return -row.keluar;
  return row.masuk - row.keluar;
}
