"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { notifyInfo } from "@/lib/notify";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 menit
const STORAGE_KEY = "rekapuang_last_activity";
const CHECK_INTERVAL_MS = 30 * 1000; // cek setiap 30 detik

/**
 * Hook untuk auto-logout setelah user tidak aktif selama 30 menit.
 * Sync antar tab via localStorage.
 */
export function useInactivityLogout() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoggingOutRef = useRef(false);

  const doLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // best-effort logout
    }

    await notifyInfo(
      "Sesi berakhir",
      "Tidak ada aktivitas lebih dari 30 menit. Silakan login kembali.",
      1800
    );
    router.push("/login");
    router.refresh();
  }, [router]);

  const updateActivity = useCallback(() => {
    if (isLoggingOutRef.current) return;
    const now = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY, String(now));
    } catch {
      // localStorage not available — silently ignore
    }
  }, []);

  useEffect(() => {
    // Set initial activity time
    updateActivity();

    // Events yang menandakan user aktif
    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "pointermove",
    ];

    // Throttled activity update — max sekali per 10 detik untuk performa
    let lastUpdate = Date.now();
    const throttledUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate > 10_000) {
        lastUpdate = now;
        updateActivity();
      }
    };

    // Listen ke semua events
    for (const event of events) {
      window.addEventListener(event, throttledUpdate, { passive: true });
    }

    // Listen perubahan localStorage dari tab lain
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        // Tab lain aktif — tidak perlu apa-apa, interval check akan
        // mengecek timestamp terbaru
      }
    };
    window.addEventListener("storage", handleStorage);

    // Periodic check — cek apakah sudah melewati timeout
    const intervalId = setInterval(() => {
      if (isLoggingOutRef.current) return;

      let lastActivity: number;
      try {
        lastActivity = Number(localStorage.getItem(STORAGE_KEY)) || 0;
      } catch {
        lastActivity = 0;
      }

      const elapsed = Date.now() - lastActivity;
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        doLogout();
      }
    }, CHECK_INTERVAL_MS);

    // Cleanup
    return () => {
      for (const event of events) {
        window.removeEventListener(event, throttledUpdate);
      }
      window.removeEventListener("storage", handleStorage);
      clearInterval(intervalId);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [updateActivity, doLogout]);
}
