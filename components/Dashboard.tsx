"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  LogOut,
  Minus,
  Pencil,
  Wallet,
  Plus,
  Trash2,
  History,
  ChevronRight,
} from "lucide-react";
import TransactionModal, {
  type Category,
  type FundSource,
  type Transaction,
} from "./TransactionModal";
import FundSourceIcon, { FUND_ICON } from "./FundSourceIcon";
import FundStorageListItem from "./FundStorageListItem";
import DashboardLoadingScreen from "./DashboardLoadingScreen";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import AppFooter from "./AppFooter";
import { APP_NAME } from "@/lib/brand";
import {
  formatRupiah,
  formatTransactionDate,
  sortTransactionsNewestFirst,
} from "@/lib/transactions-display";
import type { DashboardData } from "@/lib/dashboard-data";
import {
  orderRecapAllRows,
  pickRecapPreviewRows,
} from "@/lib/fund-sources";
import { headerSlide, staggerContainer, staggerItem } from "@/lib/motion";
import { confirmAction, notifyError, notifySuccess } from "@/lib/notify";

type Summary = {
  saldo: number;
  totalMasuk: number;
  totalKeluar: number;
};

type RecapRow = {
  id: string;
  name: string;
  slug: string;
  color: string;
  masuk: number;
  keluar: number;
};

function RecapGrid({ rows }: { rows: RecapRow[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rows.map((row) => (
        <RecapRowItem key={row.id} row={row} />
      ))}
    </div>
  );
}

function RecapRowItem({
  row,
  href,
  variant = "category",
}: {
  row: RecapRow;
  href?: string;
  variant?: "category" | "fund";
}) {
  const net = row.masuk - row.keluar;

  if (variant === "fund") {
    return (
      <FundStorageListItem
        slug={row.slug}
        name={row.name}
        masuk={row.masuk}
        keluar={row.keluar}
        href={href}
      />
    );
  }

  const inner = (
    <>
      <span
        className="h-8 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: row.color }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{row.name}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          +{formatRupiah(row.masuk)} · −{formatRupiah(row.keluar)}
        </p>
      </div>
      <p
        className={cn(
          "shrink-0 text-xs font-semibold tabular-nums whitespace-nowrap",
          net >= 0 ? "text-emerald-600" : "text-destructive"
        )}
      >
        {net >= 0 ? "+" : "−"}
        {formatRupiah(Math.abs(net))}
      </p>
    </>
  );

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
      {inner}
    </div>
  );
}

