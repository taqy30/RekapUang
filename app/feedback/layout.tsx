import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Laporkan Masalah & Beri Saran",
  description:
    "Kirim saran fitur, laporan masalah, atau masukan lainnya untuk pengembangan RekapUang.",
  path: "/feedback",
});

export default function FeedbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
