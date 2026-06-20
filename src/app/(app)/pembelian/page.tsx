import Link from 'next/link'
import { listPurchases } from '@/lib/db/purchases'
import { rupiah } from '@/lib/format'
import { tanggalID } from '@/lib/format'
import { deletePurchaseAction } from './actions'

export default async function PembelianPage() {
  const purchases = await listPurchases()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Daftar Faktur Belanja</h2>
        <Link
          href="/pembelian/baru"
          className="bg-[#0f4c3a] hover:bg-[#0d3f31] text-white text-sm font-medium px-4 py-2 rounded transition-colors"
        >
          + Tambah Faktur
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0f4c3a] text-white">
                <th className="px-4 py-3 text-left font-semibold w-8">#</th>
                <th className="px-4 py-3 text-left font-semibold">Tanggal</th>
                <th className="px-4 py-3 text-left font-semibold">Catatan</th>
                <th className="px-4 py-3 text-center font-semibold w-24">Jml Item</th>
                <th className="px-4 py-3 text-right font-semibold">Total Net</th>
                <th className="px-4 py-3 text-center font-semibold w-36">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Belum ada faktur belanja.
                  </td>
                </tr>
              )}
              {purchases.map((p, i) => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2 font-medium text-gray-800">{tanggalID(p.tanggal)}</td>
                  <td className="px-4 py-2 text-gray-500">{p.catatan ?? '—'}</td>
                  <td className="px-4 py-2 text-center text-gray-700">{p.item_count}</td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-800">
                    {rupiah(p.total_net)}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/pembelian/${p.id}`}
                        className="bg-[#0f4c3a] hover:bg-[#0d3f31] text-white text-xs px-3 py-1 rounded transition-colors"
                      >
                        Edit
                      </Link>
                      <form action={deletePurchaseAction.bind(null, p.id)}>
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
        {purchases.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {purchases.length} faktur
          </div>
        )}
      </div>
    </div>
  )
}
