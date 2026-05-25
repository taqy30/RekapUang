/** Ekstensi file logo per slug di `public/icons/fund-sources/` */
export const FUND_SOURCE_LOGO_EXT: Partial<
  Record<string, "svg" | "png" | "webp">
> = {
  mandiri: "png",
  shopeepay: "png",
};

export function getFundSourceLogoSrc(slug: string): string | null {
  const ext = FUND_SOURCE_LOGO_EXT[slug] ?? "svg";
  return `/icons/fund-sources/${slug}.${ext}`;
}
