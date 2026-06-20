import { createClient } from '@/lib/supabase/server'

export interface StockRow {
  product_id: string
  nama: string
  satuan: string
  qty_masuk: number
  qty_terpakai: number
  qty_sisa: number
}

export async function listStock(): Promise<StockRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stock_view')
    .select('product_id, nama, satuan, qty_masuk, qty_terpakai, qty_sisa')
    .order('nama', { ascending: true })
  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    return {
      product_id: String(r['product_id'] ?? ''),
      nama: String(r['nama'] ?? ''),
      satuan: String(r['satuan'] ?? ''),
      qty_masuk: Number(r['qty_masuk'] ?? 0),
      qty_terpakai: Number(r['qty_terpakai'] ?? 0),
      qty_sisa: Number(r['qty_sisa'] ?? 0),
    }
  })
}
