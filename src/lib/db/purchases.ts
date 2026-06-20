import { createClient } from '@/lib/supabase/server'
import { linePurchase } from '@/lib/calc'

// ── Types ──────────────────────────────────────────────────────────────────

export interface PurchaseHeader {
  id: string
  tanggal: string
  catatan: string | null
  total_net: number
  created_at: string
}

export interface PurchaseListRow extends PurchaseHeader {
  item_count: number
}

export interface PurchaseItemRow {
  id: string
  purchase_id: string
  product_id: string | null
  supplier_id: string | null
  bobot_kg: number | null
  qty: number
  satuan: string
  harga: number
  diskon_persen: number
  jumlah: number
  perlu_cek: boolean
  catatan: string | null
  // joined
  product_nama: string | null
  supplier_nama: string | null
}

export interface PurchaseDetail extends PurchaseHeader {
  items: PurchaseItemRow[]
}

// ── Input types ────────────────────────────────────────────────────────────

export interface PurchaseHeaderInput {
  id?: string
  tanggal: string
  catatan?: string
}

export interface PurchaseItemInput {
  product_id: string | null
  supplier_id: string | null
  bobot_kg: number | null
  qty: number
  satuan: string
  harga: number
  diskon_persen: number
}

// ── Queries ────────────────────────────────────────────────────────────────

export async function listPurchases(): Promise<PurchaseListRow[]> {
  const supabase = await createClient()

  // Fetch headers
  const { data: headers, error: hErr } = await supabase
    .from('purchases')
    .select('id, tanggal, catatan, total_net, created_at')
    .order('tanggal', { ascending: false })
  if (hErr) throw new Error(hErr.message)

  if (!headers || headers.length === 0) return []

  // Count items per purchase
  const ids = headers.map((h) => h.id)
  const { data: counts, error: cErr } = await supabase
    .from('purchase_items')
    .select('purchase_id')
    .in('purchase_id', ids)
  if (cErr) throw new Error(cErr.message)

  const countMap: Record<string, number> = {}
  for (const row of counts ?? []) {
    countMap[row.purchase_id] = (countMap[row.purchase_id] ?? 0) + 1
  }

  return headers.map((h) => ({
    ...h,
    catatan: h.catatan ?? null,
    item_count: countMap[h.id] ?? 0,
  })) as PurchaseListRow[]
}

export async function getPurchase(id: string): Promise<PurchaseDetail | null> {
  const supabase = await createClient()

  const { data: header, error: hErr } = await supabase
    .from('purchases')
    .select('id, tanggal, catatan, total_net, created_at')
    .eq('id', id)
    .single()
  if (hErr) {
    if (hErr.code === 'PGRST116') return null // tidak ada baris = not found
    throw hErr
  }

  const { data: items, error: iErr } = await supabase
    .from('purchase_items')
    .select(
      `id, purchase_id, product_id, supplier_id, bobot_kg, qty, satuan, harga, diskon_persen, jumlah, perlu_cek, catatan,
       products(nama),
       suppliers(nama)`
    )
    .eq('purchase_id', id)
    .order('id', { ascending: true })
  if (iErr) throw new Error(iErr.message)

  const mappedItems: PurchaseItemRow[] = (items ?? []).map((row) => {
    // supabase returns joined tables as nested objects
    const r = row as Record<string, unknown>
    const prod = r['products'] as { nama: string } | null
    const supp = r['suppliers'] as { nama: string } | null
    return {
      id: r['id'] as string,
      purchase_id: r['purchase_id'] as string,
      product_id: (r['product_id'] as string | null) ?? null,
      supplier_id: (r['supplier_id'] as string | null) ?? null,
      bobot_kg: (r['bobot_kg'] as number | null) ?? null,
      qty: Number(r['qty'] ?? 0),
      satuan: String(r['satuan'] ?? ''),
      harga: Number(r['harga'] ?? 0),
      diskon_persen: Number(r['diskon_persen'] ?? 0),
      jumlah: Number(r['jumlah'] ?? 0),
      perlu_cek: Boolean(r['perlu_cek']),
      catatan: (r['catatan'] as string | null) ?? null,
      product_nama: prod?.nama ?? null,
      supplier_nama: supp?.nama ?? null,
    }
  })

  return {
    id: header.id,
    tanggal: header.tanggal,
    catatan: header.catatan ?? null,
    total_net: Number(header.total_net ?? 0),
    created_at: header.created_at,
    items: mappedItems,
  }
}

// ── Mutations ──────────────────────────────────────────────────────────────

export async function savePurchase(
  header: PurchaseHeaderInput,
  items: PurchaseItemInput[]
): Promise<string> {
  const supabase = await createClient()

  // Compute jumlah per item and total_net
  const computedItems = items.map((item) => {
    const { jumlah } = linePurchase({ qty: item.qty, harga: item.harga, diskonPersen: item.diskon_persen })
    return { ...item, jumlah }
  })
  const total_net = computedItems.reduce((sum, it) => sum + it.jumlah, 0)

  let purchaseId: string

  if (header.id) {
    // Update existing header
    const { error } = await supabase
      .from('purchases')
      .update({ tanggal: header.tanggal, catatan: header.catatan ?? null, total_net })
      .eq('id', header.id)
    if (error) throw new Error(error.message)
    purchaseId = header.id
    // Delete existing items atomically (replace pattern)
    const { error: delErr } = await supabase
      .from('purchase_items')
      .delete()
      .eq('purchase_id', purchaseId)
    if (delErr) throw new Error(delErr.message)
  } else {
    // Insert new header
    const { data, error } = await supabase
      .from('purchases')
      .insert({ tanggal: header.tanggal, catatan: header.catatan ?? null, total_net })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    purchaseId = data.id
  }

  // Insert new items
  if (computedItems.length > 0) {
    const rows = computedItems.map((it) => ({
      purchase_id: purchaseId,
      product_id: it.product_id,
      supplier_id: it.supplier_id,
      bobot_kg: it.bobot_kg,
      qty: it.qty,
      satuan: it.satuan,
      harga: it.harga,
      diskon_persen: it.diskon_persen,
      jumlah: it.jumlah,
      perlu_cek: false,
      catatan: null,
    }))
    const { error: insErr } = await supabase.from('purchase_items').insert(rows)
    if (insErr) throw new Error(insErr.message)
  }

  return purchaseId
}

export async function deletePurchase(id: string): Promise<void> {
  const supabase = await createClient()
  // Items deleted via cascade (or explicit delete first)
  const { error: delItems } = await supabase
    .from('purchase_items')
    .delete()
    .eq('purchase_id', id)
  if (delItems) throw new Error(delItems.message)
  const { error } = await supabase.from('purchases').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
