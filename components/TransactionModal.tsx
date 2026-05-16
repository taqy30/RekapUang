"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import CurrencyInput from "./CurrencyInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type Category = {
  id: string;
  name: string;
  slug: string;
  color: string;
};

export type Transaction = {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  date: string;
  categoryId: string;
  category: Category;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: Category[];
  editData?: Transaction | null;
  defaultType?: "masuk" | "keluar";
};

export default function TransactionModal({
  open,
  onClose,
  onSaved,
  categories,
  editData,
  defaultType = "masuk",
}: Props) {
  const [type, setType] = useState<"masuk" | "keluar">(defaultType);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editData) {
      setType(editData.type as "masuk" | "keluar");
      setAmount(String(editData.amount));
      setCategoryId(editData.categoryId);
      setDescription(editData.description || "");
      setDate(editData.date.split("T")[0]);
    } else {
      setType(defaultType);
      setAmount("");
      setCategoryId(categories[0]?.id || "");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
    }
    setError("");
  }, [open, editData, defaultType, categories]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setError("Jumlah harus lebih dari 0");
      return;
    }
    setLoading(true);
    try {
      const url = editData
        ? `/api/transactions/${editData.id}`
        : "/api/transactions";
      const res = await fetch(url, {
        method: editData ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: num,
          categoryId,
          description,
          date,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan");
        return;
      }
      toast.success(editData ? "Transaksi diperbarui" : "Transaksi ditambahkan");
      onSaved();
      onClose();
    } catch {
      setError("Koneksi gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle>
            {editData ? "Edit transaksi" : "Tambah transaksi"}
          </DialogTitle>
          <DialogDescription>
            Catat saldo masuk atau keluar dengan kategori
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="px-5 pb-5 space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
            {(["masuk", "keluar"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "py-2 rounded-md text-sm font-medium transition-all",
                  type === t
                    ? t === "masuk"
                      ? "bg-background text-primary shadow-sm"
                      : "bg-background text-destructive shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "masuk" ? "+ Masuk" : "− Keluar"}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Jumlah</Label>
            <CurrencyInput value={amount} onChange={setAmount} required />
          </div>

          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select
              value={categoryId}
              onValueChange={(v) => setCategoryId(v as string)}
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-date">Tanggal</Label>
            <Input
              id="tx-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-desc">Keterangan (opsional)</Label>
            <Textarea
              id="tx-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Gaji bulan ini"
              rows={2}
              maxLength={200}
              className="resize-none"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2 sm:gap-2 pt-2 px-0 pb-0 bg-transparent border-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
