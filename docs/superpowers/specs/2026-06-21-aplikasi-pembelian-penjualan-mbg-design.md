# Spesifikasi Desain — Aplikasi Kelola Pembelian & Penjualan (MBG)

**Tanggal:** 2026-06-21
**Status:** Disetujui (brainstorming) — siap masuk rencana implementasi
**Pemilik usaha:** Toko Berkah Abadi / Koperasi Konsumen Berkah Wahdah Islamiyah Kalimantan Barat (Singkawang)
**Pelanggan utama:** Dapur SPPG Roban 4 (Meranti) — program Makan Bergizi Gratis (MBG)

---

## 1. Latar Belakang

Pemilik usaha memasok bahan pangan untuk program MBG. Model bisnis: **beli bahan dari grosir → jual ke dapur SPPG → ambil margin/fee**. Saat ini pencatatan dilakukan di 2 file Excel:

- `FAKTUR BELANJA.xlsx` — sisi **pembelian** (belanja ke grosir: Cv Mitra Aneka Abadi, Tunas Inti Mandiri). 1 sheet = 1 tanggal belanja. Kolom: No, Nama Barang, Bobot (Kg), Jumlah (Qty), Satuan, Harga (Rp), Diskon (%), Jumlah (Rp), Keterangan (pemasok). Sebagian sheet punya blok kanan kontrol stok (Bobot Satuan KG/PACK, Jumlah Terpakai KG, Jumlah Sisa/Lebih).
- `INVOICE BERKAH ABADI REV.xlsx` — sisi **penjualan** (invoice ke SPPG per PO). 1 sheet = 1 PO. Kolom: No, Nama Barang, Kuantitas, Satuan, Harga, Jumlah, Harga Net (modal), H. Jual, Fee. Sheet `Lembar1` = rekap master seluruh transaksi (Harga Suplier, Harga Jual, Profit, status Sudah/Belum Cair, subtotal per tanggal, grand total: Jual Rp 16.779.000 / Modal Rp 14.096.000 / Profit Rp 2.683.000).

**Masalah Excel yang harus diatasi web:** error rumus (`#N/A`, `#VALUE!`), nama barang ditulis ulang manual (tidak konsisten), satuan beragam, dan baris data janggal (mis. harga suplier salah ketik menghasilkan profit minus ekstrem).

## 2. Tujuan

Membangun **aplikasi web kelola transaksi** (bukan sekadar penampil) yang:
- Mencatat pembelian & penjualan, menghitung **profit otomatis** dan **bebas dari error rumus Excel**.
- Dipakai **1 orang** (pemilik), **online** (dapat diakses dari HP/laptop di mana saja).
- Mengimpor data dari 2 file Excel yang ada sebagai **data awal**.

## 3. Lingkup (Scope)

**Termasuk:** Dashboard profit, manajemen pembelian, manajemen penjualan/invoice, status pembayaran (Cair/Belum Cair), cetak/export invoice PDF & Excel, manajemen stok (masuk − terpakai = sisa), master produk/pemasok/pelanggan, impor data awal dari Excel, login 1 akun.

**Tidak termasuk (fase berikutnya):** multi-pengguna/peran, multi-cabang, integrasi pajak/e-faktur resmi, aplikasi mobile native.

## 4. Arsitektur & Teknologi

- **Frontend & Backend:** Next.js (React, App Router) — satu codebase, deploy ke **Vercel** (free tier).
- **Database:** **Supabase (Postgres)** (free tier).
- **Auth:** Supabase Auth — 1 akun pemilik (email + password).
- **Export:** PDF invoice + export Excel (sheetjs/xlsx).
- **Impor awal:** script sekali-jalan membaca 2 file `.xlsx` → mengisi database.
- **Repo git:** repo tersendiri di dalam folder `project_MBG` (terpisah dari repo home), siap di-push ke GitHub untuk deploy Vercel.

## 5. Model Data

