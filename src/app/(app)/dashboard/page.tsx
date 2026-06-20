import Link from 'next/link'
import { getDashboard } from '@/lib/db/dashboard'
import { Money } from '@/components/Money'
import { ProfitChart } from '@/components/ProfitChart'
import { rupiah } from '@/lib/format'

// ── Balance Ribbon ─────────────────────────────────────────────────────────

function BalanceRibbon({
  totalJual,
  totalModal,
  totalProfit,
  piutang,
}: {
  totalJual: number
  totalModal: number
  totalProfit: number
  piutang: number
}) {
  const profitPositive = totalProfit >= 0

  return (
    <div
      className="card grid grid-cols-2 lg:grid-cols-4"
      role="region"
      aria-label="Ringkasan keuangan"
    >
      {/* Total Jual */}
      <div className="px-5 py-5 flex flex-col gap-1.5 border-r border-b lg:border-b-0"
           style={{ borderColor: 'var(--line)' }}>
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--moss)', fontFamily: 'var(--font-display), system-ui, sans-serif' }}
        >
          Total Jual
        </p>
        <p
          className="text-xl font-semibold money"
          style={{ color: 'var(--ink)' }}
        >
          {rupiah(totalJual)}
        </p>
      </div>

      {/* Total Modal */}
      <div className="px-5 py-5 flex flex-col gap-1.5 border-b lg:border-b-0 lg:border-r"
           style={{ borderColor: 'var(--line)' }}>
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--moss)', fontFamily: 'var(--font-display), system-ui, sans-serif' }}
        >
          Total Modal
        </p>
        <p
          className="text-xl font-semibold money"
          style={{ color: 'var(--ink)' }}
        >
          {rupiah(totalModal)}
        </p>
      </div>

      {/* Total Profit — emphasized */}
      <div className="px-5 py-5 flex flex-col gap-1.5 border-r"
           style={{ borderColor: 'var(--line)' }}>
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--moss)', fontFamily: 'var(--font-display), system-ui, sans-serif' }}
        >
          Total Profit
        </p>
        <p
          className="text-2xl font-semibold money"
          style={{ color: profitPositive ? 'var(--pine-700)' : 'var(--clay)' }}
        >
          {rupiah(totalProfit)}
        </p>
      </div>

      {/* Piutang */}
      <div className="px-5 py-5 flex flex-col gap-1.5">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--moss)', fontFamily: 'var(--font-display), system-ui, sans-serif' }}
        >
          Piutang
        </p>
        <p
          className="text-xl font-semibold money"
          style={{ color: 'var(--amber)' }}
        >
          {rupiah(piutang)}
        </p>
        <p className="text-[10px]" style={{ color: 'var(--moss)' }}>belum cair</p>
      </div>
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
    <div className="space-y-5">
      {/* Heading */}
      <h2
        className="text-xl font-semibold"
        style={{ color: 'var(--ink)', fontFamily: 'var(--font-display), system-ui, sans-serif' }}
      >
        Dashboard
      </h2>

      {/* Perlu-cek ledger annotation */}
      {perluCekCount > 0 && (
        <div
          className="flex items-start gap-3 rounded-lg px-4 py-3"
          style={{
            backgroundColor: '#FEF9EE',
            border: '1px solid #F5D99A',
            borderLeftWidth: '3px',
            borderLeftColor: 'var(--amber)',
          }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm" style={{ color: 'var(--ink)' }}>
              <span className="font-semibold" style={{ color: '#7A5200' }}>
                {perluCekCount} baris perlu dicek
              </span>
              {' — data diimpor dengan angka tidak konsisten.'}
            </p>
          </div>
          <Link
            href="/penjualan"
            className="text-sm font-medium shrink-0 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C77D12] rounded"
            style={{ color: 'var(--amber)' }}
          >
            Lihat Penjualan →
          </Link>
        </div>
      )}

      {/* Balance Ribbon */}
      <BalanceRibbon
        totalJual={totalJual}
        totalModal={totalModal}
        totalProfit={totalProfit}
        piutang={piutang}
      />

      {/* Profit chart */}
      <div className="card p-5">
        <p className="card-title mb-4">Profit per Tanggal Antar</p>
        <ProfitChart data={perTanggal} />
      </div>

      {/* Transaksi Terbaru */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--line)' }}>
          <p className="card-title">Transaksi Terbaru</p>
        </div>
        {recentSales.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-3xl mb-2" aria-hidden="true">—</p>
            <p className="text-sm font-medium" style={{ color: 'var(--moss)' }}>Belum ada transaksi</p>
            <p className="text-xs mt-1" style={{ color: 'var(--moss)', opacity: 0.7 }}>
              Tambahkan invoice penjualan untuk mulai mencatat.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="table-header-row">
                  <th className="px-5 py-3 text-left">No. Invoice</th>
                  <th className="px-5 py-3 text-left">Tanggal</th>
                  <th className="px-5 py-3 text-right">Total Jual</th>
                  <th className="px-5 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale, idx) => (
                  <tr
                    key={sale.id}
                    className="transition-colors hover:bg-[#EEF5F0]"
                    style={{
                      borderTop: '1px solid var(--line)',
                      backgroundColor: idx % 2 === 1 ? 'var(--canvas)' : 'var(--paper-elev)',
                    }}
                  >
                    <td className="px-5 py-3 font-medium" style={{ color: 'var(--ink)' }}>
                      <Link
                        href={`/penjualan/${sale.id}`}
                        className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C77D12] rounded"
                        style={{ color: 'var(--pine-700)' }}
                      >
                        {sale.no_invoice ?? '—'}
                      </Link>
                    </td>
                    <td className="px-5 py-3" style={{ color: 'var(--moss)' }}>
                      {sale.tanggal_antar}
                    </td>
                    <td className="px-5 py-3 text-right money font-semibold" style={{ color: 'var(--ink)' }}>
                      {rupiah(sale.total_jual)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {sale.status_bayar === 'cair' ? (
                        <span className="badge-cair">Cair</span>
                      ) : (
                        <span className="badge-belum">Belum</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
