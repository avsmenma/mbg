import { listProducts } from '@/lib/db/products'
import { listCustomers } from '@/lib/db/master'
import SaleForm from '@/components/SaleForm'
import { saveSaleAction } from '../actions'

export default async function PenjualanBaruPage() {
  const [products, customers] = await Promise.all([listProducts(), listCustomers()])

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Invoice Penjualan Baru</h2>
      <SaleForm
        products={products}
        customers={customers}
        initial={null}
        saveAction={saveSaleAction}
      />
    </div>
  )
}
