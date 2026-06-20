import Link from 'next/link'
import { listSales } from '@/lib/db/sales'
import { rupiah, tanggalID } from '@/lib/format'
import { deleteSaleAction } from './actions'

export default async function PenjualanPage() {
  const sales = await listSales()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Daftar Invoice Penjualan</h2>
        <Link
          href="/penjualan/baru"
          className="bg-[#0f4c3a] hover:bg-[#0d3f31] text-white text-sm font-medium px-4 py-2 rounded transition-colors"
        >
          + Tambah Invoice
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0f4c3a] text-white">
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
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    Belum ada invoice penjualan.
                  </td>
                </tr>
              )}
              {sales.map((s, i) => (
                <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2 font-medium text-gray-800">
                    <Link href={`/penjualan/${s.id}`} className="hover:text-[#0f4c3a] hover:underline">
                      {s.no_invoice ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{s.customer_nama ?? '—'}</td>
                  <td className="px-4 py-2 text-gray-600">{tanggalID(s.tanggal_antar)}</td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-800">
                    {rupiah(s.total_jual)}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-emerald-700">
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
                        <button
                          type="submit"
                          className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded transition-colors"
                        >
                          Hapus
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sales.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {sales.length} invoice
          </div>
        )}
      </div>
    </div>
  )
}
