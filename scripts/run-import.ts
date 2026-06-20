/**
 * Orchestrator impor data awal ke Supabase.
 * Jalankan: npx tsx scripts/run-import.ts
 *
 * Menggunakan TOTAL TERCATAT dari Excel (bukan rekalkulasi qty×harga).
 * Baris yang tidak konsisten (rekalkulasi ≠ total tercatat, atau profit negatif)
 * ditandai perlu_cek=true dengan catatan Bahasa Indonesia.
 *
 * Urutan clear (FK-safe): sale_items → sales → purchase_items → purchases
 * Products, suppliers, customers TIDAK dihapus.
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'
import { parseFakturBelanja } from '../src/lib/import/parse-faktur-belanja'
import { parseInvoiceRecap } from '../src/lib/import/parse-invoice'

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

/** Konversi ke angka; non-finite → 0 */
const num = (v: unknown): number => {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}

/** Pembagi aman: bila penyebut 0 → 0 */
const safe = (a: number, b: number): number => (b === 0 ? 0 : a / b)

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
  console.log('=== Impor data ke Supabase (total tercatat + flagging) ===')
  console.log(`URL: ${SUPABASE_URL}`)

  // 1) Pelanggan default (insert jika belum ada)
  console.log('\n[1/5] Menyiapkan pelanggan default...')
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

  // 2) Hapus data transaksional lama (FK-safe order)
  console.log('\n[2/5] Membersihkan data transaksional lama...')

  const { error: delSaleItems } = await db
    .from('sale_items')
    .delete()
    .not('id', 'is', null)
  if (delSaleItems) throw new Error(`Gagal hapus sale_items: ${delSaleItems.message}`)
  console.log('  ✓ sale_items dihapus.')

  const { error: delSales } = await db
    .from('sales')
    .delete()
    .not('id', 'is', null)
  if (delSales) throw new Error(`Gagal hapus sales: ${delSales.message}`)
  console.log('  ✓ sales dihapus.')

  const { error: delPurItems } = await db
    .from('purchase_items')
    .delete()
    .not('id', 'is', null)
  if (delPurItems) throw new Error(`Gagal hapus purchase_items: ${delPurItems.message}`)
  console.log('  ✓ purchase_items dihapus.')

  const { error: delPurs } = await db
    .from('purchases')
    .delete()
    .not('id', 'is', null)
  if (delPurs) throw new Error(`Gagal hapus purchases: ${delPurs.message}`)
  console.log('  ✓ purchases dihapus.')

  // 3) Parse & impor faktur belanja (gunakan total tercatat item.jumlah)
  console.log('\n[3/5] Impor FAKTUR BELANJA (pembelian, total tercatat)...')
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

      // Gunakan total tercatat (it.jumlah = col[7] di faktur belanja)
      const jumlah = it.jumlah
      total += jumlah

      // Flag bila rekalkulasi ≠ total tercatat
      const recompute = num(it.qty) * num(it.harga) * (1 - num(it.diskonPersen) / 100)
      const perlu_cek = Math.abs(recompute - jumlah) > 1
      const catatan = perlu_cek
        ? `qty×harga×(1-diskon) (${Math.round(recompute)}) ≠ jumlah tercatat (${jumlah})`
        : null

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
        perlu_cek,
        catatan,
      })
      if (itemErr)
        throw new Error(`Gagal insert purchase_item "${it.nama}": ${itemErr.message}`)
      totalPurchaseItems++
    }

    await db.from('purchases').update({ total_net: total }).eq('id', pur!.id)
    console.log(`  ✓ ${sheet.tanggal} — ${sheet.items.length} item, total Rp ${total.toLocaleString('id-ID')}`)
  }
  console.log(`  Total purchase_items: ${totalPurchaseItems}`)

  // 4) Parse & impor invoice recap (gunakan total tercatat jumlahJual/jumlahModal)
  console.log('\n[4/5] Impor INVOICE (penjualan, total tercatat + flagging)...')
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
  let flaggedCount = 0
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

      // Gunakan total tercatat dari Excel (col[7] dan col[8])
      const jumlah_jual = r.jumlahJual
      const jumlah_modal = r.jumlahModal
      const fee = jumlah_jual - jumlah_modal

      // Harga satuan diturunkan dari total tercatat (konsisten dengan total tersimpan)
      const qty = r.volume
      const harga_jual = safe(jumlah_jual, qty)
      const harga_modal = safe(jumlah_modal, qty)

      tj += jumlah_jual
      tm += jumlah_modal
      tf += fee

      // ── Flagging ─────────────────────────────────────────────────────────
      const catatanParts: string[] = []

      // (a) qty × hargaJual unit (col[6]) ≠ jumlah tercatat (col[7])
      const recompute = qty * r.hargaJual
      if (Math.abs(recompute - jumlah_jual) > 1) {
        catatanParts.push(
          `qty×harga satuan (${Math.round(recompute)}) ≠ jumlah tercatat (${jumlah_jual})`
        )
      }

      // (b) profit negatif
      if (fee < 0) {
        catatanParts.push('profit negatif — kemungkinan harga modal salah ketik')
      }

      const perlu_cek = catatanParts.length > 0
      const catatan = perlu_cek ? catatanParts.join('; ') : null
      if (perlu_cek) flaggedCount++

      const { error: siErr } = await db.from('sale_items').insert({
        sale_id: sale!.id,
        product_id: pid,
        qty,
        satuan: r.satuan,
        harga_jual,
        harga_modal,
        jumlah_jual,
        jumlah_modal,
        fee,
        perlu_cek,
        catatan,
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
  console.log(`  Total sale_items: ${totalSaleItems}, ditandai perlu_cek: ${flaggedCount}`)

  // 5) Verifikasi agregat & flagged rows
  console.log('\n[5/5] Verifikasi agregat & baris ditandai...')

  const { data: sums, error: sumErr } = await db
    .from('sales')
    .select('total_jual, total_modal, total_fee')
  if (sumErr) throw new Error(`Gagal query sales: ${sumErr.message}`)

  const sumJual = sums!.reduce((a, r) => a + num(r.total_jual), 0)
  const sumModal = sums!.reduce((a, r) => a + num(r.total_modal), 0)
  const sumFee = sums!.reduce((a, r) => a + num(r.total_fee), 0)

  const TARGET_JUAL = 24_908_000
  const TARGET_MODAL = 27_788_000
  const TARGET_FEE = -2_880_000

  console.log('\n  ┌─────────────────────────────────────────────────────────────┐')
  console.log('  │ Perbandingan DB vs Target (Total Tercatat)                  │')
  console.log('  ├──────────────┬────────────────┬────────────────┬───────────┤')
  console.log('  │ Metrik       │ DB (Rp)        │ Target (Rp)    │ Delta     │')
  console.log('  ├──────────────┼────────────────┼────────────────┼───────────┤')
  console.log(`  │ Total Jual   │ ${String(sumJual).padStart(14)} │ ${String(TARGET_JUAL).padStart(14)} │ ${String(sumJual - TARGET_JUAL).padStart(9)} │`)
  console.log(`  │ Total Modal  │ ${String(sumModal).padStart(14)} │ ${String(TARGET_MODAL).padStart(14)} │ ${String(sumModal - TARGET_MODAL).padStart(9)} │`)
  console.log(`  │ Total Fee    │ ${String(sumFee).padStart(14)} │ ${String(TARGET_FEE).padStart(14)} │ ${String(sumFee - TARGET_FEE).padStart(9)} │`)
  console.log('  └──────────────┴────────────────┴────────────────┴───────────┘')

  // Daftar sale_items yang ditandai perlu_cek
  const { data: flagged, error: flagErr } = await db
    .from('sale_items')
    .select('id, qty, jumlah_jual, jumlah_modal, fee, catatan, products(nama)')
    .eq('perlu_cek', true)
  if (flagErr) throw new Error(`Gagal query flagged sale_items: ${flagErr.message}`)

  console.log(`\n  Baris sale_items ditandai perlu_cek: ${flagged?.length ?? 0}`)
  if (flagged && flagged.length > 0) {
    for (const f of flagged) {
      const nama = (f.products as unknown as { nama: string })?.nama ?? '?'
      console.log(
        `    • ${nama} | qty=${f.qty} | jual=${f.jumlah_jual} | modal=${f.jumlah_modal} | fee=${f.fee}`
      )
      console.log(`      catatan: ${f.catatan}`)
    }
  }

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
