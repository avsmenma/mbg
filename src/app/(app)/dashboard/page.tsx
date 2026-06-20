import Link from 'next/link'
import { getDashboard } from '@/lib/db/dashboard'
import { Money } from '@/components/Money'
import { ProfitChart } from '@/components/ProfitChart'
import { rupiah } from '@/lib/format'

// ── KPI Card ───────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  negative,
}: {
  label: string
  value: number
  negative?: boolean
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-5 py-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p
        className={`text-xl font-bold ${
          negative ? 'text-red-600' : 'text-[#0f4c3a]'
        }`}
      >
        <Money value={value} />
      </p>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const data = await getDashboard()

  const {
    totalJual,
    totalModal,
    totalProfit,
    piutang,
    perluCekCount,
    perTanggal,
    recentSales,
  } = data

  return (
    <div className="space-y-6">
      {/* Heading */}
      <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>

      {/* Perlu-cek notice */}
      {perluCekCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-lg px-4 py-3">
          <span className="text-amber-600 font-bold text-lg">⚠️</span>
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{perluCekCount} baris perlu dicek</span>
            {' — baris yang diimpor dari Excel dengan angka tidak konsisten.'}
          </p>
          <Link
            href="/penjualan"
            className="ml-auto text-sm font-medium text-amber-700 underline underline-offset-2 hover:text-amber-900 shrink-0"
          >
            Lihat Penjualan →
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Total Jual" value={totalJual} />
        <KpiCard label="Total Modal" value={totalModal} />
        <KpiCard
          label="Total Profit"
          value={totalProfit}
          negative={totalProfit < 0}
        />
        <KpiCard label="Piutang (Belum Cair)" value={piutang} />
      </div>

      {/* Profit chart */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Profit per Tanggal Antar</h3>
        <ProfitChart data={perTanggal} />
      </div>

      {/* Transaksi Terbaru */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Transaksi Terbaru</h3>
        </div>
        {recentSales.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-400">Belum ada transaksi.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-5 py-3 text-left font-medium">No. Invoice</th>
                <th className="px-5 py-3 text-left font-medium">Tanggal</th>
                <th className="px-5 py-3 text-right font-medium">Total Jual</th>
                <th className="px-5 py-3 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-gray-800 font-medium">
                    <Link
                      href={`/penjualan/${sale.id}`}
                      className="hover:underline text-[#0f4c3a]"
                    >
                      {sale.no_invoice ?? '—'}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{sale.tanggal_antar}</td>
                  <td className="px-5 py-3 text-right text-gray-800">
                    {rupiah(sale.total_jual)}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        sale.status_bayar === 'cair'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {sale.status_bayar === 'cair' ? 'Cair' : 'Belum Cair'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
