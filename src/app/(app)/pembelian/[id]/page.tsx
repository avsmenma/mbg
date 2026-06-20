import { notFound } from 'next/navigation'
import { listProducts } from '@/lib/db/products'
import { listSuppliers } from '@/lib/db/master'
import { getPurchase } from '@/lib/db/purchases'
import PurchaseForm from '@/components/PurchaseForm'
import { savePurchaseAction } from '../actions'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PembelianEditPage({ params }: Props) {
  const { id } = await params
  const [purchase, products, suppliers] = await Promise.all([
    getPurchase(id),
    listProducts(),
    listSuppliers(),
  ])

  if (!purchase) notFound()

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Edit Faktur Belanja</h2>
      <PurchaseForm
        products={products}
        suppliers={suppliers}
        initial={purchase}
        saveAction={savePurchaseAction}
      />
    </div>
  )
}
