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
        <h2
          className="text-xl font-semibold"
          style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', color: 'var(--ink)' }}
        >
          Daftar Invoice Penjualan
        </h2>
        <div className="flex items-center gap-2">
          <a
            href="/penjualan/export"
            className="btn-secondary"
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
                      <span className="text-2xl" style={{ color: 'var(--moss)' }}>—</span>
                      <p className="font-medium" style={{ color: 'var(--moss)' }}>Belum ada invoice penjualan</p>
                      <p className="text-sm" style={{ color: 'var(--moss)' }}>Klik &quot;+ Tambah Invoice&quot; untuk mulai mencatat transaksi.</p>
                    </div>
                  </td>
                </tr>
              )}
              {sales.map((s, i) => (
                <tr
                  key={s.id}
                  className="border-t hover:bg-[#EEF5F0] transition-colors"
                  style={{
                    borderColor: 'var(--line)',
                    backgroundColor: i % 2 === 1 ? 'var(--canvas)' : 'var(--paper-elev)',
                  }}
                >
                  <td className="px-4 py-2 text-[#9a9a9a]">{i + 1}</td>
                  <td className="px-4 py-2 font-medium" style={{ color: 'var(--ink)' }}>
                    <Link href={`/penjualan/${s.id}`} className="hover:underline" style={{ color: 'var(--pine)' }}>
                      {s.no_invoice ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-[#5a5a5a]">{s.customer_nama ?? '—'}</td>
                  <td className="px-4 py-2 text-[#5a5a5a]">{tanggalID(s.tanggal_antar)}</td>
                  <td className="px-4 py-2 text-right money">
                    {rupiah(s.total_jual)}
                  </td>
                  <td className="px-4 py-2 text-right money text-emerald-700">
                    {rupiah(s.total_fee)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {s.status_bayar === 'cair' ? (
                      <span className="badge-cair">Cair</span>
                    ) : (
                      <span className="badge-belum">Belum</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/penjualan/${s.id}`}
                        className="text-white text-xs px-3 py-1 rounded transition-colors"
                        style={{ backgroundColor: 'var(--pine)' }}
                      >
                        Edit
                      </Link>
                      <form action={deleteSaleAction.bind(null, s.id)}>
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
        {sales.length > 0 && (
          <div className="px-4 py-2 border-t text-xs" style={{ borderColor: 'var(--line)', color: 'var(--moss)' }}>
            {sales.length} invoice
          </div>
        )}
      </div>
    </div>
  )
}
