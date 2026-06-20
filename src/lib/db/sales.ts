import { createClient } from '@/lib/supabase/server'
import { lineSale, totalSale } from '@/lib/calc'

// ── Types ──────────────────────────────────────────────────────────────────

export interface SaleHeader {
  id: string
  no_po: string | null
  no_invoice: string | null
  customer_id: string | null
  tanggal_antar: string
  status_bayar: 'cair' | 'belum'
  terbilang: string | null
  total_jual: number
  total_modal: number
  total_fee: number
  created_at: string
}

export interface SaleListRow {
  id: string
  no_invoice: string | null
  customer_nama: string | null
  tanggal_antar: string
  total_jual: number
  total_fee: number
  status_bayar: 'cair' | 'belum'
}

export interface SaleItemRow {
  id: string
  sale_id: string
  product_id: string | null
  qty: number
  satuan: string
  harga_jual: number
  harga_modal: number
  jumlah_jual: number
  jumlah_modal: number
  fee: number
  perlu_cek: boolean
  catatan: string | null
  // joined
  product_nama: string | null
}

export interface SaleDetail extends SaleHeader {
  customer_nama: string | null
  customer_alamat: string | null
  customer_bank: string | null
  customer_no_rekening: string | null
  customer_atas_nama: string | null
  items: SaleItemRow[]
}

// ── Input types ────────────────────────────────────────────────────────────

export interface SaleHeaderInput {
  id?: string
  no_po?: string
  no_invoice?: string
  customer_id?: string
  tanggal_antar: string
  status_bayar: 'cair' | 'belum'
  terbilang?: string
}

export interface SaleItemInput {
  product_id: string | null
  qty: number
  satuan: string
  harga_jual: number
  harga_modal: number
}

// ── Queries ────────────────────────────────────────────────────────────────

export async function listSales(): Promise<SaleListRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sales')
    .select(
      `id, no_invoice, tanggal_antar, total_jual, total_fee, status_bayar,
       customers(nama)`
    )
    .order('tanggal_antar', { ascending: false })
  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    const cust = r['customers'] as { nama: string } | null
    return {
      id: r['id'] as string,
      no_invoice: (r['no_invoice'] as string | null) ?? null,
      customer_nama: cust?.nama ?? null,
      tanggal_antar: r['tanggal_antar'] as string,
      total_jual: Number(r['total_jual'] ?? 0),
      total_fee: Number(r['total_fee'] ?? 0),
      status_bayar: (r['status_bayar'] as 'cair' | 'belum') ?? 'belum',
    }
  })
}

export async function getSale(id: string): Promise<SaleDetail | null> {
  const supabase = await createClient()

  const { data: header, error: hErr } = await supabase
    .from('sales')
    .select(
      `id, no_po, no_invoice, customer_id, tanggal_antar, status_bayar,
       terbilang, total_jual, total_modal, total_fee, created_at,
       customers(nama, alamat, bank, no_rekening, atas_nama)`
    )
    .eq('id', id)
    .single()
  if (hErr) {
    if (hErr.code === 'PGRST116') return null // tidak ada baris = not found
    throw hErr
  }

  const { data: items, error: iErr } = await supabase
    .from('sale_items')
    .select(
      `id, sale_id, product_id, qty, satuan, harga_jual, harga_modal,
       jumlah_jual, jumlah_modal, fee, perlu_cek, catatan,
       products(nama)`
    )
    .eq('sale_id', id)
    .order('id', { ascending: true })
  if (iErr) throw new Error(iErr.message)

  const mappedItems: SaleItemRow[] = (items ?? []).map((row) => {
    const r = row as Record<string, unknown>
    const prod = r['products'] as { nama: string } | null
    return {
      id: r['id'] as string,
      sale_id: r['sale_id'] as string,
      product_id: (r['product_id'] as string | null) ?? null,
      qty: Number(r['qty'] ?? 0),
      satuan: String(r['satuan'] ?? ''),
      harga_jual: Number(r['harga_jual'] ?? 0),
      harga_modal: Number(r['harga_modal'] ?? 0),
      jumlah_jual: Number(r['jumlah_jual'] ?? 0),
      jumlah_modal: Number(r['jumlah_modal'] ?? 0),
      fee: Number(r['fee'] ?? 0),
      perlu_cek: Boolean(r['perlu_cek']),
      catatan: (r['catatan'] as string | null) ?? null,
      product_nama: prod?.nama ?? null,
    }
  })

  const h = header as Record<string, unknown>
  const cust = h['customers'] as {
    nama: string; alamat: string; bank: string; no_rekening: string; atas_nama: string
  } | null

  return {
    id: h['id'] as string,
    no_po: (h['no_po'] as string | null) ?? null,
    no_invoice: (h['no_invoice'] as string | null) ?? null,
    customer_id: (h['customer_id'] as string | null) ?? null,
    tanggal_antar: h['tanggal_antar'] as string,
    status_bayar: (h['status_bayar'] as 'cair' | 'belum') ?? 'belum',
    terbilang: (h['terbilang'] as string | null) ?? null,
    total_jual: Number(h['total_jual'] ?? 0),
    total_modal: Number(h['total_modal'] ?? 0),
    total_fee: Number(h['total_fee'] ?? 0),
    created_at: h['created_at'] as string,
    customer_nama: cust?.nama ?? null,
    customer_alamat: cust?.alamat ?? null,
    customer_bank: cust?.bank ?? null,
    customer_no_rekening: cust?.no_rekening ?? null,
    customer_atas_nama: cust?.atas_nama ?? null,
    items: mappedItems,
  }
}

