import { z } from "zod";
import { containsMarkup, sanitizePlainText } from "@/lib/security";

export const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .max(72, "Password maksimal 72 karakter")
  .regex(/[A-Za-z]/, "Password harus mengandung huruf")
  .regex(/[0-9]/, "Password harus mengandung angka");

export const cuidSchema = z
  .string()
  .trim()
  .min(20, "ID tidak valid")
  .max(30, "ID tidak valid")
  .regex(/^c[a-z0-9]+$/i, "ID tidak valid");

export const fundSourceSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug tidak valid")
  .max(40, "Slug tidak valid")
  .regex(/^[a-z0-9-]+$/, "Slug tidak valid");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value) => sanitizePlainText(value, 254))
  .pipe(
    z
      .string()
      .min(5, "Email tidak valid")
      .max(254, "Email terlalu panjang")
      .email("Format email tidak valid")
  );

export const nameSchema = z
  .string()
  .trim()
  .transform((value) => sanitizePlainText(value, 60))
  .pipe(
    z
      .string()
      .min(2, "Nama minimal 2 karakter")
      .max(60, "Nama maksimal 60 karakter")
      .regex(/^[\p{L}\p{M} .'-]+$/u, "Nama mengandung karakter tidak valid")
      .refine((value) => !containsMarkup(value), "Nama mengandung karakter tidak valid")
  );

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Password wajib diisi")
    .max(72, "Password terlalu panjang"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^[a-f0-9]{64}$/i, "Token tidak valid"),
  password: passwordSchema,
});

export const verifyOtpSchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Kode OTP harus 6 digit angka"),
});

export const resendOtpSchema = z.object({
  email: emailSchema,
});

const optionalContactEmailSchema = z
  .union([z.literal(""), emailSchema])
  .optional()
  .transform((value) => (value === "" || value === undefined ? undefined : value));

export const feedbackSchema = z.object({
  type: z.enum(["saran", "masalah", "lainnya"], {
    message: "Jenis masukan tidak valid",
  }),
  subject: z
    .string()
    .trim()
    .transform((value) => sanitizePlainText(value, 120))
    .pipe(
      z
        .string()
        .min(5, "Judul minimal 5 karakter")
        .max(120, "Judul maksimal 120 karakter")
        .refine((value) => !containsMarkup(value), "Judul mengandung karakter tidak valid")
    ),
  message: z
    .string()
    .trim()
    .transform((value) => sanitizePlainText(value, 2000))
    .pipe(
      z
        .string()
        .min(10, "Pesan minimal 10 karakter")
        .max(2000, "Pesan maksimal 2000 karakter")
        .refine((value) => !containsMarkup(value), "Pesan mengandung karakter tidak valid")
    ),
  contactEmail: optionalContactEmailSchema,
  pageUrl: z
    .string()
    .trim()
    .max(500, "URL halaman terlalu panjang")
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  website: z
    .string()
    .max(0, "Permintaan ditolak")
    .optional()
    .or(z.literal("")),
});

export const transactionSchema = z.object({
  type: z.enum(["masuk", "keluar"], { message: "Tipe tidak valid" }),
  amount: z
    .number({ message: "Jumlah harus berupa angka" })
    .positive("Jumlah harus lebih dari 0")
    .max(999_999_999_999, "Jumlah terlalu besar")
    .finite(),
  categoryId: cuidSchema,
  fundSourceId: cuidSchema,
  description: z
    .string()
    .trim()
    .max(200, "Keterangan maksimal 200 karakter")
    .optional()
    .nullable()
    .transform((value) =>
      value == null || value === "" ? null : sanitizePlainText(value, 200)
    )
    .refine(
      (value) => value == null || !containsMarkup(value),
      "Keterangan mengandung karakter tidak valid"
    ),
  date: z
    .string()
    .optional()
    .nullable()
    .refine(
      (v) => !v || !Number.isNaN(new Date(v).getTime()),
      "Tanggal tidak valid"
    ),
});

export function safeParseJson<T>(
  schema: z.ZodSchema<T>,
  data: unknown
):
  | { success: true; data: T }
  | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  const first = result.error.issues[0];
  return { success: false, error: first?.message || "Input tidak valid" };
}
