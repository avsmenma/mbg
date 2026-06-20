# Aplikasi Kelola Pembelian & Penjualan (MBG) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun aplikasi web (Next.js + Supabase) untuk mencatat pembelian & penjualan bahan MBG, menghitung profit otomatis, kelola status pembayaran & stok, cetak invoice PDF, dengan data awal diimpor dari 2 file Excel.

**Architecture:** Next.js App Router (satu codebase frontend+backend via Route Handlers & Server Actions) di Vercel; Postgres di Supabase sebagai database + Auth. Logika hitung (profit, total, stok) diisolasi di modul murni `lib/calc.ts` yang diuji unit (Vitest). Akses data lewat helper Supabase di `lib/db/`. Impor Excel adalah script Node sekali-jalan di `scripts/import/`.

**Tech Stack:** Next.js 15 (App Router, TypeScript), React 19, Tailwind CSS, Supabase (Postgres + Auth + `@supabase/ssr`), Vitest (unit test), xlsx/SheetJS (baca Excel & export), @react-pdf/renderer (PDF), Recharts (grafik dashboard).

## Global Constraints

- Bahasa UI & label domain: **Indonesia**. Identifier kode: **English**.
- Mata uang: Rupiah, tampil format `Rp 1.234.567` (tanpa desimal kecuali perlu).
- **Anti-error rumus:** semua fungsi hitung mengembalikan `0` bila input kosong/penyebut 0; tidak pernah `NaN`/`Infinity`.
- Node.js ≥ 20. Package manager: **npm**.
- Commit kecil & sering, **pesan commit Bahasa Indonesia**, `git add` per-file (jangan `git add .`).
- Semua nilai uang disimpan sebagai `numeric`/integer rupiah penuh (bukan ribuan).
- Repo git proyek = folder `project_MBG` (sudah di-`git init`).

---

## File Structure

```
project_MBG/
  app/
    layout.tsx, globals.css, page.tsx              # shell + redirect ke /dashboard
    login/page.tsx                                  # halaman login
    (app)/dashboard/page.tsx                         # dashboard KPI + grafik
    (app)/pembelian/page.tsx, [id]/page.tsx          # daftar & form pembelian
    (app)/penjualan/page.tsx, [id]/page.tsx          # daftar & form invoice
    (app)/penjualan/[id]/cetak/route.ts              # PDF invoice
    (app)/pembayaran/page.tsx                         # status bayar
    (app)/produk/page.tsx                             # master produk
    (app)/stok/page.tsx                               # stok
    (app)/master/page.tsx                            # pemasok & pelanggan
  components/                                        # UI reusable (Table, Money, Field, Sidebar)
  lib/
    calc.ts                                          # FUNGSI HITUNG MURNI (diuji)
    format.ts                                        # format rupiah/tanggal
    supabase/client.ts, server.ts, middleware.ts     # @supabase/ssr
    db/products.ts, purchases.ts, sales.ts, stock.ts, dashboard.ts
    types.ts                                         # tipe domain (Product, Sale, ...)
  scripts/import/
    parse-faktur-belanja.ts                          # parser FAKTUR BELANJA.xlsx
    parse-invoice.ts                                 # parser INVOICE BERKAH ABADI REV.xlsx
    run-import.ts                                     # orchestrator → tulis ke Supabase
  supabase/migrations/0001_init.sql                  # DDL semua tabel
  tests/                                             # calc.test.ts, parse-*.test.ts
  middleware.ts                                       # proteksi route (auth)
  .env.local                                          # kunci Supabase (tidak di-commit)
  vitest.config.ts, package.json, tsconfig.json, tailwind.config.ts
```

Modul `lib/calc.ts` dan parser impor adalah unit dengan boundary jelas & teruji. Akses DB dipusatkan di `lib/db/*` agar halaman tidak menyentuh query mentah.

---

## Task 0: Scaffolding proyek Next.js

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `vitest.config.ts`

**Interfaces:**
- Produces: proyek Next.js yang bisa `npm run dev` & `npm run test`.

- [ ] **Step 1: Inisialisasi Next.js + dependensi**

Run:
```bash
cd ~/Downloads/project_MBG
npx create-next-app@latest . --ts --tailwind --app --eslint --src-dir=false --import-alias "@/*" --no-turbopack --use-npm --yes
npm install @supabase/supabase-js @supabase/ssr xlsx @react-pdf/renderer recharts
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react
```
Catatan: bila create-next-app menolak folder tidak kosong, jalankan di folder kosong lalu pindahkan, atau pakai `--yes` dan timpa file non-konflik (docs & .gitignore tetap dipertahankan).

- [ ] **Step 2: Konfigurasi Vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'] },
  resolve: { alias: { '@': new URL('.', import.meta.url).pathname } },
})
```
Tambah ke `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 3: Verifikasi dev server jalan**

