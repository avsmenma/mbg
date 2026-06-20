import { listStock } from '@/lib/db/stock'

export default async function StokPage() {
  const items = await listStock()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Laporan Stok</h2>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0f4c3a] text-white">
                <th className="px-4 py-3 text-left font-semibold w-8">#</th>
                <th className="px-4 py-3 text-left font-semibold">Produk</th>
                <th className="px-4 py-3 text-left font-semibold">Satuan</th>
                <th className="px-4 py-3 text-right font-semibold">Masuk</th>
                <th className="px-4 py-3 text-right font-semibold">Terpakai</th>
                <th className="px-4 py-3 text-right font-semibold">Sisa</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Belum ada data stok.
                  </td>
                </tr>
              )}
              {items.map((item, i) => (
                <tr key={item.product_id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2 font-medium text-gray-800">{item.nama}</td>
                  <td className="px-4 py-2 text-gray-600">{item.satuan}</td>
                  <td className="px-4 py-2 text-right text-gray-800">{item.qty_masuk.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-2 text-right text-gray-800">{item.qty_terpakai.toLocaleString('id-ID')}</td>
                  <td
                    className={`px-4 py-2 text-right font-semibold ${
                      item.qty_sisa < 0 ? 'text-red-600 bg-red-50' : 'text-gray-800'
                    }`}
                  >
                    {item.qty_sisa.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {items.length} produk
          </div>
        )}
      </div>
    </div>
  )
}
