'use server'

import { revalidatePath } from 'next/cache'
import { createProduct, updateProduct, deleteProduct } from '@/lib/db/products'

export async function actionCreateProduct(formData: FormData) {
  await createProduct({
    nama: String(formData.get('nama') ?? ''),
    satuan: String(formData.get('satuan') ?? ''),
    harga_modal_default: String(formData.get('harga_modal_default') ?? '0'),
    harga_jual_default: String(formData.get('harga_jual_default') ?? '0'),
  })
  revalidatePath('/produk')
}

export async function actionUpdateProduct(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  await updateProduct(id, {
    nama: String(formData.get('nama') ?? ''),
    satuan: String(formData.get('satuan') ?? ''),
    harga_modal_default: String(formData.get('harga_modal_default') ?? '0'),
    harga_jual_default: String(formData.get('harga_jual_default') ?? '0'),
  })
  revalidatePath('/produk')
}

export async function actionDeleteProduct(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  await deleteProduct(id)
  revalidatePath('/produk')
}