Run: `npm run dev` lalu buka `http://localhost:3000`.
Expected: halaman default Next.js tampil tanpa error. Hentikan (Ctrl+C).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts tailwind.config.ts postcss.config.mjs vitest.config.ts app/layout.tsx app/globals.css app/page.tsx
git commit -m "chore: scaffolding Next.js + Tailwind + Vitest"
```

---

## Task 1: Tipe domain & fungsi hitung murni (TDD)

**Files:**
- Create: `lib/types.ts`, `lib/calc.ts`, `tests/calc.test.ts`

**Interfaces:**
- Produces:
  - `lib/types.ts`: `interface SaleItem { qty:number; hargaJual:number; hargaModal:number }`, `interface PurchaseItem { qty:number; harga:number; diskonPersen:number }`
  - `lib/calc.ts`:
    - `lineSale(item: SaleItem): { jumlahJual:number; jumlahModal:number; fee:number }`
    - `linePurchase(item: PurchaseItem): { jumlah:number }`
    - `totalSale(items: SaleItem[]): { totalJual:number; totalModal:number; totalFee:number }`
    - `safeRatio(a:number, b:number): number`

- [ ] **Step 1: Tulis test yang gagal**

Create `tests/calc.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { lineSale, linePurchase, totalSale, safeRatio } from '@/lib/calc'

describe('lineSale', () => {
  it('hitung jumlah jual, modal, fee', () => {
    expect(lineSale({ qty: 60, hargaJual: 17000, hargaModal: 16200 }))
      .toEqual({ jumlahJual: 1020000, jumlahModal: 972000, fee: 48000 })
  })
  it('input kosong -> 0 (anti-error Excel)', () => {
    expect(lineSale({ qty: NaN, hargaJual: 17000, hargaModal: 0 }))
      .toEqual({ jumlahJual: 0, jumlahModal: 0, fee: 0 })
  })
})
describe('linePurchase', () => {
  it('terapkan diskon persen', () => {
    expect(linePurchase({ qty: 2, harga: 100000, diskonPersen: 10 })).toEqual({ jumlah: 180000 })
  })
  it('tanpa diskon', () => {
    expect(linePurchase({ qty: 5, harga: 324000, diskonPersen: 0 })).toEqual({ jumlah: 1620000 })
  })
})
describe('totalSale', () => {
  it('jumlahkan semua baris', () => {
    const r = totalSale([
      { qty: 60, hargaJual: 17000, hargaModal: 16200 },
      { qty: 1, hargaJual: 22500, hargaModal: 19000 },
    ])
    expect(r).toEqual({ totalJual: 1042500, totalModal: 991000, totalFee: 51500 })
  })
})
describe('safeRatio', () => {
  it('penyebut 0 -> 0', () => { expect(safeRatio(5, 0)).toBe(0) })
  it('normal', () => { expect(safeRatio(48000, 16000)).toBe(3) })
})
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npm run test`
Expected: FAIL ("Cannot find module '@/lib/calc'").

- [ ] **Step 3: Implementasi minimal**

Create `lib/types.ts`:
```ts
export interface SaleItem { qty: number; hargaJual: number; hargaModal: number }
export interface PurchaseItem { qty: number; harga: number; diskonPersen: number }
```
Create `lib/calc.ts`:
```ts
import type { SaleItem, PurchaseItem } from './types'
const num = (x: number) => (Number.isFinite(x) ? x : 0)

export function lineSale(i: SaleItem) {
  const jumlahJual = num(i.qty) * num(i.hargaJual)
  const jumlahModal = num(i.qty) * num(i.hargaModal)
  return { jumlahJual, jumlahModal, fee: jumlahJual - jumlahModal }
}
export function linePurchase(i: PurchaseItem) {
  const bruto = num(i.qty) * num(i.harga)
  const jumlah = bruto - bruto * (num(i.diskonPersen) / 100)
  return { jumlah }
}
export function totalSale(items: SaleItem[]) {
  return items.reduce((a, it) => {
    const r = lineSale(it)
    return { totalJual: a.totalJual + r.jumlahJual, totalModal: a.totalModal + r.jumlahModal, totalFee: a.totalFee + r.fee }
  }, { totalJual: 0, totalModal: 0, totalFee: 0 })
}
export function safeRatio(a: number, b: number) {
  return num(b) === 0 ? 0 : num(a) / num(b)
}
```

- [ ] **Step 4: Jalankan test, pastikan lulus**

Run: `npm run test`
Expected: PASS semua.

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts lib/calc.ts tests/calc.test.ts
git commit -m "feat(calc): fungsi hitung profit & total anti-error + unit test"
```

---

## Task 2: Skema database Supabase

**Files:**
- Create: `supabase/migrations/0001_init.sql`

**Interfaces:**
- Produces: tabel `products, suppliers, customers, purchases, purchase_items, sales, sale_items` + view `stock_view`. Nama kolom dipakai oleh `lib/db/*` dan parser impor.

- [ ] **Step 1: Tulis DDL**

