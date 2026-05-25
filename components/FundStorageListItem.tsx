"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/transactions-display";
import FundSourceIcon, { FUND_ICON } from "./FundSourceIcon";

type FundStorageListItemProps = {
  slug: string;
  name: string;
  masuk: number;
  keluar: number;
  href?: string;
};

export default function FundStorageListItem({
  slug,
  name,
  masuk,
  keluar,
  href,
}: FundStorageListItemProps) {
  const net = masuk - keluar;

  const inner = (
    <>
      <FundSourceIcon slug={slug} size={FUND_ICON.recap} className="shrink-0" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-medium leading-none">{name}</p>
        <p className="text-[11px] text-muted-foreground tabular-nums leading-snug">
          +{formatRupiah(masuk)} · −{formatRupiah(keluar)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 pl-1">
        <p
          className={cn(
            "text-xs font-semibold tabular-nums whitespace-nowrap",
            net >= 0 ? "text-emerald-600" : "text-destructive"
          )}
        >
          {net >= 0 ? "+" : "−"}
          {formatRupiah(Math.abs(net))}
        </p>
        {href && (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
      </div>
    </>
  );

  const rowClass =
    "flex w-full min-w-0 items-center gap-2.5 rounded-lg border bg-card px-3 py-2.5 shadow-sm ring-1 ring-foreground/[0.06] transition-colors hover:bg-muted/50";

  if (href) {
    return (
      <Link href={href} className={rowClass}>
        {inner}
      </Link>
    );
  }

  return <div className={rowClass}>{inner}</div>;
}
