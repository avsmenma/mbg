import { createClient } from '@/lib/supabase/server'

// ── Suppliers ──────────────────────────────────────────────────────────────

export interface Supplier {
  id: string
  nama: string
}

export interface SupplierInput {
  nama: string
}

export async function listSuppliers(): Promise<Supplier[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, nama')
    .order('nama', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Supplier[]
}

export async function createSupplier(input: SupplierInput): Promise<Supplier> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .insert({ nama: input.nama.trim() })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Supplier
}

export async function deleteSupplier(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('suppliers').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Customers ─────────────────────────────────────────────────────────────

export interface Customer {
  id: string
  nama: string
  alamat: string
  bank: string
  no_rekening: string
  atas_nama: string
}

export interface CustomerInput {
  id?: string
  nama: string
  alamat: string
  bank: string
  no_rekening: string
  atas_nama: string
}

export async function listCustomers(): Promise<Customer[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customers')
    .select('id, nama, alamat, bank, no_rekening, atas_nama')
    .order('nama', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Customer[]
}

export async function upsertCustomer(input: CustomerInput): Promise<Customer> {
  const supabase = await createClient()
  const payload = {
    nama: input.nama.trim(),
    alamat: input.alamat.trim(),
    bank: input.bank.trim(),
    no_rekening: input.no_rekening.trim(),
    atas_nama: input.atas_nama.trim(),
  }

  if (input.id) {
    // Update existing
    const { data, error } = await supabase
      .from('customers')
      .update(payload)
      .eq('id', input.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as Customer
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('customers')
      .insert(payload)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as Customer
  }
}
