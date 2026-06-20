import { createClient } from '@/lib/supabase/server'

export interface Product {
  id: string
  nama: string
  satuan: string
  harga_modal_default: number
  harga_jual_default: number
  created_at: string
}

export interface ProductInput {
  nama: string
  satuan: string
  harga_modal_default: number | string
  harga_jual_default: number | string
}

function toNum(v: number | string | undefined | null): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export async function listProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('nama', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Product[]
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .insert({
      nama: input.nama.trim(),
      satuan: input.satuan.trim(),
      harga_modal_default: toNum(input.harga_modal_default),
      harga_jual_default: toNum(input.harga_jual_default),
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Product
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
  const supabase = await createClient()
  const patch: Record<string, unknown> = {}
  if (input.nama !== undefined) patch.nama = input.nama.trim()
  if (input.satuan !== undefined) patch.satuan = input.satuan.trim()
  if (input.harga_modal_default !== undefined) patch.harga_modal_default = toNum(input.harga_modal_default)
  if (input.harga_jual_default !== undefined) patch.harga_jual_default = toNum(input.harga_jual_default)
  const { data, error } = await supabase
    .from('products')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Product
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
