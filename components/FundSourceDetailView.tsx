"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
  summarizeTransactions,
  todayDateKey,
} from "@/lib/transactions-display";
import type { FundSourceDetailData } from "@/lib/fund-source-detail";
import { headerSlide, staggerContainer, staggerItem } from "@/lib/motion";

type FundSourceDetailViewProps = {
  userName: string;
  slug: string;
};

export default function FundSourceDetailView({
  userName,
  slug,
}: FundSourceDetailViewProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [fundSourceName, setFundSourceName] = useState("");
  const [fundSourceColor, setFundSourceColor] = useState("#64748b");
  const [allTimeSummary, setAllTimeSummary] = useState({
    saldo: 0,
    totalMasuk: 0,
    totalKeluar: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [periodMode, setPeriodMode] = useState<PeriodMode>("harian");
  const [selectedDate, setSelectedDate] = useState(todayDateKey());
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [typeFilter, setTypeFilter] = useState<TxTypeFilter>("all");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/fund-sources/${slug}`, {
        cache: "no-store",
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 404) {
        setNotFound(true);
        setReady(true);
        return;
      }
      const data: FundSourceDetailData = await res.json();
      setFundSourceName(data.fundSource.name);
      setFundSourceColor(data.fundSource.color);
      setAllTimeSummary(data.summary);
      setTransactions(data.transactions as Transaction[]);
      setReady(true);
    } catch {
      toast.error("Gagal memuat data");
      setReady(true);
    }
  }, [router, slug]);

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

  const periodSummary = useMemo(
    () => summarizeTransactions(periodAll),
    [periodAll]
  );

  if (!ready) {
    return <DashboardLoadingScreen />;
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-muted-foreground">
          Tipe penyimpanan tidak ditemukan.
        </p>
        <Link href="/dashboard/penyimpanan" className={buttonVariants()}>
          Kembali ke daftar
        </Link>
      </div>
    );
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
            href="/dashboard/penyimpanan"
            aria-label="Kembali ke daftar penyimpanan"
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${fundSourceColor}22` }}
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: fundSourceColor }}
              />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold sm:text-lg">
                {fundSourceName}
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                Halo, {userName}
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-5 px-4 py-5 sm:px-6 sm:py-6">
        <Card className="shadow-sm border-l-4" style={{ borderLeftColor: fundSourceColor }}>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Saldo total (semua waktu)</p>
            <p
              className={cn(
                "text-2xl sm:text-3xl font-semibold tabular-nums mt-1",
                allTimeSummary.saldo >= 0
                  ? "text-emerald-600"
                  : "text-destructive"
              )}
            >
              {allTimeSummary.saldo >= 0 ? "+" : "−"}
              {formatRupiah(Math.abs(allTimeSummary.saldo))}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Masuk {formatRupiah(allTimeSummary.totalMasuk)} · Keluar{" "}
              {formatRupiah(allTimeSummary.totalKeluar)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filter periode</CardTitle>
            <CardDescription>
              Riwayat harian atau bulanan untuk {fundSourceName}
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
                <Label htmlFor="fs-filter-date">Tanggal</Label>
                <Input
                  id="fs-filter-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-10"
                />
              </div>
            ) : (
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="fs-filter-month">Bulan</Label>
                <Input
                  id="fs-filter-month"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="h-10"
                />
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Periode:{" "}
              <span className="font-medium text-foreground">
                {formatPeriodLabel(periodMode, periodValue)}
              </span>
            </p>
          </CardContent>
        </Card>

        <motion.section
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={staggerItem}>
            <Card size="sm" className="shadow-sm">
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">Pemasukan periode</p>
                <p className="text-xl font-semibold text-emerald-600 tabular-nums">
                  {formatRupiah(periodSummary.masuk)}
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={staggerItem}>
            <Card size="sm" className="shadow-sm">
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">Pengeluaran periode</p>
                <p className="text-xl font-semibold text-destructive tabular-nums">
                  {formatRupiah(periodSummary.keluar)}
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
                    periodSummary.net >= 0
                      ? "text-emerald-600"
                      : "text-destructive"
                  )}
                >
                  {periodSummary.net >= 0 ? "+" : "−"}
                  {formatRupiah(Math.abs(periodSummary.net))}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.section>

        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
            <div>
              <CardTitle className="text-base">Riwayat transaksi</CardTitle>
              <CardDescription>
                {filteredTx.length} dari {periodAll.length} transaksi ·{" "}
                {fundSourceName}
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
                  Tidak ada transaksi {fundSourceName} pada periode ini.
                </p>
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
      </main>

      <AppFooter className="mt-auto border-t bg-background/95" />
    </div>
  );
}
