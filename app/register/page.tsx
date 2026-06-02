import AuthForm from "@/components/AuthForm";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Daftar",
  description:
    "Buat akun RekapUang gratis, verifikasi email dengan OTP, dan mulai mencatat pemasukan serta pengeluaran.",
  path: "/register",
});

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
