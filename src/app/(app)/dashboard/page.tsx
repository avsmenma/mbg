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
  dot,
}: {
  label: string
  value: number
  negative?: boolean
  dot?: string
}) {
  return (
    <div className="card px-5 py-5 border-l-4" style={{ borderLeftColor: dot ?? 'var(--brand)' }}>
      <p className="text-xs font-medium text-[#5a5a5a] uppercase tracking-wide mb-2">{label}</p>
      <p
        className={`text-2xl font-bold tabular-nums ${
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
      <h2 className="text-xl font-semibold text-[#1a1a1a]">Dashboard</h2>

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
        <KpiCard label="Total Jual" value={totalJual} dot="#2d8c6f" />
        <KpiCard label="Total Modal" value={totalModal} dot="#5a5a5a" />
        <KpiCard
          label="Total Profit"
          value={totalProfit}
          negative={totalProfit < 0}
          dot={totalProfit < 0 ? '#dc2626' : '#0f4c3a'}
        />
        <KpiCard label="Piutang (Belum Cair)" value={piutang} dot="#d97706" />
      </div>

      {/* Profit chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[#5a5a5a] mb-4">Profit per Tanggal Antar</h3>
        <ProfitChart data={perTanggal} />
      </div>

      {/* Transaksi Terbaru */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e2e0da]">
          <h3 className="text-sm font-semibold text-[#5a5a5a]">Transaksi Terbaru</h3>
        </div>
        {recentSales.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-2xl mb-2">📋</p>
            <p className="text-sm text-[#9a9a9a]">Belum ada transaksi.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="table-header-row sticky top-0 z-10 text-xs uppercase">
              <tr>
                <th className="px-5 py-3 text-left font-semibold">No. Invoice</th>
                <th className="px-5 py-3 text-left font-semibold">Tanggal</th>
                <th className="px-5 py-3 text-right font-semibold">Total Jual</th>
                <th className="px-5 py-3 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e0da]">
              {recentSales.map((sale, idx) => (
                <tr
                  key={sale.id}
                  className={`hover:bg-[#e6f0ec]/40 transition-colors ${
                    idx % 2 === 1 ? 'bg-[#f7f6f3]' : 'bg-white'
                  }`}
                >
                  <td className="px-5 py-3 text-[#1a1a1a] font-medium">
                    <Link
                      href={`/penjualan/${sale.id}`}
                      className="hover:underline text-[#0f4c3a]"
                    >
                      {sale.no_invoice ?? '—'}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-[#5a5a5a]">{sale.tanggal_antar}</td>
                  <td className="px-5 py-3 text-right text-[#1a1a1a] tabular-nums">
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
