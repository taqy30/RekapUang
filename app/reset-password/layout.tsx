import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Reset Password",
  description: "Atur password baru untuk akun RekapUang Anda.",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
