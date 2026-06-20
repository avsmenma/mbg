import { notFound } from 'next/navigation'
import Link from 'next/link'
import { listProducts } from '@/lib/db/products'
import { listCustomers } from '@/lib/db/master'
import { getSale } from '@/lib/db/sales'
import SaleForm from '@/components/SaleForm'
import { saveSaleAction } from '../actions'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PenjualanEditPage({ params }: Props) {
  const { id } = await params
  const [sale, products, customers] = await Promise.all([
    getSale(id),
    listProducts(),
    listCustomers(),
  ])

  if (!sale) notFound()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          Edit Invoice — {sale.no_invoice ?? 'Tanpa No. Invoice'}
        </h2>
        <Link
          href={`/penjualan/${id}/cetak`}
          className="border border-[#0f4c3a] text-[#0f4c3a] hover:bg-[#0f4c3a] hover:text-white text-sm font-medium px-4 py-2 rounded transition-colors"
        >
          Cetak PDF
        </Link>
      </div>
      <SaleForm
        products={products}
        customers={customers}
        initial={sale}
        saveAction={saveSaleAction}
      />
    </div>
  )
}
