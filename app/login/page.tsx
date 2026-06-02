import AuthForm from "@/components/AuthForm";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Masuk",
  description:
    "Masuk ke RekapUang untuk melihat dashboard rekapitulasi keuangan, transaksi, dan rekap per kategori.",
  path: "/login",
});

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
