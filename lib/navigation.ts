import { notifySuccess } from "@/lib/notify";

export function goToDashboardAfterAuth(message = "Login berhasil") {
  void notifySuccess("Berhasil", message, 1200).finally(() => {
    window.location.href = "/dashboard";
  });
}
