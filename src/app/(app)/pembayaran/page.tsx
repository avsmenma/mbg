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
        <h2 className="text-xl font-semibold text-gray-800">Status Pembayaran</h2>
      </div>

      {/* KPI Strip */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-6 py-4 flex items-center gap-4">
        <div>
          <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">Total Piutang</p>
          <p className="text-2xl font-bold text-amber-700">{rupiah(totalPiutang)}</p>
          <p className="text-xs text-amber-500 mt-0.5">
            {invoices.filter((inv) => inv.status_bayar === 'belum').length} invoice belum cair
          </p>
        </div>
      </div>

      {/* Table */}
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
                <th className="px-4 py-3 text-center font-semibold w-28">Status</th>
                <th className="px-4 py-3 text-center font-semibold w-40">Ubah Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Belum ada invoice.
                  </td>
                </tr>
              )}
              {invoices.map((inv, i) => (
                <tr key={inv.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2 font-medium text-gray-800">{inv.no_invoice ?? '—'}</td>
                  <td className="px-4 py-2 text-gray-600">{inv.customer_nama ?? '—'}</td>
                  <td className="px-4 py-2 text-gray-600">{tanggalID(inv.tanggal_antar)}</td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-800">
                    {rupiah(inv.total_jual)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {inv.status_bayar === 'cair' ? (
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
                      {inv.status_bayar !== 'cair' && (
                        <form action={setPaymentStatus.bind(null, inv.id, 'cair')}>
                          <button
                            type="submit"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1 rounded transition-colors"
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
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {invoices.length} invoice
          </div>
        )}
      </div>
    </div>
  )
}
