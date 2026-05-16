"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CurrencyInputProps = {
  value: string;
  onChange: (raw: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  className?: string;
};

function formatNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}

export default function CurrencyInput({
  value,
  onChange,
  placeholder = "0",
  required,
  id,
  className,
}: CurrencyInputProps) {
  const [display, setDisplay] = useState(formatNumber(value));

  useEffect(() => {
    setDisplay(formatNumber(value));
  }, [value]);

  return (
    <div className={cn("relative", className)}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none z-10">
        Rp
      </span>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          setDisplay(formatNumber(digits));
          onChange(digits);
        }}
        placeholder={placeholder}
        required={required}
        className="pl-9 h-10"
      />
    </div>
  );
}
