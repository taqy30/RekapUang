# RekapUang

Aplikasi web rekapitulasi pemasukan & pengeluaran dengan login + OTP email, kategori transaksi, dan riwayat saldo masuk/keluar (filter harian & bulanan). Tampilan responsif, tanpa gradient, dengan keamanan berlapis.

## Fitur

- **Register dengan OTP** — kode 6 digit dikirim ke email, masa berlaku 10 menit
- **Login & Logout** dengan rate limiting
- **Saldo Masuk / Keluar** dengan kategori
- **Edit & Hapus** transaksi
- **Kategori bawaan**: Kebutuhan Darurat, Biaya Hidup, Tabungan, Investasi, Hiburan, Lainnya
- **Rekap**: saldo, total masuk/keluar, ringkasan per kategori
- **Responsif** — desktop tampil tabel, mobile tampil kartu + FAB bawah
- **Toast notifications** untuk feedback aksi
- **Database PostgreSQL** via Prisma + Supabase

## Keamanan

| Lapis | Implementasi |
|-------|--------------|
| Password | bcrypt (cost 12), min 8 char + huruf + angka |
| OTP | Hash bcrypt, masa berlaku 10 menit, max 5 percobaan salah, cooldown 60 detik untuk kirim ulang |
| Session | JWT HS256 (jose), `httpOnly` + `SameSite=Lax` + `secure` di production |
| Rate limit | Per IP & per email (register 5/15m, login 8/15m, IP 20/15m) |
| CSRF | Origin check di setiap POST/PUT/DELETE |
| Headers | HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| Validasi | Zod di server & client; pesan error generik (anti enumeration) |
| Database | Parameterized query via Prisma (anti SQL injection) |
| Akun | Generic message saat email tidak ada (tidak bocor info) |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Konfigurasi Supabase

Dashboard Supabase → tombol **Connect** → **ORM** → **Prisma**, salin ke `.env`:

```env
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@....pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@....pooler.supabase.com:5432/postgres"
JWT_SECRET="string-acak-minimal-32-karakter"
```

### 3. Buat tabel & seed kategori

```bash
npm run db:push
npm run db:seed
```

### 4. Konfigurasi email SMTP (opsional di dev)

#### Jika belum dikonfigurasi:
OTP akan dicetak di **terminal** saat register. Cocok untuk uji coba.

#### Untuk kirim email real (Gmail):

1. Aktifkan **2-Step Verification** di [myaccount.google.com](https://myaccount.google.com/security)
2. Buka [App passwords](https://myaccount.google.com/apppasswords) → buat password baru untuk "Mail"
3. Tambahkan ke `.env`:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="email-anda@gmail.com"
SMTP_PASSWORD="xxxx xxxx xxxx xxxx"
SMTP_FROM="RekapUang <email-anda@gmail.com>"
```

> Catatan: `SMTP_PASSWORD` adalah **App Password** 16 karakter, **bukan** password Gmail asli.

#### Penyedia SMTP lain
- **Resend** (modern): `smtp.resend.com`, port 587, user `resend`, password = API key
- **Mailtrap** (testing): kredensial dari dashboard Mailtrap

### 5. Jalankan

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Alur Registrasi

1. Form register → submit nama, email, password
2. Server kirim OTP ke email + simpan ke `PendingRegistration`
3. User masukkan 6 digit kode
4. Server verifikasi → buat User → login otomatis

Jika 5x kode salah atau lebih dari 10 menit → daftar ulang.

## Tech Stack

- **Next.js 15** App Router + TypeScript
- **Prisma** ORM + **PostgreSQL** (Supabase)
- **Tailwind CSS** (flat design, tanpa gradient)
- **Zod** untuk validasi
- **Nodemailer** untuk email SMTP
- **jose** untuk JWT, **bcryptjs** untuk hash

## Struktur File

```
app/
├── api/auth/         # register, verify-otp, resend-otp, login, logout
├── api/transactions/ # CRUD transaksi
├── dashboard/        # halaman dashboard
├── login/ register/  # halaman auth
lib/
├── auth.ts           # session, password hash
├── email.ts          # SMTP / OTP email
├── otp.ts            # generate, hash, verify OTP
├── rate-limit.ts     # in-memory rate limiter
├── validation.ts     # schema Zod
components/
├── AuthForm.tsx      # form login/register dengan step OTP
├── OtpForm.tsx       # input 6 digit OTP
├── Dashboard.tsx     # halaman utama
├── TransactionModal.tsx
├── CurrencyInput.tsx
├── Toast.tsx         # provider notifikasi
```

## Production

- Ganti `JWT_SECRET` ke string acak yang panjang dan unik
- Set `APP_URL` ke URL production
- Pastikan koneksi via HTTPS (Vercel/host Anda)
- Konfigurasi SMTP real (jangan andalkan console log)
- Rate limiter saat ini in-memory — untuk multi-instance, ganti ke Redis (Upstash)
- Pertimbangkan tambahan WAF / Cloudflare di depan aplikasi
