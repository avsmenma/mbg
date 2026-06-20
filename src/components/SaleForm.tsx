'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { lineSale, totalSale } from '@/lib/calc'
import { rupiah } from '@/lib/format'
import type { Product } from '@/lib/db/products'
import type { Customer } from '@/lib/db/master'
import type { SaleDetail } from '@/lib/db/sales'

// ── Types ──────────────────────────────────────────────────────────────────

interface ItemRow {
  key: number
  product_id: string
  qty: string
  satuan: string
  harga_jual: string
  harga_modal: string
}

interface Props {
  products: Product[]
  customers: Customer[]
  initial?: SaleDetail | null
  saveAction: (
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
    qty: '1',
    satuan: '',
    harga_jual: '0',
    harga_modal: '0',
  }
}

function rowToCalc(row: ItemRow) {
  return lineSale({
    qty: Number(row.qty) || 0,
    hargaJual: Number(row.harga_jual) || 0,
    hargaModal: Number(row.harga_modal) || 0,
  })
}

// ── Component ──────────────────────────────────────────────────────────────

export default function SaleForm({ products, customers, initial, saveAction }: Props) {
  const router = useRouter()

  const [noPo, setNoPo] = useState<string>(initial?.no_po ?? '')
  const [noInvoice, setNoInvoice] = useState<string>(initial?.no_invoice ?? '')
  const [customerId, setCustomerId] = useState<string>(initial?.customer_id ?? '')
  const [tanggalAntar, setTanggalAntar] = useState<string>(
    initial?.tanggal_antar ?? new Date().toISOString().slice(0, 10)
  )
  const [statusBayar, setStatusBayar] = useState<'cair' | 'belum'>(
    initial?.status_bayar ?? 'belum'
  )
  const [terbilang, setTerbilang] = useState<string>(initial?.terbilang ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [rows, setRows] = useState<ItemRow[]>(() => {
    if (initial && initial.items.length > 0) {
      return initial.items.map((it) => ({
        key: nextKey(),
        product_id: it.product_id ?? '',
        qty: String(it.qty),
        satuan: it.satuan,
        harga_jual: String(it.harga_jual),
        harga_modal: String(it.harga_modal),
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

  // Auto-fill satuan + harga from product master (editable per row)
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
            harga_jual: prod?.harga_jual_default ? String(prod.harga_jual_default) : r.harga_jual,
            harga_modal: prod?.harga_modal_default
              ? String(prod.harga_modal_default)
              : r.harga_modal,
          }
        })
      )
    },
    [products]
  )

  // Live totals via totalSale (sole source)
  const { totalJual, totalModal, totalFee } = totalSale(
    rows.map((r) => ({
      qty: Number(r.qty) || 0,
      hargaJual: Number(r.harga_jual) || 0,
      hargaModal: Number(r.harga_modal) || 0,
    }))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await saveAction(
        {
          id: initial?.id,
          no_po: noPo,
          no_invoice: noInvoice,
          customer_id: customerId,
          tanggal_antar: tanggalAntar,
          status_bayar: statusBayar,
          terbilang,
        },
        rows.map((row) => ({
          product_id: row.product_id || null,
          qty: Number(row.qty) || 0,
          satuan: row.satuan,
          harga_jual: Number(row.harga_jual) || 0,
          harga_modal: Number(row.harga_modal) || 0,
        }))
      )
      if (result.ok) {
        router.push('/penjualan')
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
      {/* Header fields */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">No. PO</label>
          <input
            type="text"
            value={noPo}
            onChange={(e) => setNoPo(e.target.value)}
            placeholder="Opsional"
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">No. Invoice</label>
          <input
            type="text"
            value={noInvoice}
            onChange={(e) => setNoInvoice(e.target.value)}
            placeholder="Opsional"
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Pelanggan</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className={selectCls}
          >
            <option value="">— Pilih Pelanggan —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nama}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Tanggal Antar</label>
          <input
            type="date"
            value={tanggalAntar}
            onChange={(e) => setTanggalAntar(e.target.value)}
            required
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Status Bayar</label>
          <select
            value={statusBayar}
            onChange={(e) => setStatusBayar(e.target.value as 'cair' | 'belum')}
            className={selectCls}
          >
            <option value="belum">Belum</option>
            <option value="cair">Cair</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Terbilang</label>
          <input
            type="text"
            value={terbilang}
            onChange={(e) => setTerbilang(e.target.value)}
            placeholder="Opsional"
            className={inputCls}
          />
        </div>
      </div>

      {/* Item rows */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="bg-[#0f4c3a] text-white">
                <th className="px-3 py-2 text-left font-semibold">#</th>
                <th className="px-3 py-2 text-left font-semibold">Produk</th>
                <th className="px-3 py-2 text-left font-semibold">Qty</th>
                <th className="px-3 py-2 text-left font-semibold">Satuan</th>
                <th className="px-3 py-2 text-right font-semibold">Harga Jual (Rp)</th>
                <th className="px-3 py-2 text-right font-semibold">Harga Modal (Rp)</th>
                <th className="px-3 py-2 text-right font-semibold">Jumlah Jual</th>
                <th className="px-3 py-2 text-right font-semibold">Fee / Profit</th>
                <th className="px-3 py-2 text-center font-semibold w-16">Hapus</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const { jumlahJual, fee } = rowToCalc(row)
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
                    <td className="px-3 py-2 w-36">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={row.harga_jual}
                        onChange={(e) => updateRow(row.key, { harga_jual: e.target.value })}
                        required
                        className={inputCls + ' text-right'}
                      />
                    </td>
                    <td className="px-3 py-2 w-36">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={row.harga_modal}
                        onChange={(e) => updateRow(row.key, { harga_modal: e.target.value })}
                        className={inputCls + ' text-right'}
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-gray-800 w-36 whitespace-nowrap">
                      {rupiah(jumlahJual)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-emerald-700 w-32 whitespace-nowrap">
                      {rupiah(fee)}
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
                <td colSpan={6} className="px-3 py-3 text-right text-sm font-semibold text-gray-700">
                  Total Jual:
                </td>
                <td className="px-3 py-3 text-right text-sm font-bold text-[#0f4c3a] whitespace-nowrap">
                  {rupiah(totalJual)}
                </td>
                <td colSpan={2} />
              </tr>
              <tr className="bg-gray-50">
                <td colSpan={6} className="px-3 pb-2 text-right text-sm font-semibold text-gray-700">
                  Total Modal:
                </td>
                <td className="px-3 pb-2 text-right text-sm font-medium text-gray-600 whitespace-nowrap">
                  {rupiah(totalModal)}
                </td>
                <td colSpan={2} />
              </tr>
              <tr className="bg-gray-50 border-t border-gray-100">
                <td colSpan={6} className="px-3 py-2 text-right text-sm font-bold text-gray-800">
                  Total Profit:
                </td>
                <td className="px-3 py-2 text-right text-sm font-bold text-emerald-700 whitespace-nowrap">
                  {rupiah(totalFee)}
                </td>
                <td colSpan={2} />
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
          {submitting ? 'Menyimpan...' : 'Simpan Invoice'}
        </button>
        <a href="/penjualan" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
          Batal
        </a>
      </div>
    </form>
  )
}
