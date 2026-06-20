export const runtime = 'nodejs'

import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { getSale } from '@/lib/db/sales'
import { InvoicePDF } from '@/components/InvoicePDF'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const sale = await getSale(id)

  if (!sale) {
    return new Response('Invoice tidak ditemukan', { status: 404 })
  }

  const buffer = await renderToBuffer(<InvoicePDF sale={sale} />)
  // Cast Buffer → Uint8Array so it satisfies the Web API BodyInit type
  const body = new Uint8Array(buffer)

  return new Response(body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${sale.no_invoice ?? id}.pdf"`,
    },
  })
}
