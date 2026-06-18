import Link from "next/link";
import { cn } from "@/lib/utils";

type AppFooterProps = {
  className?: string;
  variant?: "default" | "onPrimary";
};

export default function AppFooter({
  className,
  variant = "default",
}: AppFooterProps) {
  const linkClass =
    variant === "onPrimary"
      ? "text-primary-foreground/80 hover:text-primary-foreground underline-offset-4 hover:underline"
      : "text-primary hover:underline underline-offset-4";

  return (
    <footer
      className={cn(
        "w-full shrink-0 py-4 text-center text-xs space-y-1.5",
        variant === "onPrimary"
          ? "text-primary-foreground/70"
          : "text-muted-foreground",
        className
      )}
    >
      <p>
        <Link href="/feedback" className={linkClass}>
          Laporkan masalah / Beri saran
        </Link>
      </p>
      <p>© Copyright Taqy Nabil Adriano 2026</p>
    </footer>
  );
}
