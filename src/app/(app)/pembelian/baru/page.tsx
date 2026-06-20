import { listProducts } from '@/lib/db/products'
import { listSuppliers } from '@/lib/db/master'
import PurchaseForm from '@/components/PurchaseForm'
import { savePurchaseAction } from '../actions'

export default async function PembelianBaruPage() {
  const [products, suppliers] = await Promise.all([listProducts(), listSuppliers()])

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Faktur Belanja Baru</h2>
      <PurchaseForm
        products={products}
        suppliers={suppliers}
        initial={null}
        saveAction={savePurchaseAction}
      />
    </div>
  )
}