function CollapsibleRecapGrid({ rows }: { rows: RecapRow[] }) {
  const [expanded, setExpanded] = useState(false);

  const previewRows = useMemo(() => pickRecapPreviewRows(rows), [rows]);
  const allRows = useMemo(() => orderRecapAllRows(rows), [rows]);

  const visible = expanded ? allRows : previewRows;
  const hasMore = allRows.length > previewRows.length;
  const hiddenCount = allRows.length - previewRows.length;

  if (allRows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        Belum ada data tipe penyimpanan.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {visible.map((row) => (
          <RecapRowItem
            key={row.id}
            row={row}
            variant="fund"
            href={`/dashboard/penyimpanan/${row.slug}`}
          />
        ))}
      </div>
      {hasMore && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded
            ? "Tampilkan lebih sedikit"
            : `Selengkapnya (${hiddenCount} bank & e-wallet lainnya)`}
        </Button>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  variant,
}: {
  title: string;
  value: string;
  description?: string;
  icon: React.ElementType;
  variant: "default" | "success" | "destructive";
}) {
  const iconClass =
    variant === "success"
      ? "bg-emerald-100 text-emerald-700"
      : variant === "destructive"
        ? "bg-red-100 text-red-700"
        : "bg-primary/10 text-primary";

  return (
    <Card size="sm" className="shadow-sm">
      <CardContent className="pt-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="text-xl sm:text-2xl font-semibold tracking-tight truncate">
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              iconClass
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useInactivityLogout } from "@/lib/useInactivityLogout";

type DashboardProps = {
  userName: string;
};

export default function Dashboard({ userName }: DashboardProps) {
  useInactivityLogout();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fundSources, setFundSources] = useState<FundSource[]>([]);
  const [summary, setSummary] = useState<Summary>({
    saldo: 0,
    totalMasuk: 0,
    totalKeluar: 0,
  });
  const [categorySummary, setCategorySummary] = useState<RecapRow[]>([]);
  const [fundSourceSummary, setFundSourceSummary] = useState<RecapRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<Transaction | null>(null);
  const [defaultType, setDefaultType] = useState<"masuk" | "keluar">("masuk");
  const [filter, setFilter] = useState<"all" | "masuk" | "keluar">("all");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/transactions", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data: DashboardData = await res.json();
      setTransactions(data.transactions as Transaction[]);
      setSummary(data.summary);
      setCategorySummary(data.categorySummary);
      setFundSourceSummary(data.fundSourceSummary);
      setCategories(data.categories);
      setFundSources(data.fundSources);
      setReady(true);
    } catch {
      void notifyError("Gagal memuat data", "Silakan coba lagi.");
      setReady(true);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTx = useMemo(() => {
    const list =
      filter === "all"
        ? transactions
        : transactions.filter((t) => t.type === filter);
    return [...list].sort(sortTransactionsNewestFirst);
  }, [transactions, filter]);

  const openModal = (type: "masuk" | "keluar", edit?: Transaction) => {
    setDefaultType(type);
    setEditData(edit || null);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmAction({
      title: "Hapus transaksi?",
      text: "Data yang dihapus tidak bisa dikembalikan.",
      confirmText: "Ya, hapus",
      cancelText: "Batal",
    });
    if (!ok) return;
    const previous = transactions;
    setTransactions((curr) => curr.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      void notifySuccess("Berhasil", "Transaksi dihapus");
      fetchData();
    } catch {
      setTransactions(previous);
      void notifyError("Gagal", "Transaksi gagal dihapus");
    }
  };

  const handleLogout = async () => {
    const ok = await confirmAction({
      title: "Yakin ingin logout?",
      text: "Anda harus login kembali untuk melanjutkan.",
      confirmText: "Ya, logout",
      cancelText: "Batal",
    });
    if (!ok) return;
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  if (!ready) {
    return <DashboardLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <motion.header
        initial="initial"
        animate="animate"
        variants={headerSlide}
        className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold sm:text-lg">
                {APP_NAME}
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                Halo, {userName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex gap-2">
              <Button size="sm" onClick={() => openModal("masuk")}>
                <Plus className="h-4 w-4" />
                Masuk
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openModal("keluar")}
              >
                <Minus className="h-4 w-4" />
                Keluar
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="shrink-0"
            >
              <LogOut className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-5 px-4 py-5 sm:px-6 sm:py-6">
        <motion.section
          className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={staggerItem}>
            <StatCard
              title="Saldo saat ini"
              value={formatRupiah(summary.saldo)}
              icon={Wallet}
              variant="default"
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              title="Total masuk"
              value={formatRupiah(summary.totalMasuk)}
              icon={ArrowDownLeft}
              variant="success"
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              title="Total keluar"
              value={formatRupiah(summary.totalKeluar)}
              icon={ArrowUpRight}
              variant="destructive"
            />
          </motion.div>
        </motion.section>

        <motion.div variants={staggerItem} initial="initial" animate="animate">
          <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rekap per kategori</CardTitle>
            <CardDescription>
              Ringkasan pemasukan dan pengeluaran tiap kategori
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecapGrid rows={categorySummary} />
          </CardContent>
        </Card>
        </motion.div>

        <motion.div variants={staggerItem} initial="initial" animate="animate">
          <Card className="shadow-sm">
          <CardHeader className="pb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base">Rekap per tipe penyimpanan</CardTitle>
              <CardDescription>
                Cash, BCA, Seabank, Mandiri, ShopeePay, GoPay — ketuk baris
                untuk riwayat lengkap
              </CardDescription>
            </div>
            <Link
              href="/dashboard/penyimpanan"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "shrink-0"
              )}
            >
              Rekap semua penyimpanan
            </Link>
          </CardHeader>
          <CardContent>
            <CollapsibleRecapGrid rows={fundSourceSummary} />
          </CardContent>
        </Card>
        </motion.div>

        <motion.div
          variants={staggerItem}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.12 }}
        >
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
            <div>
              <CardTitle className="text-base">Riwayat transaksi</CardTitle>
              <CardDescription>
                {filteredTx.length} transaksi
                {filter !== "all" && ` · filter ${filter}`}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <Link
                href="/dashboard/history"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "w-full sm:w-auto"
                )}
              >
                <History className="h-4 w-4" />
                Lihat detail
              </Link>
              <Tabs
                value={filter}
                onValueChange={(v) => setFilter(v as typeof filter)}
              >
                <TabsList>
                  <TabsTrigger value="all">Semua</TabsTrigger>
                  <TabsTrigger value="masuk">Masuk</TabsTrigger>
                  <TabsTrigger value="keluar">Keluar</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredTx.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <Wallet className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Belum ada transaksi</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                  Tambahkan saldo masuk atau keluar untuk mulai mencatat
                  keuangan Anda
                </p>
                <Button
                  className="mt-4"
                  size="sm"
                  onClick={() => openModal("masuk")}
                >
                  <Plus className="h-4 w-4" />
                  Tambah transaksi
                </Button>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                        <th className="px-5 py-3 font-medium">Tanggal</th>
                        <th className="px-5 py-3 font-medium">Kategori</th>
                        <th className="px-5 py-3 font-medium">Tipe penyimpanan</th>
                        <th className="px-5 py-3 font-medium">Keterangan</th>
                        <th className="px-5 py-3 font-medium text-right">
                          Jumlah
                        </th>
                        <th className="px-5 py-3 font-medium text-right w-28">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                        {filteredTx.map((tx) => (
                          <tr
                            key={tx.id}
                            className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-5 py-3 whitespace-nowrap">
                              {formatTransactionDate(tx.date)}
                            </td>
                            <td className="px-5 py-3">
                              <span className="inline-flex items-center gap-1.5">
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: tx.category.color }}
                                />
                                {tx.category.name}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              {tx.fundSource ? (
                                <span className="inline-flex items-center gap-2">
                                  <FundSourceIcon
                                    slug={tx.fundSource.slug}
                                    size={FUND_ICON.table}
                                  />
                                  {tx.fundSource.name}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-muted-foreground max-w-[200px] truncate">
                              {tx.description || "—"}
                            </td>
                            <td
                              className={cn(
                                "px-5 py-3 text-right font-semibold tabular-nums whitespace-nowrap",
                                tx.type === "masuk"
                                  ? "text-emerald-600"
                                  : "text-destructive"
                              )}
                            >
                              {tx.type === "masuk" ? "+" : "−"}
                              {formatRupiah(tx.amount)}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() =>
                                    openModal(tx.type as "masuk" | "keluar", tx)
                                  }
                                  aria-label="Edit"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(tx.id)}
                                  aria-label="Hapus"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <ul className="md:hidden divide-y">
                  {filteredTx.map((tx) => (
                    <li
                      key={tx.id}
                      className="px-4 py-3.5"
                    >
                      <div className="flex gap-3">
                        <span
                          className="mt-1 h-8 w-1 shrink-0 rounded-full"
                          style={{ backgroundColor: tx.category.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="truncate text-sm font-medium">
                                {tx.category.name}
                              </p>
                              {tx.fundSource && (
                                <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <FundSourceIcon
                                    slug={tx.fundSource.slug}
                                    size={FUND_ICON.inline}
                                  />
                                  {tx.fundSource.name}
                                </span>
                              )}
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatTransactionDate(tx.date)}
                                {tx.description && ` · ${tx.description}`}
                              </p>
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
                                {tx.type}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-2 flex gap-2">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() =>
                                openModal(tx.type as "masuk" | "keluar", tx)
                              }
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="xs"
                              className="text-destructive"
                              onClick={() => handleDelete(tx.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                              Hapus
                            </Button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
        </motion.div>
      </main>

      <AppFooter className="mt-auto border-t bg-background/95 pb-28 sm:pb-4" />

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/80 p-3 backdrop-blur-lg sm:hidden shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex max-w-lg gap-2">
          <Button className="flex-1 rounded-xl h-12 shadow-sm" onClick={() => openModal("masuk")}>
            <Plus className="h-5 w-5 mr-1" />
            Masuk
          </Button>
          <Button
            className="flex-1 rounded-xl h-12 shadow-sm bg-white"
            variant="outline"
            onClick={() => openModal("keluar")}
          >
            <Minus className="h-5 w-5 mr-1" />
            Keluar
          </Button>
        </div>
      </div>

      <TransactionModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditData(null);
        }}
        onSaved={fetchData}
        categories={categories}
        fundSources={fundSources}
        editData={editData}
        defaultType={defaultType}
      />
    </div>
  );
}
