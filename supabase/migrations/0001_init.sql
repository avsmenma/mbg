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
