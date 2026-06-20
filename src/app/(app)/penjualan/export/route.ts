import { NextResponse } from 'next/server'
import { listSales } from '@/lib/db/sales'
import { buildSalesSheet } from '@/lib/excel/buildSalesSheet'

export const runtime = 'nodejs'

export async function GET() {
  const sales = await listSales()
  const { buf } = buildSalesSheet(sales)

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="penjualan.xlsx"',
    },
  })
}
