import { cn } from "@/lib/utils";

type AppFooterProps = {
  className?: string;
  variant?: "default" | "onPrimary";
};

export default function AppFooter({
  className,
  variant = "default",
}: AppFooterProps) {
  return (
    <footer
      className={cn(
        "w-full shrink-0 py-4 text-center text-xs",
        variant === "onPrimary"
          ? "text-primary-foreground/70"
          : "text-muted-foreground",
        className
      )}
    >
      <p>© Copyright Taqy Nabil Adriano 2026</p>
    </footer>
  );
}
