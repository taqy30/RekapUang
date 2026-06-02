"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import CurrencyInput from "./CurrencyInput";
import FundSourceIcon, { FUND_ICON } from "./FundSourceIcon";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  DEFAULT_FUND_SOURCE_SLUG,
  STORAGE_KIND_LABELS,
  STORAGE_KIND_ORDER,
  getStorageKindBySlug,
  type StorageKind,
} from "@/lib/fund-sources";
import { modalFormItem, modalFormStagger } from "@/lib/motion";

export type Category = {
  id: string;
  name: string;
  slug: string;
  color: string;
};

export type FundSource = {
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
  createdAt: string;
  categoryId: string;
  fundSourceId: string | null;
  category: Category;
  fundSource: FundSource | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: Category[];
  fundSources: FundSource[];
  editData?: Transaction | null;
  defaultType?: "masuk" | "keluar";
};

function CategorySelect({
  value,
  onValueChange,
  options,
  selected,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: { id: string; name: string; color: string }[];
  selected?: { name: string; color: string };
}) {
  return (
    <div className="space-y-2">
      <Label>Kategori</Label>
      <Select value={value} onValueChange={(v) => onValueChange(v as string)}>
        <SelectTrigger className="w-full h-10">
          {selected ? (
            <span className="flex min-w-0 flex-1 items-center gap-2 truncate text-left">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: selected.color }}
              />
              {selected.name}
            </span>
          ) : (
            <span className="text-muted-foreground">Pilih kategori</span>
          )}
        </SelectTrigger>
        <SelectContent
          align="start"
          sideOffset={8}
          className="max-h-[42dvh] sm:max-h-[280px] touch-pan-y"
        >
          {options.map((opt) => (
            <SelectItem key={opt.id} value={opt.id} label={opt.name}>
              <span className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: opt.color }}
                />
                {opt.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function StorageTypeSelect({
  value,
  onValueChange,
  options,
  selected,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: FundSource[];
  selected?: FundSource;
}) {
  const byKind = useMemo(() => {
    const map = new Map<StorageKind, FundSource[]>();
    for (const kind of STORAGE_KIND_ORDER) {
      map.set(kind, []);
    }
    for (const opt of options) {
      const kind = getStorageKindBySlug(opt.slug);
      map.get(kind)?.push(opt);
    }
    return map;
  }, [options]);

  return (
    <div className="space-y-2">
      <Label>Tipe penyimpanan</Label>
      <p className="text-xs text-muted-foreground -mt-1">
        Uang disimpan di mana: Cash, rekening bank, atau e-wallet
      </p>
      <Select value={value} onValueChange={(v) => onValueChange(v as string)}>
        <SelectTrigger className="w-full h-10">
          {selected ? (
            <span className="flex min-w-0 flex-1 items-center gap-2 truncate text-left">
              <FundSourceIcon slug={selected.slug} size={FUND_ICON.select} />
              {selected.name}
            </span>
          ) : (
            <span className="text-muted-foreground">
              Pilih Cash / bank / e-wallet
            </span>
          )}
        </SelectTrigger>
        <SelectContent
          align="start"
          side="top"
          sideOffset={8}
          className="max-h-[42dvh] sm:max-h-[280px] touch-pan-y"
        >
          {STORAGE_KIND_ORDER.map((kind) => {
            const items = byKind.get(kind) ?? [];
            if (items.length === 0) return null;
            return (
              <SelectGroup key={kind}>
                <SelectLabel>{STORAGE_KIND_LABELS[kind]}</SelectLabel>
                {items.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id} label={opt.name}>
                    <span className="flex items-center gap-2">
                      <FundSourceIcon slug={opt.slug} size={FUND_ICON.table} />
                      {opt.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

function TypeToggle({
  type,
  onChange,
}: {
  type: "masuk" | "keluar";
  onChange: (t: "masuk" | "keluar") => void;
}) {
  return (
    <div className="relative grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg">
      {(["masuk", "keluar"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={cn(
            "relative z-10 rounded-md py-2 text-sm font-medium transition-colors duration-200",
            type === t
              ? t === "masuk"
                ? "text-primary"
                : "text-destructive"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {type === t && (
            <motion.span
              layoutId="tx-type-highlight"
              className="absolute inset-0 rounded-md bg-background shadow-sm"
              transition={{ type: "spring", stiffness: 480, damping: 34 }}
              aria-hidden
            />
          )}
          <span className="relative z-10">
            {t === "masuk" ? "+ Masuk" : "− Keluar"}
          </span>
        </button>
      ))}
    </div>
  );
}

export default function TransactionModal({
  open,
  onClose,
  onSaved,
  categories,
  fundSources,
  editData,
  defaultType = "masuk",
}: Props) {
  const [type, setType] = useState<"masuk" | "keluar">(defaultType);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [fundSourceId, setFundSourceId] = useState("");
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
      setFundSourceId(editData.fundSourceId || "");
      setDescription(editData.description || "");
      setDate(editData.date.split("T")[0]);
    } else {
      setType(defaultType);
      setAmount("");
      setCategoryId(categories[0]?.id || "");
      const defaultFund =
        fundSources.find((f) => f.slug === DEFAULT_FUND_SOURCE_SLUG) ??
        fundSources[0];
      setFundSourceId(defaultFund?.id || "");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
    }
    setError("");
  }, [open, editData, defaultType, categories, fundSources]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId]
  );

  const selectedFundSource = useMemo(
    () => fundSources.find((f) => f.id === fundSourceId),
    [fundSources, fundSourceId]
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setError("Jumlah harus lebih dari 0");
      return;
    }
    if (!fundSourceId) {
      setError("Tipe penyimpanan wajib dipilih");
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
          fundSourceId,
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

  const formKey = editData?.id ?? `new-${defaultType}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={cn(
          "sm:max-w-md gap-0 p-0 overflow-hidden max-h-[85dvh] flex flex-col",
          "duration-300 data-open:duration-300 data-closed:duration-200",
          "data-open:slide-in-from-bottom-6 sm:data-open:slide-in-from-bottom-0",
          "data-open:zoom-in-95 data-open:fade-in-0"
        )}
      >
        <motion.div
          key={formKey}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
            <DialogTitle>
              {editData ? "Edit transaksi" : "Tambah transaksi"}
            </DialogTitle>
            <DialogDescription>
              Pilih kategori transaksi dan tipe penyimpanan (Cash, bank, e-wallet)
            </DialogDescription>
          </DialogHeader>

          <motion.form
            onSubmit={submit}
            className="px-5 pb-5 space-y-4 overflow-y-auto overscroll-contain flex-1 min-h-0"
            variants={modalFormStagger}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={modalFormItem}>
              <TypeToggle type={type} onChange={setType} />
            </motion.div>

            <motion.div variants={modalFormItem} className="space-y-2">
              <Label>Jumlah</Label>
              <CurrencyInput value={amount} onChange={setAmount} required />
            </motion.div>

            <motion.div variants={modalFormItem}>
              <CategorySelect
                value={categoryId}
                onValueChange={setCategoryId}
                options={categories}
                selected={selectedCategory}
              />
            </motion.div>

            <motion.div variants={modalFormItem}>
              <StorageTypeSelect
                value={fundSourceId}
                onValueChange={setFundSourceId}
                options={fundSources}
                selected={selectedFundSource}
              />
            </motion.div>

            <motion.div variants={modalFormItem} className="space-y-2">
              <Label htmlFor="tx-date">Tanggal</Label>
              <Input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="h-10"
              />
            </motion.div>

            <motion.div variants={modalFormItem} className="space-y-2">
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
            </motion.div>

            {error && (
              <motion.div variants={modalFormItem}>
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <motion.div variants={modalFormItem}>
              <DialogFooter className="gap-2 sm:gap-2 pt-2 px-0 pb-0 bg-transparent border-0">
                <Button type="button" variant="outline" onClick={onClose}>
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </motion.div>
          </motion.form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