Create `supabase/migrations/0001_init.sql`:
```sql
create table products (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  satuan text,
  harga_modal_default numeric default 0,
  harga_jual_default numeric default 0,
  created_at timestamptz default now()
);
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique
);
create table customers (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  alamat text, bank text, no_rekening text, atas_nama text
);
create table purchases (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  catatan text,
  total_net numeric default 0,
  created_at timestamptz default now()
);
create table purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid references purchases(id) on delete cascade,
  product_id uuid references products(id),
  supplier_id uuid references suppliers(id),
  bobot_kg numeric, qty numeric default 0, satuan text,
  harga numeric default 0, diskon_persen numeric default 0, jumlah numeric default 0
);
create table sales (
  id uuid primary key default gen_random_uuid(),
  no_po text, no_invoice text,
  customer_id uuid references customers(id),
  tanggal_antar date,
  status_bayar text not null default 'belum' check (status_bayar in ('cair','belum')),
  terbilang text,
  total_jual numeric default 0, total_modal numeric default 0, total_fee numeric default 0,
  created_at timestamptz default now()
);
create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references sales(id) on delete cascade,
  product_id uuid references products(id),
  qty numeric default 0, satuan text,
  harga_jual numeric default 0, harga_modal numeric default 0,
  jumlah_jual numeric default 0, jumlah_modal numeric default 0, fee numeric default 0
);
-- Stok = total masuk (pembelian) - total keluar (penjualan) per produk
create view stock_view as
select p.id as product_id, p.nama, p.satuan,
  coalesce((select sum(qty) from purchase_items pi where pi.product_id = p.id),0) as qty_masuk,
  coalesce((select sum(qty) from sale_items si where si.product_id = p.id),0) as qty_terpakai,
  coalesce((select sum(qty) from purchase_items pi where pi.product_id = p.id),0)
    - coalesce((select sum(qty) from sale_items si where si.product_id = p.id),0) as qty_sisa
from products p;
```

- [ ] **Step 2: Terapkan ke Supabase**

Buat project Supabase (gratis). Di SQL Editor, tempel & jalankan isi `0001_init.sql`.
Expected: 7 tabel + 1 view terbuat tanpa error. Verifikasi di Table Editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0001_init.sql
git commit -m "feat(db): skema awal pembelian, penjualan, produk, stok"
```

---

## Task 3: Klien Supabase + Auth + proteksi route

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `middleware.ts`, `app/login/page.tsx`, `.env.local` (tidak di-commit), `.env.example`

**Interfaces:**
- Consumes: env `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Produces: `createClient()` (browser) dari `lib/supabase/client.ts`; `createClient()` (server) dari `lib/supabase/server.ts`; middleware yang redirect ke `/login` bila belum auth.

- [ ] **Step 1: Buat klien**

Create `lib/supabase/client.ts`:
```ts
import { createBrowserClient } from '@supabase/ssr'
export const createClient = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
```
Create `lib/supabase/server.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function createClient() {
  const store = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => list.forEach(({ name, value, options }) => store.set(name, value, options)),
    },
  })
}
```

- [ ] **Step 2: Middleware proteksi**

Create `middleware.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => req.cookies.getAll(), setAll: (l) => l.forEach(({ name, value, options }) => res.cookies.set(name, value, options)) },
  })
  const { data: { user } } = await supabase.auth.getUser()
  const isLogin = req.nextUrl.pathname.startsWith('/login')
  if (!user && !isLogin) return NextResponse.redirect(new URL('/login', req.url))
  if (user && isLogin) return NextResponse.redirect(new URL('/dashboard', req.url))
  return res
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'] }
```

- [ ] **Step 3: Halaman login**

Create `app/login/page.tsx` (client component) dengan form email+password memanggil `supabase.auth.signInWithPassword`. Pada sukses, `router.push('/dashboard')`.
```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
export default function Login() {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState('')
  const router = useRouter()
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await createClient().auth.signInWithPassword({ email, password: pw })
    if (error) setErr(error.message); else router.push('/dashboard')
  }
  return (
    <form onSubmit={submit} className="max-w-sm mx-auto mt-24 space-y-3 p-6">
      <h1 className="text-xl font-bold">Masuk</h1>
      <input className="border w-full p-2 rounded" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="border w-full p-2 rounded" type="password" placeholder="Kata sandi" value={pw} onChange={e=>setPw(e.target.value)} />
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <button className="bg-green-800 text-white w-full p-2 rounded">Masuk</button>
    </form>
  )
}
```

- [ ] **Step 4: Env + akun pemilik**

Create `.env.example` (isi nama variabel saja) dan `.env.local` (isi nilai asli dari Supabase → Settings → API). Tambah `.env*` sudah ada di `.gitignore`. Buat 1 user pemilik di Supabase → Authentication → Add user.

- [ ] **Step 5: Verifikasi**

Run: `npm run dev`. Buka `/dashboard` → harus redirect ke `/login`. Login dengan akun pemilik → masuk.
Expected: proteksi & login berfungsi.

- [ ] **Step 6: Commit**

```bash
git add lib/supabase/client.ts lib/supabase/server.ts middleware.ts app/login/page.tsx .env.example
git commit -m "feat(auth): klien Supabase, middleware proteksi, halaman login"
```

---

## Task 4: Parser impor Excel (TDD)

**Files:**
- Create: `scripts/import/parse-faktur-belanja.ts`, `scripts/import/parse-invoice.ts`, `tests/parse.test.ts`

