-- Penanda baris yang perlu diperiksa pemilik (data Excel tidak konsisten).
-- perlu_cek = true bila jumlah tercatat di Excel tidak cocok dengan qty x harga satuan,
-- atau ada kejanggalan lain (mis. profit negatif karena typo harga).
-- catatan = penjelasan singkat kenapa baris ini ditandai.

alter table sale_items     add column if not exists perlu_cek boolean default false;
alter table sale_items     add column if not exists catatan   text;
alter table purchase_items add column if not exists perlu_cek boolean default false;
alter table purchase_items add column if not exists catatan   text;
