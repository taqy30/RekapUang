import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .max(72, "Password maksimal 72 karakter")
  .regex(/[A-Za-z]/, "Password harus mengandung huruf")
  .regex(/[0-9]/, "Password harus mengandung angka");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, "Email tidak valid")
  .max(254, "Email terlalu panjang")
  .email("Format email tidak valid");

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Nama minimal 2 karakter")
  .max(60, "Nama maksimal 60 karakter")
  .regex(/^[\p{L}\p{M} .'-]+$/u, "Nama mengandung karakter tidak valid");

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password wajib diisi").max(72),
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

export const transactionSchema = z.object({
  type: z.enum(["masuk", "keluar"], { message: "Tipe tidak valid" }),
  amount: z
    .number({ message: "Jumlah harus berupa angka" })
    .positive("Jumlah harus lebih dari 0")
    .max(999_999_999_999, "Jumlah terlalu besar")
    .finite(),
  categoryId: z.string().min(1, "Kategori wajib dipilih").max(50),
  fundSourceId: z.string().min(1, "Tipe penyimpanan wajib dipilih").max(50),
  description: z
    .string()
    .trim()
    .max(200, "Keterangan maksimal 200 karakter")
    .optional()
    .nullable(),
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
