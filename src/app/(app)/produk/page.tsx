import { listProducts } from '@/lib/db/products'
import { rupiah } from '@/lib/format'
import { actionCreateProduct, actionUpdateProduct, actionDeleteProduct } from './actions'

export default async function ProdukPage() {
  const products = await listProducts()

  return (
    <div className="space-y-6">
      <h2
        className="text-xl font-semibold"
        style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', color: 'var(--ink)' }}
      >
        Produk
      </h2>

      {/* Form Tambah Produk */}
      <div className="card p-4">
        <p className="card-title mb-3">Tambah Produk</p>
        <form action={actionCreateProduct} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--ink)' }}>Nama Produk</label>
            <input
              name="nama"
              required
              placeholder="Nama produk"
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C77D12]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--ink)' }}>Satuan</label>
            <input
              name="satuan"
              required
              placeholder="pcs / kg / ltr"
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C77D12]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--ink)' }}>Harga Modal (Rp)</label>
            <input
              name="harga_modal_default"
              type="number"
              min="0"
              step="1"
              defaultValue="0"
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C77D12]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--ink)' }}>Harga Jual (Rp)</label>
            <input
              name="harga_jual_default"
              type="number"
              min="0"
              step="1"
              defaultValue="0"
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C77D12]"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="btn-primary w-full justify-center"
            >
              + Tambah
            </button>
          </div>
        </form>
      </div>

      {/* Tabel Produk */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header-row">
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
                  <td colSpan={6} className="px-4 py-8 text-center" style={{ color: 'var(--moss)' }}>
                    Belum ada data produk.
                  </td>
                </tr>
              )}
              {products.map((p, i) => (
                <tr
                  key={p.id}
                  className="border-t hover:bg-[#EEF5F0] group transition-colors"
                  style={{
                    borderColor: 'var(--line)',
                    backgroundColor: i % 2 === 1 ? 'var(--canvas)' : 'var(--paper-elev)',
                  }}
                >
                  {/* View row */}
                  <td className="px-4 py-2 text-[#9a9a9a] group-has-[.edit-form:target]:hidden">{i + 1}</td>
                  <td className="px-4 py-2 font-medium" style={{ color: 'var(--ink)' }}>{p.nama}</td>
                  <td className="px-4 py-2 text-[#5a5a5a]">{p.satuan}</td>
                  <td className="px-4 py-2 text-right money">{rupiah(p.harga_modal_default)}</td>
                  <td className="px-4 py-2 text-right money">{rupiah(p.harga_jual_default)}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      {/* Edit toggle via details */}
                      <details className="relative group/edit">
                        <summary
                          className="list-none cursor-pointer text-white text-xs px-3 py-1 rounded transition-colors select-none"
                          style={{ backgroundColor: 'var(--pine)' }}
                        >
                          Edit
                        </summary>
                        <div
                          className="absolute right-0 top-8 z-10 rounded-lg shadow-lg p-4 w-72"
                          style={{ backgroundColor: 'var(--paper-elev)', border: '1px solid var(--line)' }}
                        >
                          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--ink)' }}>Edit Produk</p>
                          <form action={actionUpdateProduct} className="space-y-2">
                            <input type="hidden" name="id" value={p.id} />
                            <div className="flex flex-col gap-1">
                              <label className="text-xs" style={{ color: 'var(--moss)' }}>Nama</label>
                              <input
                                name="nama"
                                defaultValue={p.nama}
                                required
                                className="border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#C77D12]"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs" style={{ color: 'var(--moss)' }}>Satuan</label>
                              <input
                                name="satuan"
                                defaultValue={p.satuan}
                                required
                                className="border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#C77D12]"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs" style={{ color: 'var(--moss)' }}>Harga Modal (Rp)</label>
                              <input
                                name="harga_modal_default"
                                type="number"
                                min="0"
                                step="1"
                                defaultValue={p.harga_modal_default}
                                className="border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#C77D12]"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs" style={{ color: 'var(--moss)' }}>Harga Jual (Rp)</label>
                              <input
                                name="harga_jual_default"
                                type="number"
                                min="0"
                                step="1"
                                defaultValue={p.harga_jual_default}
                                className="border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#C77D12]"
                              />
                            </div>
                            <button
                              type="submit"
                              className="btn-primary w-full justify-center text-xs py-1.5"
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
                          className="text-white text-xs px-3 py-1 rounded transition-colors"
                          style={{ backgroundColor: 'var(--clay)' }}
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
          <div className="px-4 py-2 border-t text-xs" style={{ borderColor: 'var(--line)', color: 'var(--moss)' }}>
            {products.length} produk
          </div>
        )}
      </div>
    </div>
  )
}
