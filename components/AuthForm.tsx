"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Wallet } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { motion, AnimatePresence } from "framer-motion";
import {
  fadeUpRelaxed,
  slideExitLeftRelaxed,
  slideExitRightRelaxed,
  slideFromLeftRelaxed,
  slideFromRightRelaxed,
} from "@/lib/motion";
import { goToDashboardAfterAuth } from "@/lib/navigation";
import OtpForm from "./OtpForm";
import AppFooter from "./AppFooter";
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

type AuthFormProps = {
  mode: "login" | "register";
};

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  helper,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  helper?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          minLength={8}
          maxLength={72}
          autoComplete={autoComplete}
          className="pr-10 h-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
          onClick={() => setShow((v) => !v)}
          tabIndex={-1}
          aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      {helper && (
        <p className="text-xs text-muted-foreground">{helper}</p>
      )}
    </div>
  );
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "otp">("form");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body =
      mode === "login" ? { email, password } : { name, email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Terjadi kesalahan");
        setSubmitting(false);
        return;
      }

      if (mode === "register") {
        toast.info("Kode OTP dikirim ke email Anda");
        setStep("otp");
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      goToDashboardAfterAuth();
      return;
    } catch {
      setError("Koneksi gagal, coba lagi");
      setSubmitting(false);
    }
  };

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
          <AnimatePresence mode="wait">
            {step === "otp" ? (
              <motion.div
                key="otp"
                {...slideFromRightRelaxed}
                {...slideExitLeftRelaxed}
              >
                <CardContent className="pt-8 pb-6 px-6">
                  <OtpForm email={email} onBack={() => setStep("form")} />
                </CardContent>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                {...slideFromLeftRelaxed}
                {...slideExitRightRelaxed}
              >
                <CardHeader className="space-y-3 pb-2">
                <div className="lg:hidden flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <span className="font-semibold">{APP_NAME}</span>
                </div>
                <div>
                  <CardTitle className="text-2xl">
                    {mode === "login" ? "Selamat datang" : "Buat akun"}
                  </CardTitle>
                  <CardDescription className="mt-1.5">
                    {mode === "login"
                      ? "Masuk untuk melihat rekapitulasi keuangan Anda"
                      : "Daftar dan verifikasi email dengan kode OTP"}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === "register" && (
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama lengkap</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Contoh: Ahmad"
                        required
                        minLength={2}
                        maxLength={60}
                        autoComplete="name"
                        className="h-10"
                      />
                    </div>
                  )}

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

                  <PasswordField
                    id="password"
                    label={mode === "register" ? "Password baru" : "Password"}
                    value={password}
                    onChange={setPassword}
                    placeholder={
                      mode === "register"
                        ? "Min. 8 karakter"
                        : "Password Anda"
                    }
                    helper={
                      mode === "register"
                        ? "Kombinasi huruf dan angka, minimal 8 karakter"
                        : undefined
                    }
                    autoComplete={
                      mode === "register" ? "new-password" : "current-password"
                    }
                  />

                  {mode === "login" && (
                    <div className="flex justify-end -mt-2 mb-2">
                      <Link
                        href="/forgot-password"
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Lupa password?
                      </Link>
                    </div>
                  )}

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
                    {submitting
                      ? "Memproses..."
                      : mode === "login"
                        ? "Masuk"
                        : "Lanjutkan verifikasi"}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex-col gap-4 pt-0 pb-6">
                <Separator />
                <p className="text-sm text-muted-foreground text-center">
                  {mode === "login" ? (
                    <>
                      Belum punya akun?{" "}
                      <Link
                        href="/register"
                        className="font-medium text-primary hover:underline"
                      >
                        Daftar sekarang
                      </Link>
                    </>
                  ) : (
                    <>
                      Sudah punya akun?{" "}
                      <Link
                        href="/login"
                        className="font-medium text-primary hover:underline"
                      >
                        Masuk di sini
                      </Link>
                    </>
                  )}
                </p>
              </CardFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
        </motion.div>
      </div>
      </div>
      <AppFooter className="border-t bg-muted/40 lg:bg-background" />
    </div>
  );
}
