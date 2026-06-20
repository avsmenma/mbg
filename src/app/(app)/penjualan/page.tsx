import Link from 'next/link'
import { listSales } from '@/lib/db/sales'
import { rupiah, tanggalID } from '@/lib/format'
import { deleteSaleAction } from './actions'
import { DeleteButton } from '@/components/DeleteButton'

export default async function PenjualanPage() {
  const sales = await listSales()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#1a1a1a]">Daftar Invoice Penjualan</h2>
        <div className="flex items-center gap-2">
          <a
            href="/penjualan/export"
            className="bg-white border border-[#e2e0da] hover:bg-[#f7f6f3] text-[#1a1a1a] text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm inline-flex items-center gap-1.5"
          >
            ⬇ Export Excel
          </a>
          <Link
            href="/penjualan/baru"
            className="btn-primary"
          >
            + Tambah Invoice
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="table-header-row">
                <th className="px-4 py-3 text-left font-semibold w-8">#</th>
                <th className="px-4 py-3 text-left font-semibold">No. Invoice</th>
                <th className="px-4 py-3 text-left font-semibold">Pelanggan</th>
                <th className="px-4 py-3 text-left font-semibold">Tanggal Antar</th>
                <th className="px-4 py-3 text-right font-semibold">Total Jual</th>
                <th className="px-4 py-3 text-right font-semibold">Profit</th>
                <th className="px-4 py-3 text-center font-semibold w-28">Status</th>
                <th className="px-4 py-3 text-center font-semibold w-36">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-16 gap-2">
                      <span className="text-4xl">📋</span>
                      <p className="text-[#5a5a5a] font-medium">Belum ada invoice penjualan</p>
                      <p className="text-sm text-[#9a9a9a]">Klik &quot;+ Tambah Invoice&quot; untuk mulai mencatat transaksi.</p>
                    </div>
                  </td>
                </tr>
              )}
              {sales.map((s, i) => (
                <tr
                  key={s.id}
                  className={`border-t border-[#e2e0da] hover:bg-[#e6f0ec]/30 transition-colors ${
                    i % 2 === 1 ? 'bg-[#f7f6f3]' : 'bg-white'
                  }`}
                >
                  <td className="px-4 py-2 text-[#9a9a9a]">{i + 1}</td>
                  <td className="px-4 py-2 font-medium text-[#1a1a1a]">
                    <Link href={`/penjualan/${s.id}`} className="hover:text-[#0f4c3a] hover:underline">
                      {s.no_invoice ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-[#5a5a5a]">{s.customer_nama ?? '—'}</td>
                  <td className="px-4 py-2 text-[#5a5a5a]">{tanggalID(s.tanggal_antar)}</td>
                  <td className="px-4 py-2 text-right font-semibold text-[#1a1a1a] tabular-nums">
                    {rupiah(s.total_jual)}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-emerald-700 tabular-nums">
                    {rupiah(s.total_fee)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {s.status_bayar === 'cair' ? (
                      <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Cair
                      </span>
                    ) : (
                      <span className="inline-block bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Belum
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/penjualan/${s.id}`}
                        className="bg-[#0f4c3a] hover:bg-[#0d3f31] text-white text-xs px-3 py-1 rounded transition-colors"
                      >
                        Edit
                      </Link>
                      <form action={deleteSaleAction.bind(null, s.id)}>
                        <DeleteButton className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded transition-colors" />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sales.length > 0 && (
          <div className="px-4 py-2 border-t border-[#e2e0da] text-xs text-[#9a9a9a]">
            {sales.length} invoice
          </div>
        )}
      </div>
    </div>
  )
}
