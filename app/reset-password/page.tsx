"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Wallet } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { motion } from "framer-motion";
import { fadeUpRelaxed, slideFromLeftRelaxed } from "@/lib/motion";
import AppFooter from "@/components/AppFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <CardContent>
        <Alert variant="destructive">
          <AlertDescription>
            Link reset password tidak valid atau tidak ditemukan.
          </AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm font-medium text-primary hover:underline">
            Kembali ke Login
          </Link>
        </div>
      </CardContent>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Terjadi kesalahan");
        setSubmitting(false);
        return;
      }

      setSuccess(data.message || "Password berhasil diubah.");
      setSubmitting(false);
      
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch {
      setError("Koneksi gagal, coba lagi");
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <CardContent>
        <Alert className="bg-emerald-50 text-emerald-800 border-emerald-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Mengalihkan ke halaman login...
        </p>
      </CardContent>
    );
  }

  return (
    <CardContent>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Password Baru</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 karakter"
              required
              minLength={8}
              maxLength={72}
              className="pr-10 h-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Kombinasi huruf dan angka, minimal 8 karakter
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              required
              minLength={8}
              maxLength={72}
              className="pr-10 h-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowConfirmPassword((v) => !v)}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full h-10"
          disabled={submitting}
        >
          {submitting ? "Menyimpan..." : "Simpan Password Baru"}
        </Button>
      </form>
    </CardContent>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Panel kiri — branding (desktop) */}
        <motion.div
          {...slideFromLeftRelaxed}
          className="hidden lg:flex lg:w-[45%] xl:w-[42%] bg-primary text-primary-foreground flex-col justify-between p-10"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg">{APP_NAME}</span>
          </div>
          <div className="space-y-4 max-w-sm">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight">
              {APP_TAGLINE}
            </h2>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Catat saldo masuk & keluar, kelompokkan per kategori, dan pantau
              rekap keuangan dalam satu dashboard.
            </p>
          </div>
          <p className="text-xs text-primary-foreground/60">
            Aman · Minimalis · Mudah digunakan
          </p>
        </motion.div>

        {/* Panel kanan — form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
          <motion.div {...fadeUpRelaxed} className="w-full max-w-[420px]">
            <Card className="w-full border-0 shadow-lg sm:border sm:shadow-md relative overflow-hidden">
              <CardHeader className="space-y-3 pb-2">
                <div className="lg:hidden flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <span className="font-semibold">{APP_NAME}</span>
                </div>
                <div>
                  <CardTitle className="text-2xl">Buat Password Baru</CardTitle>
                  <CardDescription className="mt-1.5">
                    Masukkan password baru untuk akun Anda.
                  </CardDescription>
                </div>
              </CardHeader>

              <Suspense fallback={<div className="p-6 text-center text-sm text-muted-foreground">Memuat...</div>}>
                <ResetPasswordForm />
              </Suspense>

              <CardFooter className="flex-col gap-4 pt-0 pb-6">
                <Separator />
                <p className="text-sm text-muted-foreground text-center">
                  Kembali ke{" "}
                  <Link
                    href="/login"
                    className="font-medium text-primary hover:underline"
                  >
                    Halaman Login
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
      <AppFooter className="border-t bg-muted/40 lg:bg-background" />
    </div>
  );
}
