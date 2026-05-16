import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";

export function goToDashboardAfterAuth(
  router: AppRouterInstance,
  message = "Login berhasil"
) {
  toast.success(message);
  router.replace("/dashboard");
}
