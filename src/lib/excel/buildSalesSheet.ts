import * as XLSX from 'xlsx'
import { tanggalID } from '@/lib/format'
import type { SaleListRow } from '@/lib/db/sales'

export function buildSalesSheet(sales: SaleListRow[]): { wb: XLSX.WorkBook; buf: Buffer } {
  const rows = sales.map((s, i) => ({
    'No': i + 1,
    'No. Invoice': s.no_invoice ?? '',
    'Pelanggan': s.customer_nama ?? '',
    'Tanggal Antar': tanggalID(s.tanggal_antar),
    'Total Jual': s.total_jual,
    'Profit': s.total_fee,
    'Status': s.status_bayar === 'cair' ? 'Cair' : 'Belum Cair',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Penjualan')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  return { wb, buf }
}
