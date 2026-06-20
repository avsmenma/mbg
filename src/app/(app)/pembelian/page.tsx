import Link from 'next/link'
import { listPurchases } from '@/lib/db/purchases'
import { rupiah } from '@/lib/format'
import { tanggalID } from '@/lib/format'
import { deletePurchaseAction } from './actions'
import { DeleteButton } from '@/components/DeleteButton'

export default async function PembelianPage() {
  const purchases = await listPurchases()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-semibold"
          style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', color: 'var(--ink)' }}
        >
          Daftar Faktur Belanja
        </h2>
        <Link
          href="/pembelian/baru"
          className="btn-primary"
        >
          + Tambah Faktur
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="table-header-row">
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
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-16 gap-2">
                      <span className="text-2xl" style={{ color: 'var(--moss)' }}>—</span>
                      <p className="font-medium" style={{ color: 'var(--moss)' }}>Belum ada faktur belanja</p>
                      <p className="text-sm" style={{ color: 'var(--moss)' }}>Klik &quot;+ Tambah Faktur&quot; untuk mencatat pembelian baru.</p>
                    </div>
                  </td>
                </tr>
              )}
              {purchases.map((p, i) => (
                <tr
                  key={p.id}
                  className="border-t hover:bg-[#EEF5F0] transition-colors"
                  style={{
                    borderColor: 'var(--line)',
                    backgroundColor: i % 2 === 1 ? 'var(--canvas)' : 'var(--paper-elev)',
                  }}
                >
                  <td className="px-4 py-2 text-[#9a9a9a]">{i + 1}</td>
                  <td className="px-4 py-2 font-medium" style={{ color: 'var(--ink)' }}>{tanggalID(p.tanggal)}</td>
                  <td className="px-4 py-2 text-[#5a5a5a]">{p.catatan ?? '—'}</td>
                  <td className="px-4 py-2 text-center text-[#5a5a5a]">{p.item_count}</td>
                  <td className="px-4 py-2 text-right money">
                    {rupiah(p.total_net)}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/pembelian/${p.id}`}
                        className="text-white text-xs px-3 py-1 rounded transition-colors"
                        style={{ backgroundColor: 'var(--pine)' }}
                      >
                        Edit
                      </Link>
                      <form action={deletePurchaseAction.bind(null, p.id)}>
                        <DeleteButton
                          className="text-white text-xs px-3 py-1 rounded transition-colors"
                          style={{ backgroundColor: 'var(--clay)' }}
                        />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {purchases.length > 0 && (
          <div className="px-4 py-2 border-t text-xs" style={{ borderColor: 'var(--line)', color: 'var(--moss)' }}>
            {purchases.length} faktur
          </div>
        )}
      </div>
    </div>
  )
}
