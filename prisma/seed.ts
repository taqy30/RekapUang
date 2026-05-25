import { PrismaClient } from "@prisma/client";
import {
  FUND_SOURCES,
  FUND_SLUGS_IN_CATEGORY_TABLE,
  DEPRECATED_FUND_SOURCE_SLUGS,
  DEFAULT_FUND_SOURCE_SLUG,
} from "../lib/fund-sources";

const prisma = new PrismaClient();

const expenseCategories = [
  { name: "Kebutuhan Darurat", slug: "darurat", color: "#dc2626" },
  { name: "Biaya Hidup", slug: "biaya-hidup", color: "#2563eb" },
  { name: "Tabungan", slug: "tabungan", color: "#0f766e" },
  { name: "Investasi", slug: "investasi", color: "#7c3aed" },
  { name: "Hiburan", slug: "hiburan", color: "#ea580c" },
  { name: "Lainnya", slug: "lainnya", color: "#64748b" },
];

async function main() {
  for (const cat of expenseCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, color: cat.color },
      create: cat,
    });
  }

  for (const slug of FUND_SLUGS_IN_CATEGORY_TABLE) {
    const wrong = await prisma.category.findUnique({ where: { slug } });
    if (!wrong) continue;
    const txCount = await prisma.transaction.count({
      where: { categoryId: wrong.id },
    });
    if (txCount === 0) {
      await prisma.category.delete({ where: { id: wrong.id } });
    }
  }

  for (const src of FUND_SOURCES) {
    await prisma.fundSource.upsert({
      where: { slug: src.slug },
      update: { name: src.name, color: src.color },
      create: { name: src.name, slug: src.slug, color: src.color },
    });
  }

  let defaultFund = await prisma.fundSource.findUnique({
    where: { slug: DEFAULT_FUND_SOURCE_SLUG },
  });

  for (const slug of DEPRECATED_FUND_SOURCE_SLUGS) {
    const obsolete = await prisma.fundSource.findUnique({ where: { slug } });
    if (!obsolete) continue;
    const txCount = await prisma.transaction.count({
      where: { fundSourceId: obsolete.id },
    });
    if (txCount === 0) {
      await prisma.fundSource.delete({ where: { id: obsolete.id } });
      continue;
    }
    if (defaultFund) {
      await prisma.transaction.updateMany({
        where: { fundSourceId: obsolete.id },
        data: { fundSourceId: defaultFund.id },
      });
      await prisma.fundSource.delete({ where: { id: obsolete.id } });
    }
  }

  defaultFund = await prisma.fundSource.findUnique({
    where: { slug: DEFAULT_FUND_SOURCE_SLUG },
  });
  if (defaultFund) {
    await prisma.transaction.updateMany({
      where: { fundSourceId: null },
      data: { fundSourceId: defaultFund.id },
    });
  }

  console.log("Kategori & tipe penyimpanan berhasil di-seed.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
