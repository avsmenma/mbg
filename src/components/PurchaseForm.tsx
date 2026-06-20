'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { linePurchase } from '@/lib/calc'
import { rupiah } from '@/lib/format'
import type { Product } from '@/lib/db/products'
import type { Supplier } from '@/lib/db/master'
import type { PurchaseDetail } from '@/lib/db/purchases'

// ── Types ──────────────────────────────────────────────────────────────────

interface ItemRow {
  key: number
  product_id: string
  supplier_id: string
  bobot_kg: string
  qty: string
  satuan: string
  harga: string
  diskon_persen: string
}

interface Props {
  products: Product[]
  suppliers: Supplier[]
  initial?: PurchaseDetail | null
  saveAction: (
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
  ) => Promise<{ ok: true; id: string }>
}

let keySeq = 0
function nextKey() {
  return ++keySeq
}

function emptyRow(): ItemRow {
  return {
    key: nextKey(),
    product_id: '',
    supplier_id: '',
    bobot_kg: '',
    qty: '1',
    satuan: '',
    harga: '0',
    diskon_persen: '0',
  }
}

function rowToCalc(row: ItemRow) {
  return linePurchase({
    qty: Number(row.qty) || 0,
    harga: Number(row.harga) || 0,
    diskonPersen: Number(row.diskon_persen) || 0,
  })
}

// ── Component ──────────────────────────────────────────────────────────────

export default function PurchaseForm({ products, suppliers, initial, saveAction }: Props) {
  const router = useRouter()

  const [tanggal, setTanggal] = useState<string>(initial?.tanggal ?? new Date().toISOString().slice(0, 10))
  const [catatan, setCatatan] = useState<string>(initial?.catatan ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [rows, setRows] = useState<ItemRow[]>(() => {
    if (initial && initial.items.length > 0) {
      return initial.items.map((it) => ({
        key: nextKey(),
        product_id: it.product_id ?? '',
        supplier_id: it.supplier_id ?? '',
        bobot_kg: it.bobot_kg != null ? String(it.bobot_kg) : '',
        qty: String(it.qty),
        satuan: it.satuan,
        harga: String(it.harga),
        diskon_persen: String(it.diskon_persen),
      }))
    }
    return [emptyRow()]
  })

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, emptyRow()])
  }, [])

  const removeRow = useCallback((key: number) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev))
  }, [])

  const updateRow = useCallback((key: number, patch: Partial<ItemRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }, [])

  // Auto-fill satuan when product selected
  const handleProductChange = useCallback(
    (key: number, product_id: string) => {
      const prod = products.find((p) => p.id === product_id)
      setRows((prev) =>
        prev.map((r) => {
          if (r.key !== key) return r
          return {
            ...r,
            product_id,
            satuan: prod?.satuan ?? r.satuan,
            harga: prod?.harga_modal_default ? String(prod.harga_modal_default) : r.harga,
          }
        })
      )
    },
    [products]
  )

  const totalNet = rows.reduce((sum, row) => sum + rowToCalc(row).jumlah, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await saveAction(
        { id: initial?.id, tanggal, catatan },
        rows.map((row) => ({
          product_id: row.product_id || null,
          supplier_id: row.supplier_id || null,
          bobot_kg: row.bobot_kg !== '' ? Number(row.bobot_kg) : null,
          qty: Number(row.qty) || 0,
          satuan: row.satuan,
          harga: Number(row.harga) || 0,
          diskon_persen: Number(row.diskon_persen) || 0,
        }))
      )
      if (result.ok) {
        router.push('/pembelian')
        router.refresh()
      } else {
        setError('Gagal menyimpan.')
        setSubmitting(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan.')
      setSubmitting(false)
    }
  }

  const inputCls =
    'border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40 w-full'
  const selectCls =
    'border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40 w-full bg-white'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Tanggal</label>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            required
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Catatan</label>
          <input
            type="text"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Opsional"
            className={inputCls}
          />
        </div>
      </div>

      {/* Item rows */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-[#0f4c3a] text-white">
                <th className="px-3 py-2 text-left font-semibold">#</th>
                <th className="px-3 py-2 text-left font-semibold">Produk</th>
                <th className="px-3 py-2 text-left font-semibold">Pemasok</th>
                <th className="px-3 py-2 text-left font-semibold">Bobot (kg)</th>
                <th className="px-3 py-2 text-left font-semibold">Qty</th>
                <th className="px-3 py-2 text-left font-semibold">Satuan</th>
                <th className="px-3 py-2 text-right font-semibold">Harga (Rp)</th>
                <th className="px-3 py-2 text-right font-semibold">Diskon (%)</th>
                <th className="px-3 py-2 text-right font-semibold">Jumlah</th>
                <th className="px-3 py-2 text-center font-semibold w-16">Hapus</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const { jumlah } = rowToCalc(row)
                return (
                  <tr key={row.key} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-3 py-2 min-w-[160px]">
                      <select
                        value={row.product_id}
                        onChange={(e) => handleProductChange(row.key, e.target.value)}
                        className={selectCls}
                      >
                        <option value="">— Pilih —</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nama}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 min-w-[140px]">
                      <select
                        value={row.supplier_id}
                        onChange={(e) => updateRow(row.key, { supplier_id: e.target.value })}
                        className={selectCls}
                      >
                        <option value="">— Pilih —</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nama}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 w-24">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.bobot_kg}
                        onChange={(e) => updateRow(row.key, { bobot_kg: e.target.value })}
                        placeholder="—"
                        className={inputCls}
                      />
                    </td>
                    <td className="px-3 py-2 w-20">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={row.qty}
                        onChange={(e) => updateRow(row.key, { qty: e.target.value })}
                        required
                        className={inputCls}
                      />
                    </td>
                    <td className="px-3 py-2 w-24">
                      <input
                        type="text"
                        value={row.satuan}
                        onChange={(e) => updateRow(row.key, { satuan: e.target.value })}
                        placeholder="pcs / kg"
                        className={inputCls}
                      />
                    </td>
                    <td className="px-3 py-2 w-32">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={row.harga}
                        onChange={(e) => updateRow(row.key, { harga: e.target.value })}
                        required
                        className={inputCls + ' text-right'}
                      />
                    </td>
                    <td className="px-3 py-2 w-24">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={row.diskon_persen}
                        onChange={(e) => updateRow(row.key, { diskon_persen: e.target.value })}
                        className={inputCls + ' text-right'}
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-gray-800 w-36 whitespace-nowrap">
                      {rupiah(jumlah)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(row.key)}
                        disabled={rows.length === 1}
                        className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded border border-red-200 hover:border-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={8} className="px-3 py-3 text-right text-sm font-semibold text-gray-700">
                  Total Net:
                </td>
                <td className="px-3 py-3 text-right text-sm font-bold text-[#0f4c3a] whitespace-nowrap">
                  {rupiah(totalNet)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="px-3 py-3 border-t border-gray-100">
          <button
            type="button"
            onClick={addRow}
            className="text-[#0f4c3a] hover:text-white hover:bg-[#0f4c3a] border border-[#0f4c3a] text-sm font-medium px-4 py-2 rounded transition-colors"
          >
            + Tambah Baris
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="bg-[#0f4c3a] hover:bg-[#0d3f31] text-white text-sm font-medium px-6 py-2.5 rounded transition-colors disabled:opacity-60"
        >
          {submitting ? 'Menyimpan...' : 'Simpan Faktur'}
        </button>
        <a
          href="/pembelian"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Batal
        </a>
      </div>
    </form>
  )
}