**Interfaces:**
- Produces:
  - `parseFakturBelanja(path:string): { tanggal:string; items:{ no:number; nama:string; bobotKg:number|null; qty:number; satuan:string; harga:number; diskonPersen:number; jumlah:number; supplier:string }[] }[]` (satu objek per sheet tanggal).
  - `parseInvoiceRecap(path:string): { nama:string; keterangan:string; volume:number; satuan:string; hargaModal:number; hargaJual:number; statusBayar:'cair'|'belum'; tanggal:string|null }[]` (dari sheet `Lembar1`).
  - Keduanya **melewati** baris error (`#N/A`,`#VALUE!`,`#REF!`) dan mengumpulkan ke array `skipped` yang di-log.

- [ ] **Step 1: Tulis test yang gagal**

Create `tests/parse.test.ts` (uji terhadap file Excel nyata di root):
```ts
import { describe, it, expect } from 'vitest'
import { parseFakturBelanja } from '@/scripts/import/parse-faktur-belanja'
import { parseInvoiceRecap } from '@/scripts/import/parse-invoice'

describe('parseFakturBelanja', () => {
  const sheets = parseFakturBelanja('FAKTUR BELANJA.xlsx')
  it('menemukan sheet tanggal', () => { expect(sheets.length).toBeGreaterThanOrEqual(6) })
  it('baris pertama sheet 23 Mei = Minyak sovia 18L', () => {
    const s = sheets.find(x => x.tanggal.startsWith('2026-05-23'))!
    expect(s.items[0].nama).toContain('Minyak sovia')
    expect(s.items[0].jumlah).toBe(730000)
  })
})
describe('parseInvoiceRecap', () => {
  const rows = parseInvoiceRecap('INVOICE BERKAH ABADI REV.xlsx')
  it('membaca baris rekap Lembar1', () => { expect(rows.length).toBeGreaterThan(10) })
  it('tidak memuat baris error', () => {
    expect(rows.every(r => !/#(N\/A|VALUE|REF)/.test(JSON.stringify(r)))).toBe(true)
  })
})
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npm run test -- parse`
Expected: FAIL (module belum ada).

- [ ] **Step 3: Implementasi parser**

Create `scripts/import/parse-faktur-belanja.ts`:
```ts
import * as XLSX from 'xlsx'
const ERR = /#(N\/A|VALUE|REF|DIV)/i
const n = (v: any) => { const x = Number(v); return Number.isFinite(x) ? x : 0 }

export function parseFakturBelanja(path: string) {
  const wb = XLSX.readFile(path, { cellDates: true })
  const out: any[] = []
  for (const name of wb.SheetNames) {
    const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true })
    // cari sel tanggal (baris yang memuat Date)
    let tanggal: string | null = null
    for (const r of rows) for (const c of r) if (c instanceof Date) { tanggal = c.toISOString(); break }
    if (!tanggal) continue
    const items: any[] = []
    for (const r of rows) {
      const no = r[0]
      if (typeof no !== 'number') continue            // baris detail diawali nomor
      const nama = String(r[1] ?? '').trim()
      if (!nama || ERR.test(nama)) continue
      items.push({
        no, nama, bobotKg: r[2] == null ? null : n(r[2]), qty: n(r[3]), satuan: String(r[4] ?? '').trim(),
        harga: n(r[5]), diskonPersen: n(r[6]), jumlah: n(r[7]), supplier: String(r[8] ?? '').trim(),
      })
    }
    if (items.length) out.push({ tanggal, items })
  }
  return out
}
```
Create `scripts/import/parse-invoice.ts`:
```ts
import * as XLSX from 'xlsx'
const ERR = /#(N\/A|VALUE|REF|DIV)/i
const n = (v: any) => { const x = Number(v); return Number.isFinite(x) ? x : 0 }

export function parseInvoiceRecap(path: string) {
  const wb = XLSX.readFile(path, { cellDates: true })
  const ws = wb.Sheets['Lembar1']
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true })
  const out: any[] = []
  let tanggalAktif: string | null = null
  for (const r of rows) {
    const nama = String(r[1] ?? '').trim()         // kolom B = Deskripsi Barang
    const ket = String(r[2] ?? '').trim()          // kolom C = Keterangan / kadang tanggal subtotal
    const tglCell = r[2] instanceof Date ? r[2].toISOString() : null
    if (tglCell) { tanggalAktif = tglCell; continue } // baris subtotal pembawa tanggal
    if (!nama || ERR.test(JSON.stringify(r))) continue
    const hargaModal = n(r[5]), hargaJual = n(r[6])
    if (hargaModal === 0 && hargaJual === 0) continue
    out.push({
      nama, keterangan: ket, volume: n(r[3]), satuan: String(r[4] ?? '').trim(),
      hargaModal, hargaJual,
      statusBayar: /belum/i.test(ket) ? 'belum' : 'cair',
      tanggal: tanggalAktif,
    })
  }
  return out
}
```

- [ ] **Step 4: Jalankan test, pastikan lulus**

Run: `npm run test -- parse`
Expected: PASS. (Jika offset kolom meleset, sesuaikan indeks `r[n]` sesuai dump Excel & jalankan ulang.)

- [ ] **Step 5: Commit**

```bash
git add scripts/import/parse-faktur-belanja.ts scripts/import/parse-invoice.ts tests/parse.test.ts
git commit -m "feat(import): parser Excel faktur belanja & rekap invoice + test"
```

