"use client";

import { useState } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";
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
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { notifyError, notifySuccess } from "@/lib/notify";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Terjadi kesalahan");
        void notifyError("Gagal", data.error || "Terjadi kesalahan");
        setSubmitting(false);
        return;
      }

      setSuccess(data.message || "Link reset password telah dikirim.");
      void notifySuccess(
        "Email terkirim",
        data.message || "Link reset password telah dikirim."
      );
      setSubmitting(false);
    } catch {
      setError("Koneksi gagal, coba lagi");
      void notifyError("Koneksi gagal", "Coba lagi dalam beberapa saat.");
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-muted/40">
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
                  <h1 className="text-2xl font-semibold leading-none tracking-tight">
                    Lupa Password
                  </h1>
                  <CardDescription className="mt-1.5">
                    Masukkan email Anda untuk menerima link reset password.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      required
                      autoComplete="email"
                      maxLength={254}
                      className="h-10"
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="bg-emerald-50 text-emerald-800 border-emerald-200">
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-10"
                    disabled={submitting || !!success}
                  >
                    {submitting ? "Memproses..." : "Kirim Link Reset"}
                  </Button>
                </form>
              </CardContent>

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
    </main>
  );
}
