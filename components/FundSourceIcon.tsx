"use client";

import { Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import { FUND_SOURCES } from "@/lib/fund-sources";
import { getFundSourceLogoSrc } from "@/lib/fund-source-brand-assets";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type FundIconSize = "xs" | "sm" | "md" | "lg";

/** Ukuran ikon (Tailwind) — konsisten di seluruh UI */
export const FUND_ICON: Record<
  "recap" | "table" | "inline" | "select" | "header",
  FundIconSize
> = {
  recap: "md",
  table: "xs",
  inline: "xs",
  select: "sm",
  header: "lg",
};

const SIZE_CLASS: Record<FundIconSize, string> = {
  xs: "size-5",
  sm: "size-6",
  md: "size-8",
  lg: "size-10",
};

const ICON_INNER: Record<FundIconSize, string> = {
  xs: "size-2.5",
  sm: "size-3",
  md: "size-4",
  lg: "size-5",
};

const BRAND_ICON_SLUGS = new Set([
  "bca",
  "seabank",
  "mandiri",
  "bri",
  "bni",
  "bsi",
  "dana",
  "gopay",
  "shopeepay",
  "ovo",
]);

type FundSourceIconProps = {
  slug: string;
  size?: FundIconSize;
  className?: string;
};

export default function FundSourceIcon({
  slug,
  size = "sm",
  className,
}: FundSourceIconProps) {
  const meta = FUND_SOURCES.find((s) => s.slug === slug);
  const color = meta?.color ?? "#64748b";
  const box = SIZE_CLASS[size];

  if (slug === "cash") {
    return (
      <Avatar
        className={cn(box, "bg-emerald-600 ring-emerald-600/30", className)}
      >
        <span className="flex size-full items-center justify-center">
          <Banknote className={cn(ICON_INNER[size], "text-white")} strokeWidth={2} />
        </span>
      </Avatar>
    );
  }

  if (BRAND_ICON_SLUGS.has(slug)) {
    const src = getFundSourceLogoSrc(slug);
    return (
      <Avatar className={cn(box, "bg-muted/40", className)}>
        {src ? (
          <AvatarImage
            src={src}
            alt={meta?.name ?? slug}
            width={32}
            height={32}
          />
        ) : (
          <AvatarFallback style={{ backgroundColor: color }}>
            {meta?.name?.slice(0, 2).toUpperCase() ?? slug.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>
    );
  }

  const label =
    meta?.name?.slice(0, 2).toUpperCase() ?? slug.slice(0, 2).toUpperCase();

  return (
    <Avatar className={cn(box, className)}>
      <AvatarFallback style={{ backgroundColor: color }}>{label}</AvatarFallback>
    </Avatar>
  );
}