---

## Task 5: Orchestrator impor ke Supabase

**Files:**
- Create: `scripts/import/run-import.ts`
- Modify: `package.json` (script `"import": "tsx scripts/import/run-import.ts"`)

**Interfaces:**
- Consumes: `parseFakturBelanja`, `parseInvoiceRecap`, env service role key.
- Produces: data terisi di Supabase; helper `upsertProduct(nama, satuan, hargaModal, hargaJual)` (idempoten by `nama`).

- [ ] **Step 1: Tulis script impor**

Install `tsx` & service client: `npm install -D tsx`.
Create `scripts/import/run-import.ts`:
```ts
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { parseFakturBelanja } from './parse-faktur-belanja'
import { parseInvoiceRecap } from './parse-invoice'
import { lineSale, linePurchase } from '../../lib/calc'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function productId(nama: string, satuan: string, modal = 0, jual = 0) {
  const { data } = await db.from('products').select('id').eq('nama', nama).maybeSingle()
  if (data) return data.id
  const { data: ins } = await db.from('products').insert({ nama, satuan, harga_modal_default: modal, harga_jual_default: jual }).select('id').single()
  return ins!.id
}
async function supplierId(nama: string) {
  if (!nama) return null
  const { data } = await db.from('suppliers').select('id').eq('nama', nama).maybeSingle()
  if (data) return data.id
  const { data: ins } = await db.from('suppliers').insert({ nama }).select('id').single()
  return ins!.id
}

async function main() {
  // 1) Pelanggan default
  await db.from('customers').upsert({ nama: 'SPPG Roban 4 (Meranti)', bank: 'BNI', no_rekening: '80985822', atas_nama: 'TRI APRILIYANTA' }, { onConflict: 'nama' })

  // 2) Pembelian
  for (const sheet of parseFakturBelanja('FAKTUR BELANJA.xlsx')) {
    const { data: pur } = await db.from('purchases').insert({ tanggal: sheet.tanggal.slice(0,10), total_net: 0 }).select('id').single()
    let total = 0
    for (const it of sheet.items) {
      const pid = await productId(it.nama, it.satuan)
      const sid = await supplierId(it.supplier)
      const { jumlah } = linePurchase({ qty: it.qty, harga: it.harga, diskonPersen: it.diskonPersen })
      total += jumlah
      await db.from('purchase_items').insert({ purchase_id: pur!.id, product_id: pid, supplier_id: sid, bobot_kg: it.bobotKg, qty: it.qty, satuan: it.satuan, harga: it.harga, diskon_persen: it.diskonPersen, jumlah })
    }
    await db.from('purchases').update({ total_net: total }).eq('id', pur!.id)
  }

  // 3) Penjualan (dari rekap Lembar1, dikelompokkan per tanggal)
  const recap = parseInvoiceRecap('INVOICE BERKAH ABADI REV.xlsx')
  const byDate = new Map<string, typeof recap>()
  for (const r of recap) { const k = (r.tanggal ?? 'tanpa-tanggal').slice(0,10); (byDate.get(k) ?? byDate.set(k, []).get(k)!).push(r) }
  for (const [tgl, rows] of byDate) {
    const { data: sale } = await db.from('sales').insert({ tanggal_antar: tgl === 'tanpa-tanggal' ? null : tgl, status_bayar: rows.every(r=>r.statusBayar==='cair') ? 'cair':'belum' }).select('id').single()
    let tj=0,tm=0,tf=0
    for (const r of rows) {
      const pid = await productId(r.nama, r.satuan, r.hargaModal, r.hargaJual)
      const { jumlahJual, jumlahModal, fee } = lineSale({ qty: r.volume, hargaJual: r.hargaJual, hargaModal: r.hargaModal })
      tj+=jumlahJual; tm+=jumlahModal; tf+=fee
      await db.from('sale_items').insert({ sale_id: sale!.id, product_id: pid, qty: r.volume, satuan: r.satuan, harga_jual: r.hargaJual, harga_modal: r.hargaModal, jumlah_jual: jumlahJual, jumlah_modal: jumlahModal, fee })
    }
    await db.from('sales').update({ total_jual: tj, total_modal: tm, total_fee: tf }).eq('id', sale!.id)
  }
  console.log('Impor selesai.')
}
main().catch(e => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Jalankan impor**

Tambahkan `SUPABASE_SERVICE_ROLE_KEY` ke `.env.local`. Run: `npx tsx scripts/import/run-import.ts`
Expected: "Impor selesai." dan tabel terisi.

- [ ] **Step 3: Verifikasi angka vs Excel**

Di Supabase SQL Editor: `select sum(total_jual), sum(total_modal), sum(total_fee) from sales;`
Expected: mendekati rekap Excel (Jual 16.779.000 / Modal 14.096.000 / Profit 2.683.000). Selisih hanya dari baris error Excel yang sengaja dilewati — catat selisihnya, jangan paksakan.

- [ ] **Step 4: Commit**

```bash
git add scripts/import/run-import.ts package.json package-lock.json
git commit -m "feat(import): orchestrator impor data awal ke Supabase"
```

---

## Task 6: Layout aplikasi + helper format + komponen UI dasar

**Files:**
- Create: `lib/format.ts`, `tests/format.test.ts`, `components/Sidebar.tsx`, `components/Money.tsx`, `app/(app)/layout.tsx`, `app/page.tsx` (redirect)

**Interfaces:**
- Produces: `rupiah(n:number):string`, `tanggalID(iso:string):string`; layout dengan sidebar 7 menu.

- [ ] **Step 1: Test format (TDD)**

Create `tests/format.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { rupiah } from '@/lib/format'
describe('rupiah', () => {
  it('format ribuan', () => { expect(rupiah(1020000)).toBe('Rp 1.020.000') })
  it('nol & non-finite', () => { expect(rupiah(NaN)).toBe('Rp 0') })
})
```

- [ ] **Step 2: Jalankan, pastikan gagal** — Run: `npm run test -- format` → FAIL.

- [ ] **Step 3: Implementasi**

Create `lib/format.ts`:
```ts
export const rupiah = (n: number) =>
  'Rp ' + (Number.isFinite(n) ? Math.round(n) : 0).toLocaleString('id-ID')
