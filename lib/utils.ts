import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Tanggal dari form (YYYY-MM-DD) + jam saat ini agar urutan & tampilan waktu akurat */
export function parseTransactionDate(dateInput?: string | null): Date {
  if (!dateInput) return new Date();
  if (dateInput.includes("T")) return new Date(dateInput);

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput);
  if (!match) return new Date(dateInput);

  const [, y, m, d] = match;
  const now = new Date();
  return new Date(
    Number(y),
    Number(m) - 1,
    Number(d),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds()
  );
}
