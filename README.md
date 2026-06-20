# Aplikasi Manajemen Bisnis (MBG)

Aplikasi web untuk mencatat pembelian, penjualan, stok produk, dan laporan fee usaha kecil.
Dibangun dengan Next.js 16, Supabase (PostgreSQL), dan di-deploy ke Vercel. Seluruh data
tersimpan aman di cloud Supabase dengan Row Level Security aktif.

---

## Prasyarat

- **Node.js 20+** — unduh di [nodejs.org](https://nodejs.org)
- **Akun Supabase (gratis)** — daftar di [supabase.com](https://supabase.com)
- **Akun Vercel (gratis)** — daftar di [vercel.com](https://vercel.com)

---

## Langkah 1 — Setup Database di Supabase

1. Buka proyek Supabase Anda, masuk ke menu **SQL Editor**.
2. Salin isi file `supabase/migrations/0001_init.sql`, tempel, lalu klik **Run**.
3. Salin isi file `supabase/migrations/0002_flag_perlu_cek.sql`, tempel, lalu klik **Run**.
4. Salin isi file `supabase/migrations/0003_rls.sql`, tempel, lalu klik **Run**.
   > **Wajib:** Migrasi 0003 mengaktifkan Row Level Security. Jalankan sebelum aplikasi
   > online agar anon key tidak bisa membaca/menulis database tanpa login.

Ketiga migrasi harus dijalankan **berurutan** (0001 → 0002 → 0003).

---

## Langkah 2 — Variabel Lingkungan

Buat file `.env.local` di folder proyek (jangan di-commit ke Git):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

| Variabel | Cara mendapatkan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon / public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (**RAHASIA** — jangan bagikan) |

`SUPABASE_SERVICE_ROLE_KEY` hanya dipakai saat impor data awal (`npm run import`).
Tidak perlu diset di Vercel untuk operasi normal aplikasi.

---

## Langkah 3 — Buat Akun Pemilik

1. Di Supabase, masuk ke menu **Authentication → Users**.
2. Klik **Add user → Create new user**, isi email dan password.
3. Gunakan email + password ini untuk login ke aplikasi.

---

## Langkah 4 — (Opsional) Impor Data Awal

Jika Anda memiliki data Excel yang ingin diimpor:

1. Pastikan `SUPABASE_SERVICE_ROLE_KEY` sudah ada di `.env.local`.
2. Letakkan file Excel (`FAKTUR BELANJA.xlsx` dan `INVOICE BERKAH ABADI REV.xlsx`) di
   folder root proyek.
3. Jalankan:
   ```bash
   npm run import
   ```
   Impor bersifat idempoten untuk master data (produk, supplier, pelanggan), tetapi
   **menghapus semua data transaksi lama** sebelum mengisi ulang.

---

## Langkah 5 — Jalankan Lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser. Login dengan akun yang
dibuat di Langkah 3.

---

## Langkah 6 — Deploy ke Vercel

1. Push kode ke repositori GitHub Anda.
2. Di Vercel, klik **Add New Project** → import repo tersebut.
3. Di bagian **Environment Variables**, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Klik **Deploy**. Vercel akan otomatis build dan menerbitkan aplikasi.

> `SUPABASE_SERVICE_ROLE_KEY` **tidak perlu** diset di Vercel — kunci itu hanya untuk
> impor data lokal dan bersifat rahasia.

---

## Catatan Keamanan

- **RLS aktif (migrasi 0003) wajib dijalankan sebelum aplikasi online.**
  Tanpanya, siapa saja yang memiliki URL Supabase dan anon key dapat membaca/menulis
  seluruh database.
- Jangan commit `.env.local` ke Git (sudah di `.gitignore`).
- Jangan bagikan `SUPABASE_SERVICE_ROLE_KEY` ke siapa pun.

---

## Catatan Teknis (Follow-up yang Diketahui)

- Edit faktur (pembelian/penjualan) belum transaksional — pertimbangkan Postgres RPC
  untuk menjamin atomisitas update header + delete + insert items dalam satu transaksi.
