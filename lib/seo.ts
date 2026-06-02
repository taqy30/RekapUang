import type { Metadata } from "next";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";

const DEFAULT_DESCRIPTION =
  "Catat pemasukan dan pengeluaran, rekap per kategori dan tipe penyimpanan (Cash, bank, e-wallet), serta pantau riwayat harian atau bulanan.";

export function getSiteUrl() {
  const fromEnv = process.env.APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

export const siteConfig = {
  name: APP_NAME,
  tagline: APP_TAGLINE,
  description: DEFAULT_DESCRIPTION,
  locale: "id_ID",
  keywords: [
    "rekap uang",
    "catat pengeluaran",
    "catat pemasukan",
    "aplikasi keuangan pribadi",
    "rekapitulasi keuangan",
    "dompet digital",
    "e-wallet",
  ],
};

type PageMetaOptions = {
  title: string;
  description?: string;
  path: string;
  noIndex?: boolean;
};

export function createPageMetadata({
  title,
  description = siteConfig.description,
  path,
  noIndex = false,
}: PageMetaOptions): Metadata {
  const url = getSiteUrl();
  const canonical = `${url}${path}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: canonical,
      siteName: siteConfig.name,
      title: `${title} | ${siteConfig.name}`,
      description,
    },
    twitter: {
      card: "summary",
      title: `${title} | ${siteConfig.name}`,
      description,
    },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${siteConfig.name} — Rekapitulasi Keuangan`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — Rekapitulasi Keuangan`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary",
    title: `${siteConfig.name} — Rekapitulasi Keuangan`,
    description: siteConfig.description,
  },
  alternates: {
    canonical: "/",
  },
};
