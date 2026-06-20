'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { savePurchase, deletePurchase } from '@/lib/db/purchases'
import type { PurchaseHeaderInput, PurchaseItemInput } from '@/lib/db/purchases'

export async function savePurchaseAction(
  header: { id?: string; tanggal: string; catatan: string },
  items: {
    product_id: string | null
    supplier_id: string | null
    bobot_kg: number | null
    qty: number
    satuan: string
    harga: number
    diskon_persen: number
  }[]
): Promise<void> {
  const headerInput: PurchaseHeaderInput = {
    id: header.id,
    tanggal: header.tanggal,
    catatan: header.catatan,
  }
  const itemInputs: PurchaseItemInput[] = items.map((it) => ({
    product_id: it.product_id,
    supplier_id: it.supplier_id,
    bobot_kg: it.bobot_kg,
    qty: it.qty,
    satuan: it.satuan,
    harga: it.harga,
    diskon_persen: it.diskon_persen,
  }))

  await savePurchase(headerInput, itemInputs)
  revalidatePath('/pembelian')
  redirect('/pembelian')
}

export async function deletePurchaseAction(id: string): Promise<void> {
  await deletePurchase(id)
  revalidatePath('/pembelian')
  redirect('/pembelian')
}
