"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CalendarRange,
  Wallet,
} from "lucide-react";
import type { Transaction } from "./TransactionModal";
import DashboardLoadingScreen from "./DashboardLoadingScreen";
import AppFooter from "./AppFooter";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  type PeriodMode,
  type TxTypeFilter,
  currentMonthKey,
  filterTransactions,
  formatPeriodLabel,
  formatRupiah,
  formatTransactionDate,
  summarizeByCategory,
  summarizeByFundSource,
  summarizeTransactions,
  todayDateKey,
} from "@/lib/transactions-display";
import type { DashboardData } from "@/lib/dashboard-data";
import { headerSlide, staggerContainer, staggerItem } from "@/lib/motion";

type HistoryViewProps = {
  userName: string;
};

export default function HistoryView({ userName }: HistoryViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [ready, setReady] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [periodMode, setPeriodMode] = useState<PeriodMode>(
    (searchParams.get("mode") as PeriodMode) === "bulanan" ? "bulanan" : "harian"
  );
  const [selectedDate, setSelectedDate] = useState(
    searchParams.get("date") || todayDateKey()
  );
  const [selectedMonth, setSelectedMonth] = useState(
    searchParams.get("month") || currentMonthKey()
  );
  const [typeFilter, setTypeFilter] = useState<TxTypeFilter>("all");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/transactions", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data: DashboardData = await res.json();
      setTransactions(data.transactions as Transaction[]);
      setReady(true);
    } catch {
      toast.error("Gagal memuat data");
      setReady(true);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const periodValue = periodMode === "harian" ? selectedDate : selectedMonth;

  const periodAll = useMemo(
    () => filterTransactions(transactions, periodMode, periodValue, "all"),
    [transactions, periodMode, periodValue]
  );

  const filteredTx = useMemo(
    () => filterTransactions(transactions, periodMode, periodValue, typeFilter),
    [transactions, periodMode, periodValue, typeFilter]
  );

  const summary = useMemo(
    () => summarizeTransactions(periodAll),
    [periodAll]
  );

  const categoryRows = useMemo(
    () => summarizeByCategory(periodAll),
    [periodAll]
  );

  const fundSourceRows = useMemo(
    () => summarizeByFundSource(periodAll),
    [periodAll]
  );

  if (!ready) {
    return <DashboardLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col pb-8">
      <motion.header
        initial="initial"
        animate="animate"
        variants={headerSlide}
        className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/dashboard"
            aria-label="Kembali ke dashboard"
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold sm:text-lg">
                Riwayat detail
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                Halo, {userName}
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-5 px-4 py-5 sm:px-6 sm:py-6">
        <motion.div
          variants={staggerItem}
          initial="initial"
          animate="animate"
        >
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filter periode</CardTitle>
            <CardDescription>
              Pilih harian (tanggal tertentu) atau bulanan (seluruh bulan)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs
              value={periodMode}
              onValueChange={(v) => setPeriodMode(v as PeriodMode)}
            >
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="harian" className="gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Harian
                </TabsTrigger>
                <TabsTrigger value="bulanan" className="gap-1.5">
                  <CalendarRange className="h-3.5 w-3.5" />
                  Bulanan
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {periodMode === "harian" ? (
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="filter-date">Tanggal</Label>
                <Input
                  id="filter-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-10"
                />
              </div>
            ) : (
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="filter-month">Bulan</Label>
                <Input
                  id="filter-month"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="h-10"
                />
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Menampilkan data untuk{" "}
              <span className="font-medium text-foreground">
                {formatPeriodLabel(periodMode, periodValue)}
              </span>
            </p>
          </CardContent>
        </Card>
        </motion.div>

        <motion.section
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={staggerItem}>
          <Card size="sm" className="shadow-sm">
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">Total pemasukan</p>
              <p className="text-xl font-semibold text-emerald-600 tabular-nums">
                {formatRupiah(summary.masuk)}
              </p>
            </CardContent>
          </Card>
          </motion.div>
          <motion.div variants={staggerItem}>
          <Card size="sm" className="shadow-sm">
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">Total pengeluaran</p>
              <p className="text-xl font-semibold text-destructive tabular-nums">
                {formatRupiah(summary.keluar)}
              </p>
            </CardContent>
          </Card>
          </motion.div>
          <motion.div variants={staggerItem}>
          <Card size="sm" className="shadow-sm">
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">Selisih periode</p>
              <p
                className={cn(
                  "text-xl font-semibold tabular-nums",
                  summary.net >= 0 ? "text-emerald-600" : "text-destructive"
                )}
              >
                {summary.net >= 0 ? "+" : "−"}
                {formatRupiah(Math.abs(summary.net))}
              </p>
            </CardContent>
          </Card>
          </motion.div>
        </motion.section>

        {categoryRows.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Rekap per kategori</CardTitle>
              <CardDescription>
                Pemasukan & pengeluaran per kategori pada periode terpilih
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {categoryRows.map((cat) => {
                const net = cat.masuk - cat.keluar;
                return (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5"
                  >
                    <span
                      className="h-8 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">
                        +{formatRupiah(cat.masuk)} · −{formatRupiah(cat.keluar)}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "text-xs font-semibold tabular-nums",
                        net >= 0 ? "text-emerald-600" : "text-destructive"
                      )}
                    >
                      {net >= 0 ? "+" : "−"}
                      {formatRupiah(Math.abs(net))}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {fundSourceRows.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Rekap per tipe penyimpanan</CardTitle>
              <CardDescription>
                Cash, bank, dan e-wallet pada periode terpilih
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {fundSourceRows.map((src) => {
                const net = src.masuk - src.keluar;
                return (
                  <div
                    key={src.id}
                    className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5"
                  >
                    <span
                      className="h-8 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: src.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{src.name}</p>
                      <p className="text-xs text-muted-foreground">
                        +{formatRupiah(src.masuk)} · −{formatRupiah(src.keluar)}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "text-xs font-semibold tabular-nums",
                        net >= 0 ? "text-emerald-600" : "text-destructive"
                      )}
                    >
                      {net >= 0 ? "+" : "−"}
                      {formatRupiah(Math.abs(net))}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <motion.div variants={staggerItem} initial="initial" animate="animate">
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
            <div>
              <CardTitle className="text-base">Daftar transaksi</CardTitle>
              <CardDescription>
                {filteredTx.length} dari {periodAll.length} transaksi pada
                periode ini
                {typeFilter !== "all" && ` · ${typeFilter}`}
              </CardDescription>
            </div>
            <Tabs
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as TxTypeFilter)}
            >
              <TabsList>
                <TabsTrigger value="all">Semua</TabsTrigger>
                <TabsTrigger value="masuk">Pemasukan</TabsTrigger>
                <TabsTrigger value="keluar">Pengeluaran</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="p-0">
            {filteredTx.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <Wallet className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Tidak ada transaksi</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                  Tidak ada pemasukan/pengeluaran pada periode yang dipilih.
                  Coba tanggal atau bulan lain.
                </p>
                <Link
                  href="/dashboard"
                  className={cn(buttonVariants({ size: "sm" }), "mt-4")}
                >
                  Kembali ke dashboard
                </Link>
              </div>
            ) : (
              <ul className="divide-y">
                {filteredTx.map((tx) => (
                  <li key={tx.id} className="px-4 py-3.5 sm:px-5">
                    <div className="flex gap-3">
                      <div
                        className={cn(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                          tx.type === "masuk"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        )}
                      >
                        {tx.type === "masuk" ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">
                              {tx.category.name}
                              {tx.fundSource && (
                                <span className="text-muted-foreground font-normal">
                                  {" "}
                                  · {tx.fundSource.name}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatTransactionDate(tx.date)}
                            </p>
                            {tx.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {tx.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p
                              className={cn(
                                "text-sm font-semibold tabular-nums",
                                tx.type === "masuk"
                                  ? "text-emerald-600"
                                  : "text-destructive"
                              )}
                            >
                              {tx.type === "masuk" ? "+" : "−"}
                              {formatRupiah(tx.amount)}
                            </p>
                            <Badge
                              variant="outline"
                              className="mt-1 text-[10px] capitalize"
                            >
                              {tx.type === "masuk" ? "Pemasukan" : "Pengeluaran"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        </motion.div>
      </main>

      <AppFooter className="mt-auto border-t bg-background/95" />
    </div>
  );
}