// ── Mutations ──────────────────────────────────────────────────────────────

export async function saveSale(
  header: SaleHeaderInput,
  items: SaleItemInput[]
): Promise<string> {
  const supabase = await createClient()

  // Compute per-item values via lineSale (sole math source)
  const computedItems = items.map((item) => {
    const { jumlahJual, jumlahModal, fee } = lineSale({
      qty: item.qty,
      hargaJual: item.harga_jual,
      hargaModal: item.harga_modal,
    })
    return { ...item, jumlah_jual: jumlahJual, jumlah_modal: jumlahModal, fee }
  })

  // Compute header totals via totalSale (sole math source)
  const { totalJual, totalModal, totalFee } = totalSale(
    items.map((it) => ({ qty: it.qty, hargaJual: it.harga_jual, hargaModal: it.harga_modal }))
  )

  let saleId: string

  if (header.id) {
    // Update existing header
    const { error } = await supabase
      .from('sales')
      .update({
        no_po: header.no_po ?? null,
        no_invoice: header.no_invoice ?? null,
        customer_id: header.customer_id ?? null,
        tanggal_antar: header.tanggal_antar,
        status_bayar: header.status_bayar,
        terbilang: header.terbilang ?? null,
        total_jual: totalJual,
        total_modal: totalModal,
        total_fee: totalFee,
      })
      .eq('id', header.id)
    if (error) throw new Error(error.message)
    saleId = header.id

    // Delete existing items (replace pattern)
    const { error: delErr } = await supabase
      .from('sale_items')
      .delete()
      .eq('sale_id', saleId)
    if (delErr) throw new Error(delErr.message)
  } else {
    // Insert new header
    const { data, error } = await supabase
      .from('sales')
      .insert({
        no_po: header.no_po ?? null,
        no_invoice: header.no_invoice ?? null,
        customer_id: header.customer_id ?? null,
        tanggal_antar: header.tanggal_antar,
        status_bayar: header.status_bayar,
        terbilang: header.terbilang ?? null,
        total_jual: totalJual,
        total_modal: totalModal,
        total_fee: totalFee,
      })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    saleId = (data as { id: string }).id
  }

  // Insert new items
  if (computedItems.length > 0) {
    const rows = computedItems.map((it) => ({
      sale_id: saleId,
      product_id: it.product_id,
      qty: it.qty,
      satuan: it.satuan,
      harga_jual: it.harga_jual,
      harga_modal: it.harga_modal,
      jumlah_jual: it.jumlah_jual,
      jumlah_modal: it.jumlah_modal,
      fee: it.fee,
      perlu_cek: false,
      catatan: null,
    }))
    const { error: insErr } = await supabase.from('sale_items').insert(rows)
    if (insErr) throw new Error(insErr.message)
  }

  return saleId
}

export async function deleteSale(id: string): Promise<void> {
  const supabase = await createClient()
  // Delete items first then header
  const { error: delItems } = await supabase
    .from('sale_items')
    .delete()
    .eq('sale_id', id)
  if (delItems) throw new Error(delItems.message)
  const { error } = await supabase.from('sales').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
