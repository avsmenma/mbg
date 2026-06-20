import { listProducts } from '@/lib/db/products'
import { rupiah } from '@/lib/format'
import { actionCreateProduct, actionUpdateProduct, actionDeleteProduct } from './actions'

export default async function ProdukPage() {
  const products = await listProducts()

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Produk</h2>

      {/* Form Tambah Produk */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Tambah Produk</h3>
        <form action={actionCreateProduct} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Nama Produk</label>
            <input
              name="nama"
              required
              placeholder="Nama produk"
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Satuan</label>
            <input
              name="satuan"
              required
              placeholder="pcs / kg / ltr"
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Harga Modal (Rp)</label>
            <input
              name="harga_modal_default"
              type="number"
              min="0"
              step="1"
              defaultValue="0"
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Harga Jual (Rp)</label>
            <input
              name="harga_jual_default"
              type="number"
              min="0"
              step="1"
              defaultValue="0"
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-[#0f4c3a] hover:bg-[#0d3f31] text-white text-sm font-medium px-4 py-2 rounded transition-colors"
            >
              + Tambah
            </button>
          </div>
        </form>
      </div>

      {/* Tabel Produk */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0f4c3a] text-white">
                <th className="px-4 py-3 text-left font-semibold w-8">#</th>
                <th className="px-4 py-3 text-left font-semibold">Nama</th>
                <th className="px-4 py-3 text-left font-semibold">Satuan</th>
                <th className="px-4 py-3 text-right font-semibold">Harga Modal</th>
                <th className="px-4 py-3 text-right font-semibold">Harga Jual</th>
                <th className="px-4 py-3 text-center font-semibold w-40">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Belum ada data produk.
                  </td>
                </tr>
              )}
              {products.map((p, i) => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50 group">
                  {/* View row */}
                  <td className="px-4 py-2 text-gray-400 group-has-[.edit-form:target]:hidden">{i + 1}</td>
                  <td className="px-4 py-2 font-medium text-gray-800">{p.nama}</td>
                  <td className="px-4 py-2 text-gray-600">{p.satuan}</td>
                  <td className="px-4 py-2 text-right text-gray-700">{rupiah(p.harga_modal_default)}</td>
                  <td className="px-4 py-2 text-right text-gray-700">{rupiah(p.harga_jual_default)}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      {/* Edit toggle via details */}
                      <details className="relative group/edit">
                        <summary className="list-none cursor-pointer bg-[#0f4c3a] hover:bg-[#0d3f31] text-white text-xs px-3 py-1 rounded transition-colors select-none">
                          Edit
                        </summary>
                        <div className="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-72">
                          <p className="text-xs font-semibold text-gray-700 mb-3">Edit Produk</p>
                          <form action={actionUpdateProduct} className="space-y-2">
                            <input type="hidden" name="id" value={p.id} />
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-gray-500">Nama</label>
                              <input
                                name="nama"
                                defaultValue={p.nama}
                                required
                                className="border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-gray-500">Satuan</label>
                              <input
                                name="satuan"
                                defaultValue={p.satuan}
                                required
                                className="border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-gray-500">Harga Modal (Rp)</label>
                              <input
                                name="harga_modal_default"
                                type="number"
                                min="0"
                                step="1"
                                defaultValue={p.harga_modal_default}
                                className="border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-gray-500">Harga Jual (Rp)</label>
                              <input
                                name="harga_jual_default"
                                type="number"
                                min="0"
                                step="1"
                                defaultValue={p.harga_jual_default}
                                className="border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
                              />
                            </div>
                            <button
                              type="submit"
                              className="w-full bg-[#0f4c3a] hover:bg-[#0d3f31] text-white text-xs font-medium px-3 py-1.5 rounded mt-1 transition-colors"
                            >
                              Simpan
                            </button>
                          </form>
                        </div>
                      </details>

                      {/* Delete */}
                      <form action={actionDeleteProduct}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded transition-colors"
                        >
                          Hapus
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {products.length} produk
          </div>
        )}
      </div>
    </div>
  )
}
