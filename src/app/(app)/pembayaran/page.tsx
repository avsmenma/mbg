import { createClient } from '@/lib/supabase/server'
import { rupiah, tanggalID } from '@/lib/format'
import { setPaymentStatus } from './actions'

interface SaleRow {
  id: string
  no_invoice: string | null
  customer_nama: string | null
  tanggal_antar: string
  total_jual: number
  status_bayar: 'cair' | 'belum'
}

async function listInvoices(): Promise<SaleRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sales')
    .select('id, no_invoice, tanggal_antar, total_jual, status_bayar, customers(nama)')
    .order('tanggal_antar', { ascending: false })
  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    const cust = r['customers'] as { nama: string } | null
    return {
      id: r['id'] as string,
      no_invoice: (r['no_invoice'] as string | null) ?? null,
      customer_nama: cust?.nama ?? null,
      tanggal_antar: r['tanggal_antar'] as string,
      total_jual: Number(r['total_jual'] ?? 0),
      status_bayar: (r['status_bayar'] as 'cair' | 'belum') ?? 'belum',
    }
  })
}

export default async function PembayaranPage() {
  const invoices = await listInvoices()

  const totalPiutang = invoices
    .filter((inv) => inv.status_bayar === 'belum')
    .reduce((sum, inv) => sum + inv.total_jual, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-semibold"
          style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', color: 'var(--ink)' }}
        >
          Status Pembayaran
        </h2>
      </div>

      {/* KPI Strip */}
      <div className="card px-6 py-4">
        <p className="card-title mb-1">Total Piutang</p>
        <p className="money text-2xl font-bold" style={{ color: 'var(--amber)' }}>{rupiah(totalPiutang)}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--moss)' }}>
          {invoices.filter((inv) => inv.status_bayar === 'belum').length} invoice belum cair
        </p>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header-row">
                <th className="px-4 py-3 text-left font-semibold w-8">#</th>
                <th className="px-4 py-3 text-left font-semibold">No. Invoice</th>
                <th className="px-4 py-3 text-left font-semibold">Pelanggan</th>
                <th className="px-4 py-3 text-left font-semibold">Tanggal Antar</th>
                <th className="px-4 py-3 text-right font-semibold">Total Jual</th>
                <th className="px-4 py-3 text-center font-semibold w-28">Status</th>
                <th className="px-4 py-3 text-center font-semibold w-40">Ubah Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center" style={{ color: 'var(--moss)' }}>
                    Belum ada invoice.
                  </td>
                </tr>
              )}
              {invoices.map((inv, i) => (
                <tr
                  key={inv.id}
                  className="border-t hover:bg-[#EEF5F0] transition-colors"
                  style={{
                    borderColor: 'var(--line)',
                    backgroundColor: i % 2 === 1 ? 'var(--canvas)' : 'var(--paper-elev)',
                  }}
                >
                  <td className="px-4 py-2 text-[#9a9a9a]">{i + 1}</td>
                  <td className="px-4 py-2 font-medium" style={{ color: 'var(--ink)' }}>{inv.no_invoice ?? '—'}</td>
                  <td className="px-4 py-2 text-[#5a5a5a]">{inv.customer_nama ?? '—'}</td>
                  <td className="px-4 py-2 text-[#5a5a5a]">{tanggalID(inv.tanggal_antar)}</td>
                  <td className="px-4 py-2 text-right money">
                    {rupiah(inv.total_jual)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {inv.status_bayar === 'cair' ? (
                      <span className="badge-cair">Cair</span>
                    ) : (
                      <span className="badge-belum">Belum</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      {inv.status_bayar !== 'cair' && (
                        <form action={setPaymentStatus.bind(null, inv.id, 'cair')}>
                          <button
                            type="submit"
                            className="text-white text-xs px-3 py-1 rounded transition-colors"
                            style={{ backgroundColor: 'var(--pine-700)' }}
                          >
                            Cair
                          </button>
                        </form>
                      )}
                      {inv.status_bayar !== 'belum' && (
                        <form action={setPaymentStatus.bind(null, inv.id, 'belum')}>
                          <button
                            type="submit"
                            className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-1 rounded transition-colors"
                          >
                            Belum
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {invoices.length > 0 && (
          <div className="px-4 py-2 border-t text-xs" style={{ borderColor: 'var(--line)', color: 'var(--moss)' }}>
            {invoices.length} invoice
          </div>
        )}
      </div>
    </div>
  )
}
