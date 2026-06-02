import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createPageMetadata } from "@/lib/seo";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";

export const metadata = createPageMetadata({
  title: "Beranda",
  description:
    "RekapUang membantu Anda mencatat pemasukan, pengeluaran, dan rekap keuangan per kategori serta tipe penyimpanan.",
  path: "/",
});

export default async function HomePage() {
  const session = (await cookies()).get("rekapuang_session");
  if (session?.value) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-muted/40 px-4 py-12 text-center">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {APP_NAME}
      </h1>
      <p className="max-w-lg text-muted-foreground text-base sm:text-lg">
        {APP_TAGLINE}. Catat saldo masuk dan keluar, kelompokkan per kategori,
        dan pantau rekap keuangan dalam satu dashboard.
      </p>
      <nav
        className="flex flex-wrap items-center justify-center gap-3"
        aria-label="Navigasi utama"
      >
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Masuk
        </Link>
        <Link
          href="/register"
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium hover:bg-accent"
        >
          Daftar akun
        </Link>
      </nav>
    </main>
  );
}
