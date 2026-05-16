import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";

/** Pindah ke dashboard segera setelah login — tanpa refresh() yang memperlambat */
export function goToDashboardAfterAuth(
  router: AppRouterInstance,
  message = "Login berhasil"
) {
  toast.success(message);
  void fetch("/api/transactions", {
    credentials: "include",
    cache: "no-store",
  }).catch(() => {});
  router.replace("/dashboard");
}
