import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Kebutuhan Darurat", slug: "darurat", color: "#dc2626" },
  { name: "Biaya Hidup", slug: "biaya-hidup", color: "#2563eb" },
  { name: "Tabungan", slug: "tabungan", color: "#0f766e" },
  { name: "Investasi", slug: "investasi", color: "#7c3aed" },
  { name: "Hiburan", slug: "hiburan", color: "#ea580c" },
  { name: "Lainnya", slug: "lainnya", color: "#64748b" },
];

async function main() {
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, color: cat.color },
      create: cat,
    });
  }
  console.log("Kategori berhasil di-seed.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
