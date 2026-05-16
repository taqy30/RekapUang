import { toast } from "sonner";

export function goToDashboardAfterAuth(message = "Login berhasil") {
  toast.success(message);
  window.location.href = "/dashboard";
}
