import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Lupa Password",
  description:
    "Reset password RekapUang melalui email. Masukkan alamat email terdaftar untuk menerima tautan pemulihan.",
  path: "/forgot-password",
});

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