export const tanggalID = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'
```

- [ ] **Step 4: Jalankan, pastikan lulus** — Run: `npm run test -- format` → PASS.

- [ ] **Step 5: Sidebar + layout**

Create `components/Sidebar.tsx` (daftar link: Dashboard, Pembelian, Penjualan, Pembayaran, Produk, Stok, Master) dan `app/(app)/layout.tsx` yang membungkus children dengan sidebar + header. Create `components/Money.tsx`:
```tsx
import { rupiah } from '@/lib/format'
export const Money = ({ value }: { value: number }) => <span>{rupiah(value)}</span>
```
`app/page.tsx`: `import { redirect } from 'next/navigation'; export default function Home(){ redirect('/dashboard') }`

- [ ] **Step 6: Verifikasi & commit** — Run `npm run dev`, cek sidebar tampil.
```bash
git add lib/format.ts tests/format.test.ts components/Sidebar.tsx components/Money.tsx app/(app)/layout.tsx app/page.tsx
git commit -m "feat(ui): layout sidebar, helper format rupiah/tanggal"
```

---

## Task 7: Modul Produk (master) — CRUD

**Files:**
- Create: `lib/db/products.ts`, `app/(app)/produk/page.tsx`, `app/(app)/produk/actions.ts`

**Interfaces:**
- Consumes: server `createClient()`.
- Produces: `listProducts()`, `createProduct(input)`, `updateProduct(id, input)`, `deleteProduct(id)`.

- [ ] **Step 1: Data layer**

Create `lib/db/products.ts` dengan fungsi di atas memakai `createClient()` server, select/insert/update/delete tabel `products`.

- [ ] **Step 2: Server actions + halaman**

Create `app/(app)/produk/actions.ts` (`'use server'`) memanggil data layer lalu `revalidatePath('/produk')`. Create `app/(app)/produk/page.tsx` (server component) menampilkan tabel produk + form tambah (nama, satuan, harga modal, harga jual) dan tombol edit/hapus.

- [ ] **Step 3: Verifikasi**

Run `npm run dev` → `/produk`: daftar produk hasil impor tampil; tambah 1 produk uji; edit; hapus.
Expected: CRUD berfungsi & data persist di Supabase.

- [ ] **Step 4: Commit**
```bash
git add lib/db/products.ts app/(app)/produk/page.tsx app/(app)/produk/actions.ts
git commit -m "feat(produk): master produk CRUD"
```

---

## Task 8: Modul Master (Pemasok & Pelanggan)

**Files:**
- Create: `lib/db/master.ts`, `app/(app)/master/page.tsx`, `app/(app)/master/actions.ts`

**Interfaces:**
- Produces: `listSuppliers/createSupplier/deleteSupplier`, `listCustomers/upsertCustomer`.

- [ ] **Step 1:** Data layer `lib/db/master.ts` (CRUD `suppliers` & `customers`).
- [ ] **Step 2:** Halaman `/master` dua seksi (Pemasok daftar+tambah+hapus; Pelanggan form edit info rekening).
- [ ] **Step 3: Verifikasi** — tambah pemasok, edit pelanggan SPPG; data persist.
- [ ] **Step 4: Commit**
```bash
git add lib/db/master.ts app/(app)/master/page.tsx app/(app)/master/actions.ts
git commit -m "feat(master): kelola pemasok & pelanggan"
```

---

## Task 9: Modul Pembelian (daftar + form multi-baris)

**Files:**
- Create: `lib/db/purchases.ts`, `app/(app)/pembelian/page.tsx`, `app/(app)/pembelian/[id]/page.tsx`, `app/(app)/pembelian/actions.ts`, `components/PurchaseForm.tsx`

**Interfaces:**
- Consumes: `linePurchase` (calc), `listProducts`, `listSuppliers`.
- Produces: `listPurchases()`, `getPurchase(id)`, `savePurchase(header, items)` → menghitung `jumlah` per baris via `linePurchase` dan `total_net` = Σ jumlah.

- [ ] **Step 1: Data layer** — `lib/db/purchases.ts`: list (join tanggal+total), get (header+items+nama produk), save (insert/update header + replace items, hitung total pakai `linePurchase`).
- [ ] **Step 2: Form** — `components/PurchaseForm.tsx` (client): tabel baris dinamis (tambah/hapus baris), tiap baris pilih produk (datalist dari products), input bobot/qty/satuan/harga/diskon, kolom Jumlah terhitung live via `linePurchase`, pilih pemasok; footer Total Net live.
- [ ] **Step 3: Halaman** — `/pembelian` daftar faktur (tanggal, total, jumlah item) + tombol "Tambah"; `/pembelian/[id]` form edit; action `savePurchase`.
- [ ] **Step 4: Verifikasi** — buat faktur belanja baru 2 baris, total terhitung benar, tersimpan & tampil di daftar; edit & simpan ulang.
- [ ] **Step 5: Commit**
```bash
git add lib/db/purchases.ts components/PurchaseForm.tsx app/(app)/pembelian/page.tsx app/(app)/pembelian/[id]/page.tsx app/(app)/pembelian/actions.ts
git commit -m "feat(pembelian): daftar & form faktur belanja dengan total otomatis"
```

---

## Task 10: Modul Penjualan/Invoice (form + profit otomatis)

**Files:**
- Create: `lib/db/sales.ts`, `app/(app)/penjualan/page.tsx`, `app/(app)/penjualan/[id]/page.tsx`, `app/(app)/penjualan/actions.ts`, `components/SaleForm.tsx`

**Interfaces:**
- Consumes: `lineSale`, `totalSale` (calc), `listProducts`, `listCustomers`.
- Produces: `listSales()`, `getSale(id)`, `saveSale(header, items)` → tiap baris hitung `jumlah_jual/jumlah_modal/fee` via `lineSale`; header `total_*` via `totalSale`.

- [ ] **Step 1: Data layer** — `lib/db/sales.ts` (list, get, save). Saat pilih produk, default `harga_jual`/`harga_modal` dari master tapi bisa diubah per baris.
- [ ] **Step 2: Form** — `components/SaleForm.tsx`: header (no PO, no invoice, pelanggan, tanggal antar, status bayar); tabel baris (produk, qty, satuan, harga jual, harga modal) dengan kolom Jumlah Jual / Fee live via `lineSale`; footer Total Jual/Modal/Profit live via `totalSale`; field terbilang otomatis.
- [ ] **Step 3: Halaman** — `/penjualan` daftar (no invoice, pelanggan, tanggal, total jual, profit, status) + tombol Tambah; `/penjualan/[id]` form edit + tombol "Cetak PDF" (Task 12).
- [ ] **Step 4: Verifikasi** — buat invoice baru: pilih produk → harga auto-isi, profit terhitung; simpan; muncul di daftar dengan profit benar.
- [ ] **Step 5: Commit**
```bash
git add lib/db/sales.ts components/SaleForm.tsx app/(app)/penjualan/page.tsx app/(app)/penjualan/[id]/page.tsx app/(app)/penjualan/actions.ts
git commit -m "feat(penjualan): form invoice dengan profit & fee otomatis"
```

---

## Task 11: Status Pembayaran & Stok

**Files:**
- Create: `app/(app)/pembayaran/page.tsx`, `app/(app)/pembayaran/actions.ts`, `lib/db/stock.ts`, `app/(app)/stok/page.tsx`

**Interfaces:**
- Produces: `setPaymentStatus(saleId, status)`, `listStock()` (baca `stock_view`).

- [ ] **Step 1: Pembayaran** — `/pembayaran` daftar semua invoice dengan toggle Cair/Belum (server action `setPaymentStatus` update `sales.status_bayar`), tampil total Piutang (Σ total_jual status='belum').
- [ ] **Step 2: Stok** — `lib/db/stock.ts` baca `stock_view`; `/stok` tabel: produk, satuan, masuk, terpakai, **sisa** (warnai merah bila sisa < 0).
- [ ] **Step 3: Verifikasi** — ubah status 1 invoice → total piutang berubah; tabel stok menampilkan sisa = masuk − terpakai.
- [ ] **Step 4: Commit**
```bash
git add app/(app)/pembayaran/page.tsx app/(app)/pembayaran/actions.ts lib/db/stock.ts app/(app)/stok/page.tsx
git commit -m "feat: status pembayaran & laporan stok"
```

---

## Task 12: Cetak/Export Invoice PDF

**Files:**
- Create: `components/InvoicePDF.tsx`, `app/(app)/penjualan/[id]/cetak/route.ts`

**Interfaces:**
- Consumes: `getSale(id)`, `@react-pdf/renderer`, `rupiah`.
- Produces: route handler GET yang mengembalikan PDF (`Content-Type: application/pdf`).

- [ ] **Step 1: Template PDF** — `components/InvoicePDF.tsx` memakai `@react-pdf/renderer` (Document/Page/View/Text): kop (Toko Berkah Abadi, no rekening BNI), info PO/invoice/tanggal/pelanggan, tabel item (No, Nama, Qty, Satuan, Harga, Jumlah), Total, terbilang, tanda tangan.
- [ ] **Step 2: Route** — `app/(app)/penjualan/[id]/cetak/route.ts`:
```ts
import { renderToBuffer } from '@react-pdf/renderer'
import { getSale } from '@/lib/db/sales'
import { InvoicePDF } from '@/components/InvoicePDF'
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sale = await getSale(id)
  const buffer = await renderToBuffer(InvoicePDF({ sale }))
  return new Response(buffer, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="invoice-${sale.no_invoice ?? id}.pdf"` } })
}
```
- [ ] **Step 3: Verifikasi** — dari `/penjualan/[id]` klik "Cetak PDF" → PDF invoice terbuka berisi data benar & total cocok.
- [ ] **Step 4: Commit**
```bash
git add components/InvoicePDF.tsx app/(app)/penjualan/[id]/cetak/route.ts
git commit -m "feat(invoice): cetak/export PDF invoice"
```

---

## Task 13: Dashboard (KPI + grafik)

**Files:**
- Create: `lib/db/dashboard.ts`, `app/(app)/dashboard/page.tsx`, `components/ProfitChart.tsx`

**Interfaces:**
- Produces: `getDashboard()` → `{ totalJual, totalModal, totalProfit, piutang, perTanggal: {tanggal, profit}[] }`.

- [ ] **Step 1: Data layer** — `lib/db/dashboard.ts`: agregasi dari `sales` (Σ total_jual/modal/fee; piutang = Σ total_jual where status='belum'; profit per tanggal_antar).
- [ ] **Step 2: Halaman** — `/dashboard`: 4 kartu KPI (pakai `<Money>`), `components/ProfitChart.tsx` (Recharts line/bar profit per tanggal), tabel transaksi terbaru.
- [ ] **Step 3: Verifikasi** — angka KPI konsisten dengan jumlah di Supabase & rekap Excel; grafik tampil.
- [ ] **Step 4: Commit**
```bash
git add lib/db/dashboard.ts app/(app)/dashboard/page.tsx components/ProfitChart.tsx
git commit -m "feat(dashboard): KPI profit, piutang & grafik per tanggal"
```

---

## Task 14: Penyempurnaan tampilan (frontend-design) + export Excel

**Files:**
- Modify: `app/globals.css`, `tailwind.config.ts`, komponen terkait
- Create: `app/(app)/penjualan/export/route.ts` (export daftar penjualan ke .xlsx)

**Interfaces:**
- Produces: route export Excel memakai `XLSX.utils.json_to_sheet` + `XLSX.write`.

- [ ] **Step 1:** Terapkan arahan skill **frontend-design** (palet hijau brand, tipografi, kartu KPI, spacing, state kosong/loading) agar tidak terlihat template default. Pastikan responsif (mobile).
- [ ] **Step 2:** Tambah route export Excel daftar penjualan (tombol "Export Excel" di `/penjualan`).
- [ ] **Step 3: Verifikasi** — tampilan rapi di desktop & HP; file .xlsx ter-download berisi data benar.
- [ ] **Step 4: Commit**
```bash
git add app/globals.css tailwind.config.ts app/(app)/penjualan/export/route.ts
git commit -m "feat(ui): polish tampilan + export Excel daftar penjualan"
```

---

## Task 15: Deploy ke Vercel

**Files:**
- Create: `README.md` (langkah deploy + setup env), `.env.example` (sudah ada — lengkapi)

**Interfaces:** —

- [ ] **Step 1:** Push repo ke GitHub (repo privat baru). Run:
```bash
git add README.md .env.example
git commit -m "docs: panduan deploy & variabel lingkungan"
```
- [ ] **Step 2:** Di Vercel: Import project dari GitHub, set Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Deploy.
- [ ] **Step 3: Verifikasi** — buka URL Vercel, login, dashboard tampil dengan data, buat 1 invoice, cetak PDF. Semua fitur jalan online.
- [ ] **Step 4:** Tandai DoD spec terpenuhi; tulis ringkasan akhir ke user.

---

## Self-Review (cakupan spec)

- Dashboard profit → Task 13 ✓ · Status pembayaran → Task 11 ✓ · Cetak/Export PDF → Task 12, Excel → Task 14 ✓ · Manajemen stok → Task 11 (+ view Task 2) ✓
- Master produk/pemasok/pelanggan → Task 7, 8 ✓ · Pembelian → Task 9 ✓ · Penjualan → Task 10 ✓
- Impor data awal Excel → Task 4, 5 ✓ · Login 1 akun → Task 3 ✓ · Online/Vercel → Task 15 ✓
- Anti-error rumus → Task 1 (`calc` mengembalikan 0) + parser melewati baris error (Task 4) ✓
- Aturan hitung `Profit = Jual − Modal` → Task 1 ✓ · Stok = masuk − terpakai → Task 2 view + Task 11 ✓
- Konsistensi tipe: `lineSale/linePurchase/totalSale` dipakai konsisten di Task 5, 9, 10, 13. Nama kolom DB (Task 2) dipakai konsisten di `lib/db/*`.

Tidak ada placeholder/TBD. Setiap task berakhir pada deliverable yang bisa diuji independen.
