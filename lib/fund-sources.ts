/** Tipe penyimpanan uang (tabel FundSource — terpisah dari Category). */
export type StorageKind = "cash" | "bank" | "ewallet";

export type FundSourceSeed = {
  name: string;
  slug: string;
  color: string;
  kind: StorageKind;
};

export const STORAGE_KIND_LABELS: Record<StorageKind, string> = {
  cash: "Tunai",
  bank: "Bank",
  ewallet: "E-Wallet",
};

/** Hanya tipe yang umum dipakai di Indonesia. */
export const FUND_SOURCES: FundSourceSeed[] = [
  { name: "Cash", slug: "cash", color: "#16a34a", kind: "cash" },
  { name: "BCA", slug: "bca", color: "#003d79", kind: "bank" },
  { name: "Seabank", slug: "seabank", color: "#ff6b00", kind: "bank" },
  { name: "Mandiri", slug: "mandiri", color: "#f59e0b", kind: "bank" },
  { name: "BRI", slug: "bri", color: "#00529c", kind: "bank" },
  { name: "BNI", slug: "bni", color: "#f97316", kind: "bank" },
  { name: "BSI", slug: "bsi", color: "#0d9488", kind: "bank" },
  { name: "Dana", slug: "dana", color: "#108ee9", kind: "ewallet" },
  { name: "GoPay", slug: "gopay", color: "#00aed6", kind: "ewallet" },
  { name: "ShopeePay", slug: "shopeepay", color: "#ee4d2d", kind: "ewallet" },
  { name: "OVO", slug: "ovo", color: "#4c3494", kind: "ewallet" },
];

const SLUG_ORDER = FUND_SOURCES.map((s) => s.slug);

/** Dihapus dari DB jika tidak ada transaksi (sisa daftar lama). */
export const DEPRECATED_FUND_SOURCE_SLUGS = [
  "jenius",
  "cimb",
  "permata",
  "btn",
  "ocbc",
  "danamon",
  "maybank",
  "jago",
  "blu",
  "linkaja",
  "lainnya-fund",
] as const;

export const STORAGE_KIND_ORDER: StorageKind[] = ["cash", "bank", "ewallet"];

export const FUND_SLUGS_IN_CATEGORY_TABLE = [
  "cash",
  "bca",
  "seabank",
  "mandiri",
  "bri",
  "bni",
  "bsi",
  "dana",
  "ovo",
  "gopay",
  "linkaja",
  "shopeepay",
  "lainnya",
] as const;

export const DEFAULT_FUND_SOURCE_SLUG = "cash";

/** 6 tipe yang ditampilkan di dashboard sebelum "Selengkapnya". */
export const FUND_SOURCE_RECAP_PREVIEW_SLUGS = [
  "cash",
  "bca",
  "seabank",
  "mandiri",
  "shopeepay",
  "gopay",
] as const;

export const FUND_SOURCE_RECAP_PREVIEW =
  FUND_SOURCE_RECAP_PREVIEW_SLUGS.length;

export function sortFundSources<T extends { slug: string }>(sources: T[]): T[] {
  return [...sources].sort((a, b) => {
    const ia = SLUG_ORDER.indexOf(a.slug as (typeof SLUG_ORDER)[number]);
    const ib = SLUG_ORDER.indexOf(b.slug as (typeof SLUG_ORDER)[number]);
    const orderA = ia === -1 ? 999 : ia;
    const orderB = ib === -1 ? 999 : ib;
    if (orderA !== orderB) return orderA - orderB;
    return a.slug.localeCompare(b.slug);
  });
}

export function hasFundSourceActivity(row: {
  masuk: number;
  keluar: number;
}): boolean {
  return row.masuk > 0 || row.keluar > 0;
}

/** Hanya tipe penyimpanan yang sudah punya transaksi (masuk/keluar). */
export function filterFundSourceRowsWithActivity<
  T extends { masuk: number; keluar: number; slug: string },
>(rows: T[]): T[] {
  return orderRecapAllRows(rows.filter(hasFundSourceActivity));
}

export function pickRecapPreviewRows<T extends { slug: string }>(
  rows: T[]
): T[] {
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  return FUND_SOURCE_RECAP_PREVIEW_SLUGS.flatMap((slug) => {
    const row = bySlug.get(slug);
    return row ? [row] : [];
  });
}

export function orderRecapAllRows<T extends { slug: string }>(rows: T[]): T[] {
  return sortFundSources(rows);
}

export function getStorageKindBySlug(slug: string): StorageKind {
  return FUND_SOURCES.find((s) => s.slug === slug)?.kind ?? "bank";
}
