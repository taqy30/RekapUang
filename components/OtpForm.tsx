"use client";

import { useEffect, useState } from "react";
import { goToDashboardAfterAuth } from "@/lib/navigation";
import { notifyError, notifySuccess } from "@/lib/notify";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type OtpFormProps = {
  email: string;
  onBack: () => void;
};

const RESEND_COOLDOWN = 60;

export default function OtpForm({ email, onBack }: OtpFormProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const submit = async () => {
    if (code.length !== 6) {
      setError("Masukkan 6 digit kode OTP");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        const message = data.error || "Verifikasi gagal";
        setError(message);
        if (res.status === 409) {
          void notifyError(
            "Email sudah terdaftar",
            "Silakan masuk dengan akun yang sudah ada.",
            2800
          );
        }
        setCode("");
        setLoading(false);
        return;
      }

      setLoading(false);
      goToDashboardAfterAuth("Verifikasi berhasil. Selamat datang!");
      return;
    } catch {
      setError("Koneksi gagal, coba lagi");
      setLoading(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        void notifyError("Gagal", data.error || "Gagal mengirim ulang");
        return;
      }
      void notifySuccess(
        "Kode terkirim",
        "Kode baru dikirim ke Inbox Utama email Anda."
      );
      setCooldown(RESEND_COOLDOWN);
    } catch {
      void notifyError("Koneksi gagal", "Periksa internet lalu coba lagi.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Mail className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-center">
            Verifikasi Email
          </h2>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Kode 6 digit dikirim ke{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
          <p className="text-xs text-muted-foreground text-center mt-2 leading-relaxed">
            Buka folder <span className="font-medium text-foreground">Inbox Utama</span>{" "}
            pada email di atas. Kode biasanya tiba dalam beberapa detik.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={setCode}
          onComplete={submit}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} className="h-12 w-11 sm:w-12 text-lg" />
            <InputOTPSlot index={1} className="h-12 w-11 sm:w-12 text-lg" />
            <InputOTPSlot index={2} className="h-12 w-11 sm:w-12 text-lg" />
            <InputOTPSlot index={3} className="h-12 w-11 sm:w-12 text-lg" />
            <InputOTPSlot index={4} className="h-12 w-11 sm:w-12 text-lg" />
            <InputOTPSlot index={5} className="h-12 w-11 sm:w-12 text-lg" />
          </InputOTPGroup>
        </InputOTP>

        {error && (
          <Alert variant="destructive" className="w-full">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          className="w-full h-10"
          onClick={submit}
          disabled={loading || code.length !== 6}
        >
          {loading ? "Memverifikasi..." : "Verifikasi & Masuk"}
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Tidak menerima kode?{" "}
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
        >
          {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : "Kirim ulang"}
        </button>
      </p>

      <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Ganti email
      </Button>
    </div>
  );
}