| Tabel | Kolom utama | Sumber Excel |
|---|---|---|
| `products` | id, nama, satuan, harga_modal_default, harga_jual_default | gabungan nama barang kedua file |
| `suppliers` | id, nama | kolom "Keterangan" Faktur Belanja |
| `customers` | id, nama, alamat, bank, no_rekening, atas_nama | kop Invoice |
| `purchases` (header) | id, tanggal, catatan, total_net | tiap sheet FAKTUR BELANJA |
| `purchase_items` | id, purchase_id, product_id, bobot_kg, qty, satuan, harga, diskon_persen, jumlah, supplier_id | baris faktur belanja |
| `sales` (header) | id, no_po, no_invoice, customer_id, tanggal_antar, status_bayar (cair/belum), terbilang, total_jual, total_modal, total_fee | tiap Faktur PO-xx |
| `sale_items` | id, sale_id, product_id, qty, satuan, harga_jual, harga_modal, jumlah_jual, jumlah_modal, fee | baris invoice |
| `stock` | product_id, qty_masuk, qty_terpakai, qty_sisa (turunan/agregat) | blok kanan Faktur Belanja |

### Aturan hitung inti
- `jumlah = qty × harga` (pembelian) / `qty × harga_jual` (penjualan).
- `fee/profit per item = jumlah_jual − jumlah_modal`.
- `profit total = Σ fee item`.
- **Anti-error:** bila penyebut 0 atau input kosong → hasil 0 (tidak pernah memunculkan `#VALUE!`/`#N/A`). Validasi input mencegah harga/qty tidak wajar.
- **Stok sisa** = Σ qty_masuk (pembelian) − Σ qty_terpakai (penjualan/pemakaian) per produk.

## 6. Halaman & Menu

1. **Dashboard** — KPI: Total Jual, Total Modal, Profit, Piutang Belum Cair; grafik profit per tanggal; ringkasan transaksi terbaru.
2. **Pembelian** — daftar faktur belanja + form tambah/edit multi-baris (pilih produk & pemasok, total otomatis).
3. **Penjualan / Invoice** — daftar PO + form buat invoice (auto-isi harga modal & jual dari master, hitung profit & fee otomatis), tombol **Cetak PDF**.
4. **Status Pembayaran** — tandai Cair/Belum Cair per invoice, total piutang.
5. **Produk** — master barang + harga modal/jual default.
6. **Stok** — sisa stok per bahan (masuk − terpakai).
7. **Pemasok & Pelanggan** — data master.

## 7. Tampilan

- Bersih, modern, **mobile-friendly** (dapat dibuka dari HP).
- Memakai panduan skill *frontend-design* agar tidak terlihat seperti template default.
- Branding dapat disesuaikan (nama "Toko Berkah Abadi", warna).
- Bahasa UI: Indonesia.

## 8. Impor Data Awal

Script membaca kedua `.xlsx`:
- Bangun master `products` dari nama barang unik (normalisasi nama duplikat/typo sebisanya, sisanya ditandai untuk dirapikan manual).
- Isi `purchases`/`purchase_items` dari sheet Faktur Belanja.
- Isi `sales`/`sale_items` dari sheet Faktur PO + rekap `Lembar1` (status Cair/Belum, tanggal).
- Lewati/baris bertanda error (`#N/A`, `#VALUE!`) dicatat dalam log, tidak menggagalkan impor.

## 9. Deploy

- Saya siapkan seluruh kode + konfigurasi.
- Pemilik cukup punya akun gratis **Vercel** + **Supabase** (dengan panduan langkah).
- Data Excel diimpor sebagai data awal saat setup.

## 10. Kriteria Selesai (Definition of Done)

- Aplikasi berjalan online, bisa login, dan menampilkan dashboard dengan angka yang konsisten terhadap rekap Excel (`Lembar1`).
- Pembelian & penjualan bisa ditambah/edit; profit & total terhitung otomatis tanpa error.
- Invoice bisa dicetak/diekspor PDF.
- Status pembayaran & stok berfungsi.
- Data awal dari kedua file Excel berhasil diimpor.
