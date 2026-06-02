"use client";

import Swal from "sweetalert2";

type NotifyIcon = "success" | "error" | "warning" | "info";

type NotifyOptions = {
  icon: NotifyIcon;
  title: string;
  text?: string;
  timer?: number;
};

type ConfirmOptions = {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: "warning" | "question" | "info";
};

export async function showNotify({
  icon,
  title,
  text,
  timer = 1800,
}: NotifyOptions) {
  try {
    await Swal.fire({
      icon,
      title,
      text,
      timer,
      timerProgressBar: true,
      showConfirmButton: false,
      allowOutsideClick: true,
      allowEscapeKey: true,
      heightAuto: false,
      customClass: {
        popup: "rounded-xl",
        title: "text-base font-semibold",
        htmlContainer: "text-sm",
      },
    });
  } catch {
    if (typeof window !== "undefined") {
      window.alert(text ? `${title}\n${text}` : title);
    }
  }
}

export function notifySuccess(title: string, text?: string, timer?: number) {
  return showNotify({ icon: "success", title, text, timer });
}

export function notifyError(title: string, text?: string, timer?: number) {
  return showNotify({ icon: "error", title, text, timer });
}

export function notifyInfo(title: string, text?: string, timer?: number) {
  return showNotify({ icon: "info", title, text, timer });
}

export async function confirmAction({
  title,
  text,
  confirmText = "Ya",
  cancelText = "Batal",
  icon = "warning",
}: ConfirmOptions): Promise<boolean> {
  try {
    const result = await Swal.fire({
      icon,
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true,
      focusCancel: true,
      heightAuto: false,
      customClass: {
        popup: "rounded-xl",
        title: "text-base font-semibold",
        htmlContainer: "text-sm",
      },
    });
    return result.isConfirmed;
  } catch {
    if (typeof window !== "undefined") {
      return window.confirm(text ? `${title}\n${text}` : title);
    }
    return false;
  }
}
