"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, ChevronRight, Wallet } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/transactions-display";
import type { FundSourceSummary } from "@/lib/fund-source-detail";
import { headerSlide, staggerContainer, staggerItem } from "@/lib/motion";

type FundSourceHubViewProps = {
  userName: string;
};

export default function FundSourceHubView({ userName }: FundSourceHubViewProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<FundSourceSummary[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/fund-sources/summary", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setItems(data.items ?? []);
      setReady(true);
    } catch {
      toast.error("Gagal memuat data");
      setReady(true);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
                Rekap tipe penyimpanan
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                Halo, {userName}
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-5 px-4 py-5 sm:px-6 sm:py-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Semua penyimpanan</CardTitle>
            <CardDescription>
              Saldo dari transaksi tercatat (masuk − keluar). Ketuk untuk
              riwayat harian/bulanan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div
              className="grid gap-2 sm:grid-cols-2"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {items.map((item) => (
                <motion.div key={item.id} variants={staggerItem}>
                  <Link
                    href={`/dashboard/penyimpanan/${item.slug}`}
                    className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-3 transition-colors hover:bg-muted/60"
                  >
                    <span
                      className="h-10 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        +{formatRupiah(item.masuk)} · −{formatRupiah(item.keluar)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <p
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          item.saldo >= 0
                            ? "text-emerald-600"
                            : "text-destructive"
                        )}
                      >
                        {item.saldo >= 0 ? "+" : "−"}
                        {formatRupiah(Math.abs(item.saldo))}
                      </p>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </CardContent>
        </Card>
      </main>

      <AppFooter className="mt-auto border-t bg-background/95" />
    </div>
  );
}
