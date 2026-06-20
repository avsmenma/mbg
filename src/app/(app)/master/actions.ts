'use server'

import { revalidatePath } from 'next/cache'
import { createSupplier, deleteSupplier, upsertCustomer } from '@/lib/db/master'

export async function actionCreateSupplier(formData: FormData) {
  await createSupplier({
    nama: String(formData.get('nama') ?? ''),
  })
  revalidatePath('/master')
}

export async function actionDeleteSupplier(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  await deleteSupplier(id)
  revalidatePath('/master')
}

export async function actionUpsertCustomer(formData: FormData) {
  const id = formData.get('id') ? String(formData.get('id')) : undefined
  await upsertCustomer({
    id,
    nama: String(formData.get('nama') ?? ''),
    alamat: String(formData.get('alamat') ?? ''),
    bank: String(formData.get('bank') ?? ''),
    no_rekening: String(formData.get('no_rekening') ?? ''),
    atas_nama: String(formData.get('atas_nama') ?? ''),
  })
  revalidatePath('/master')
}
