'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { saveSale, deleteSale } from '@/lib/db/sales'
import type { SaleHeaderInput, SaleItemInput } from '@/lib/db/sales'

export async function saveSaleAction(
  header: {
    id?: string
    no_po: string
    no_invoice: string
    customer_id: string
    tanggal_antar: string
    status_bayar: 'cair' | 'belum'
    terbilang: string
  },
  items: {
    product_id: string | null
    qty: number
    satuan: string
    harga_jual: number
    harga_modal: number
  }[]
): Promise<{ ok: true; id: string }> {
  const headerInput: SaleHeaderInput = {
    id: header.id,
    no_po: header.no_po,
    no_invoice: header.no_invoice,
    customer_id: header.customer_id || undefined,
    tanggal_antar: header.tanggal_antar,
    status_bayar: header.status_bayar,
    terbilang: header.terbilang,
  }

  const itemInputs: SaleItemInput[] = items.map((it) => ({
    product_id: it.product_id,
    qty: it.qty,
    satuan: it.satuan,
    harga_jual: it.harga_jual,
    harga_modal: it.harga_modal,
  }))

  const id = await saveSale(headerInput, itemInputs)
  revalidatePath('/penjualan')
  return { ok: true, id }
}

export async function deleteSaleAction(id: string): Promise<void> {
  await deleteSale(id)
  revalidatePath('/penjualan')
  redirect('/penjualan')
}
