-- Migration 0003: Row Level Security
-- Tujuan: Batasi akses tabel hanya untuk pengguna terautentikasi.
-- Anon key (browser publik tanpa JWT) tidak dapat membaca/menulis.
--
-- Cara pakai: Jalankan di Supabase SQL Editor setelah 0001 dan 0002.
-- Idempoten: policy di-drop dulu sebelum dibuat ulang.

-- ── products ────────────────────────────────────────────────────────────────
alter table products enable row level security;

drop policy if exists "produk_auth_all" on products;
create policy "produk_auth_all" on products
  for all to authenticated using (true) with check (true);

-- ── suppliers ───────────────────────────────────────────────────────────────
alter table suppliers enable row level security;

drop policy if exists "supplier_auth_all" on suppliers;
create policy "supplier_auth_all" on suppliers
  for all to authenticated using (true) with check (true);

-- ── customers ───────────────────────────────────────────────────────────────
alter table customers enable row level security;

drop policy if exists "pelanggan_auth_all" on customers;
create policy "pelanggan_auth_all" on customers
  for all to authenticated using (true) with check (true);

-- ── purchases ───────────────────────────────────────────────────────────────
alter table purchases enable row level security;

drop policy if exists "pembelian_auth_all" on purchases;
create policy "pembelian_auth_all" on purchases
  for all to authenticated using (true) with check (true);

-- ── purchase_items ──────────────────────────────────────────────────────────
alter table purchase_items enable row level security;

drop policy if exists "item_pembelian_auth_all" on purchase_items;
create policy "item_pembelian_auth_all" on purchase_items
  for all to authenticated using (true) with check (true);

-- ── sales ───────────────────────────────────────────────────────────────────
alter table sales enable row level security;

drop policy if exists "penjualan_auth_all" on sales;
create policy "penjualan_auth_all" on sales
  for all to authenticated using (true) with check (true);

-- ── sale_items ──────────────────────────────────────────────────────────────
alter table sale_items enable row level security;

drop policy if exists "item_penjualan_auth_all" on sale_items;
create policy "item_penjualan_auth_all" on sale_items
  for all to authenticated using (true) with check (true);

-- ── stock_view: security_invoker ─────────────────────────────────────────────
-- Postgres 15+ / Supabase: view mematuhi RLS tabel yang direferensikan.
alter view stock_view set (security_invoker = on);
