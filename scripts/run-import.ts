/**
 * Orchestrator impor data awal ke Supabase.
 * Jalankan: npx tsx scripts/run-import.ts
 *
 * Membaca dua file Excel di root repo dan mengisi tabel Supabase.
 * Script ini idempoten untuk products & suppliers (fetch-or-create by nama).
 * Untuk purchases & sales: jika sudah ada data, script berhenti agar tidak duplikasi.
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'
import { parseFakturBelanja } from '../src/lib/import/parse-faktur-belanja'
import { parseInvoiceRecap } from '../src/lib/import/parse-invoice'
import { linePurchase, lineSale } from '../src/lib/calc'

// ── Validasi env ──────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    'ERROR: NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY harus ada di .env.local'
  )
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: { transport: WebSocket },
})

// ── Helper: product idempoten ─────────────────────────────────────────────────
async function productId(
  nama: string,
  satuan: string,
  modal = 0,
  jual = 0
): Promise<string> {
  const { data } = await db.from('products').select('id').eq('nama', nama).maybeSingle()
  if (data) return data.id as string
  const { data: ins, error } = await db
    .from('products')
    .insert({ nama, satuan, harga_modal_default: modal, harga_jual_default: jual })
    .select('id')
    .single()
  if (error) throw new Error(`Gagal insert product "${nama}": ${error.message}`)
  return ins!.id as string
}

// ── Helper: supplier idempoten ────────────────────────────────────────────────
async function supplierId(nama: string): Promise<string | null> {
  if (!nama) return null
  const { data } = await db.from('suppliers').select('id').eq('nama', nama).maybeSingle()
  if (data) return data.id as string
  const { data: ins, error } = await db
    .from('suppliers')
    .insert({ nama })
    .select('id')
    .single()
  if (error) throw new Error(`Gagal insert supplier "${nama}": ${error.message}`)
  return ins!.id as string
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Impor data ke Supabase ===')
  console.log(`URL: ${SUPABASE_URL}`)

  // 1) Pelanggan default (insert jika belum ada)
  console.log('\n[1/4] Menyiapkan pelanggan default...')
  const DEFAULT_CUSTOMER = 'SPPG Roban 4 (Meranti)'
  const { data: existingCust } = await db
    .from('customers')
    .select('id')
    .eq('nama', DEFAULT_CUSTOMER)
    .maybeSingle()
  if (!existingCust) {
    const { error: custErr } = await db.from('customers').insert({
      nama: DEFAULT_CUSTOMER,
      bank: 'BNI',
      no_rekening: '80985822',
      atas_nama: 'TRI APRILIYANTA',
    })
    if (custErr) throw new Error(`Gagal insert pelanggan: ${custErr.message}`)
    console.log('  ✓ Pelanggan default dibuat.')
  } else {
    console.log('  ✓ Pelanggan default sudah ada, dilewati.')
  }

  // 2) Guard: cek apakah purchases sudah ada data
  console.log('\n[2/4] Impor FAKTUR BELANJA (pembelian)...')
  const { count: purCount, error: purCountErr } = await db
    .from('purchases')
    .select('id', { count: 'exact', head: true })
  if (purCountErr) throw new Error(`Gagal cek tabel purchases: ${purCountErr.message}`)
  if ((purCount ?? 0) > 0) {
    console.log('Sudah ada data pembelian — impor dibatalkan agar tidak dobel')
    process.exit(0)
  }

  // 3) Parse & impor faktur belanja
  const sheets = parseFakturBelanja('FAKTUR BELANJA.xlsx')
  console.log(`  Ditemukan ${sheets.length} sheet (faktur) untuk diimpor.`)

  let totalPurchaseItems = 0
  for (const sheet of sheets) {
    const { data: pur, error: purErr } = await db
      .from('purchases')
      .insert({ tanggal: sheet.tanggal.slice(0, 10), total_net: 0 })
      .select('id')
      .single()
    if (purErr) throw new Error(`Gagal insert purchase tanggal ${sheet.tanggal}: ${purErr.message}`)

    let total = 0
    for (const it of sheet.items) {
      const pid = await productId(it.nama, it.satuan)
      const sid = await supplierId(it.supplier)
      const { jumlah } = linePurchase({ qty: it.qty, harga: it.harga, diskonPersen: it.diskonPersen })
      total += jumlah

      const { error: itemErr } = await db.from('purchase_items').insert({
        purchase_id: pur!.id,
        product_id: pid,
        supplier_id: sid,
        bobot_kg: it.bobotKg,
        qty: it.qty,
        satuan: it.satuan,
        harga: it.harga,
        diskon_persen: it.diskonPersen,
        jumlah,
      })
      if (itemErr)
        throw new Error(`Gagal insert purchase_item "${it.nama}": ${itemErr.message}`)
      totalPurchaseItems++
    }

    await db.from('purchases').update({ total_net: total }).eq('id', pur!.id)
    console.log(`  ✓ ${sheet.tanggal} — ${sheet.items.length} item, total Rp ${total.toLocaleString('id-ID')}`)
  }
  console.log(`  Total purchase_items: ${totalPurchaseItems}`)

  // 4) Guard: cek apakah sales sudah ada data
  console.log('\n[3/4] Impor INVOICE (penjualan)...')
  const { count: saleCount, error: saleCountErr } = await db
    .from('sales')
    .select('id', { count: 'exact', head: true })
  if (saleCountErr) throw new Error(`Gagal cek tabel sales: ${saleCountErr.message}`)
  if ((saleCount ?? 0) > 0) {
    console.log('Sudah ada data penjualan — impor dibatalkan agar tidak dobel')
    process.exit(0)
  }

  // 5) Parse & impor invoice recap
  const recap = parseInvoiceRecap('INVOICE BERKAH ABADI REV.xlsx')
  console.log(`  Ditemukan ${recap.length} baris penjualan untuk diimpor.`)

  // Kelompokkan per tanggal (null dikelompokkan ke kunci '__null__')
  const byDate = new Map<string, typeof recap>()
  for (const r of recap) {
    const k = r.tanggal ? r.tanggal.slice(0, 10) : '__null__'
    const existing = byDate.get(k)
    if (existing) existing.push(r)
    else byDate.set(k, [r])
  }

  let totalSaleItems = 0
  for (const [tgl, rows] of byDate) {
    const tanggalAntar = tgl === '__null__' ? null : tgl
    const allCair = rows.every((r) => r.statusBayar === 'cair')
    const { data: sale, error: saleErr } = await db
      .from('sales')
      .insert({
        tanggal_antar: tanggalAntar,
        status_bayar: allCair ? 'cair' : 'belum',
      })
      .select('id')
      .single()
    if (saleErr) throw new Error(`Gagal insert sale tanggal ${tgl}: ${saleErr.message}`)

    let tj = 0,
      tm = 0,
      tf = 0
    for (const r of rows) {
      const pid = await productId(r.nama, r.satuan, r.hargaModal, r.hargaJual)
      const { jumlahJual, jumlahModal, fee } = lineSale({
        qty: r.volume,
        hargaJual: r.hargaJual,
        hargaModal: r.hargaModal,
      })
      tj += jumlahJual
      tm += jumlahModal
      tf += fee

      const { error: siErr } = await db.from('sale_items').insert({
        sale_id: sale!.id,
        product_id: pid,
        qty: r.volume,
        satuan: r.satuan,
        harga_jual: r.hargaJual,
        harga_modal: r.hargaModal,
        jumlah_jual: jumlahJual,
        jumlah_modal: jumlahModal,
        fee,
      })
      if (siErr)
        throw new Error(`Gagal insert sale_item "${r.nama}": ${siErr.message}`)
      totalSaleItems++
    }

    await db
      .from('sales')
      .update({ total_jual: tj, total_modal: tm, total_fee: tf })
      .eq('id', sale!.id)
    console.log(
      `  ✓ ${tanggalAntar ?? 'tanpa-tanggal'} — ${rows.length} item, jual Rp ${tj.toLocaleString('id-ID')}, modal Rp ${tm.toLocaleString('id-ID')}, fee Rp ${tf.toLocaleString('id-ID')}`
    )
  }
  console.log(`  Total sale_items: ${totalSaleItems}`)

  // 6) Verifikasi agregat vs rekap Excel
  console.log('\n[4/4] Verifikasi agregat vs rekap Excel...')
  const { data: sums, error: sumErr } = await db
    .from('sales')
    .select('total_jual, total_modal, total_fee')
  if (sumErr) throw new Error(`Gagal query sales: ${sumErr.message}`)

  const sumJual = sums!.reduce((a, r) => a + (r.total_jual ?? 0), 0)
  const sumModal = sums!.reduce((a, r) => a + (r.total_modal ?? 0), 0)
  const sumFee = sums!.reduce((a, r) => a + (r.total_fee ?? 0), 0)

  const EXCEL_JUAL = 16_779_000
  const EXCEL_MODAL = 14_096_000
  const EXCEL_PROFIT = 2_683_000

  console.log('\n  ┌─────────────────────────────────────────────────────────┐')
  console.log('  │ Perbandingan DB vs Rekap Excel (Lembar1)               │')
  console.log('  ├──────────────┬────────────┬────────────┬──────────────┤')
  console.log('  │ Metrik       │ DB (Rp)    │ Excel (Rp) │ Delta (Rp)   │')
  console.log('  ├──────────────┼────────────┼────────────┼──────────────┤')
  console.log(`  │ Total Jual   │ ${String(sumJual).padStart(10)} │ ${String(EXCEL_JUAL).padStart(10)} │ ${String(sumJual - EXCEL_JUAL).padStart(12)} │`)
  console.log(`  │ Total Modal  │ ${String(sumModal).padStart(10)} │ ${String(EXCEL_MODAL).padStart(10)} │ ${String(sumModal - EXCEL_MODAL).padStart(12)} │`)
  console.log(`  │ Total Profit │ ${String(sumFee).padStart(10)} │ ${String(EXCEL_PROFIT).padStart(10)} │ ${String(sumFee - EXCEL_PROFIT).padStart(12)} │`)
  console.log('  └──────────────┴────────────┴────────────┴──────────────┘')

  // Ringkasan row counts
  const { count: prodCount } = await db.from('products').select('id', { count: 'exact', head: true })
  const { count: supCount } = await db.from('suppliers').select('id', { count: 'exact', head: true })
  const { count: purCountFinal } = await db.from('purchases').select('id', { count: 'exact', head: true })
  const { count: purItemCount } = await db.from('purchase_items').select('id', { count: 'exact', head: true })
  const { count: saleCountFinal } = await db.from('sales').select('id', { count: 'exact', head: true })
  const { count: saleItemCount } = await db.from('sale_items').select('id', { count: 'exact', head: true })

  console.log('\n  Row counts di Supabase:')
  console.log(`    products:       ${prodCount}`)
  console.log(`    suppliers:      ${supCount}`)
  console.log(`    purchases:      ${purCountFinal}`)
  console.log(`    purchase_items: ${purItemCount}`)
  console.log(`    sales:          ${saleCountFinal}`)
  console.log(`    sale_items:     ${saleItemCount}`)

  console.log('\nImpor selesai.')
}

main().catch((e) => {
  console.error('ERROR:', e)
  process.exit(1)
})
