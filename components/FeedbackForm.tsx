"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUpRelaxed } from "@/lib/motion";
import { notifyError, notifySuccess } from "@/lib/notify";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type FeedbackFormProps = {
  backHref?: string;
  backLabel?: string;
  defaultContactEmail?: string;
};

export default function FeedbackForm({
  backHref = "/login",
  backLabel = "Kembali",
  defaultContactEmail = "",
}: FeedbackFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [type, setType] = useState<"saran" | "masalah" | "lainnya">("saran");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState(defaultContactEmail);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const form = e.currentTarget;
    const honeypot = (
      form.elements.namedItem("website") as HTMLInputElement | null
    )?.value;

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          subject,
          message,
          contactEmail: contactEmail || undefined,
          pageUrl:
            typeof window !== "undefined"
              ? `${window.location.origin}${pathname}`
              : pathname,
          website: honeypot || "",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data.error || "Gagal mengirim masukan";
        setError(msg);
        void notifyError("Gagal", msg);
        setSubmitting(false);
        return;
      }

      setSent(true);
      void notifySuccess("Terima kasih", data.message || "Masukan telah dikirim.");
      setSubmitting(false);
      router.refresh();
    } catch {
      const msg = "Koneksi gagal, coba lagi";
      setError(msg);
      void notifyError("Koneksi gagal", msg);
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <motion.div {...fadeUpRelaxed} className="w-full max-w-[520px]">
        <Card className="border-0 shadow-lg sm:border sm:shadow-md">
          <CardContent className="pt-8 pb-6 px-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-semibold">Masukan terkirim</h1>
              <p className="text-sm text-muted-foreground">
                Terima kasih atas masukan Anda. Kami akan meninjaunya segera.
              </p>
            </div>
            <Link href={backHref} className={cn(buttonVariants(), "w-full")}>
              {backLabel}
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div {...fadeUpRelaxed} className="w-full max-w-[520px]">
      <Card className="border-0 shadow-lg sm:border sm:shadow-md">
        <CardHeader className="space-y-3 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold leading-none tracking-tight">
                Laporkan masalah / Beri saran
              </h1>
              <CardDescription className="mt-1.5">
                Saran fitur, laporan bug, atau masukan lainnya untuk RekapUang.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />

            <div className="space-y-2">
              <Label htmlFor="feedback-type">Jenis masukan</Label>
              <Select
                value={type}
                onValueChange={(value) =>
                  setType(value as "saran" | "masalah" | "lainnya")
                }
              >
                <SelectTrigger id="feedback-type" className="h-10">
                  <SelectValue placeholder="Pilih jenis masukan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saran">Saran fitur</SelectItem>
                  <SelectItem value="masalah">Laporkan masalah</SelectItem>
                  <SelectItem value="lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-subject">Judul</Label>
              <Input
                id="feedback-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Contoh: Tambah fitur export PDF"
                required
                minLength={5}
                maxLength={120}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-message">Pesan</Label>
              <Textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Jelaskan saran atau masalah yang Anda alami..."
                required
                minLength={10}
                maxLength={2000}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-email">Email Anda (opsional)</Label>
              <Input
                id="feedback-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="nama@email.com"
                maxLength={254}
                autoComplete="email"
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Diisi jika Anda ingin dihubungi kembali terkait masukan ini.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href={backHref}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 sm:flex-1"
                )}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {backLabel}
              </Link>
              <Button
                type="submit"
                className="h-10 sm:flex-1"
                disabled={submitting}
              >
                {submitting ? "Mengirim..." : "Kirim masukan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
