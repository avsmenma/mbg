import { listSuppliers, listCustomers } from '@/lib/db/master'
import { actionCreateSupplier, actionDeleteSupplier, actionUpsertCustomer } from './actions'

export default async function MasterPage() {
  const [suppliers, customers] = await Promise.all([listSuppliers(), listCustomers()])

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-gray-800">Data Master</h2>

      {/* ── SEKSI PEMASOK ─────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-[#0f4c3a]">Pemasok</h3>

        {/* Form Tambah Pemasok */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Tambah Pemasok</p>
          <form action={actionCreateSupplier} className="flex gap-3 items-end">
            <div className="flex flex-col gap-1 flex-1 max-w-sm">
              <label className="text-xs font-medium text-gray-600">Nama Pemasok</label>
              <input
                name="nama"
                required
                placeholder="Nama pemasok"
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
              />
            </div>
            <button
              type="submit"
              className="bg-[#0f4c3a] hover:bg-[#0d3f31] text-white text-sm font-medium px-4 py-2 rounded transition-colors"
            >
              + Tambah
            </button>
          </form>
        </div>

        {/* Tabel Pemasok */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0f4c3a] text-white">
                  <th className="px-4 py-3 text-left font-semibold w-10">#</th>
                  <th className="px-4 py-3 text-left font-semibold">Nama Pemasok</th>
                  <th className="px-4 py-3 text-center font-semibold w-24">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                      Belum ada data pemasok.
                    </td>
                  </tr>
                )}
                {suppliers.map((s, i) => (
                  <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-2 font-medium text-gray-800">{s.nama}</td>
                    <td className="px-4 py-2 text-center">
                      <form action={actionDeleteSupplier}>
                        <input type="hidden" name="id" value={s.id} />
                        <button
                          type="submit"
                          className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded transition-colors"
                        >
                          Hapus
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {suppliers.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
              {suppliers.length} pemasok
            </div>
          )}
        </div>
      </section>

      {/* ── SEKSI PELANGGAN ───────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-[#0f4c3a]">Pelanggan</h3>

        {/* Form Tambah Pelanggan (hanya tampil jika belum ada data) */}
        {customers.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Tambah Pelanggan</p>
            <form action={actionUpsertCustomer} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Nama</label>
                <input
                  name="nama"
                  required
                  placeholder="Nama pelanggan"
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Alamat</label>
                <input
                  name="alamat"
                  placeholder="Alamat"
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Bank</label>
                <input
                  name="bank"
                  placeholder="Nama bank"
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">No. Rekening</label>
                <input
                  name="no_rekening"
                  placeholder="Nomor rekening"
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Atas Nama</label>
                <input
                  name="atas_nama"
                  placeholder="Atas nama rekening"
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="bg-[#0f4c3a] hover:bg-[#0d3f31] text-white text-sm font-medium px-4 py-2 rounded transition-colors"
                >
                  + Tambah
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Kartu Edit per Pelanggan */}
        {customers.map((c) => (
          <div key={c.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Edit Pelanggan — <span className="text-[#0f4c3a]">{c.nama}</span>
            </p>
            <form action={actionUpsertCustomer} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="hidden" name="id" value={c.id} />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Nama</label>
                <input
                  name="nama"
                  required
                  defaultValue={c.nama}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Alamat</label>
                <input
                  name="alamat"
                  defaultValue={c.alamat}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Bank</label>
                <input
                  name="bank"
                  defaultValue={c.bank}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">No. Rekening</label>
                <input
                  name="no_rekening"
                  defaultValue={c.no_rekening}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Atas Nama</label>
                <input
                  name="atas_nama"
                  defaultValue={c.atas_nama}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="bg-[#0f4c3a] hover:bg-[#0d3f31] text-white text-sm font-medium px-4 py-2 rounded transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        ))}

        {/* Tombol tambah pelanggan baru jika sudah ada data */}
        {customers.length > 0 && (
          <details className="bg-white rounded-lg border border-gray-200">
            <summary className="px-4 py-3 text-sm font-medium text-[#0f4c3a] cursor-pointer select-none hover:bg-gray-50 rounded-lg">
              + Tambah Pelanggan Baru
            </summary>
            <div className="px-4 pb-4 pt-2">
              <form action={actionUpsertCustomer} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Nama</label>
                  <input
                    name="nama"
                    required
                    placeholder="Nama pelanggan"
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Alamat</label>
                  <input
                    name="alamat"
                    placeholder="Alamat"
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Bank</label>
                  <input
                    name="bank"
                    placeholder="Nama bank"
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">No. Rekening</label>
                  <input
                    name="no_rekening"
                    placeholder="Nomor rekening"
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Atas Nama</label>
                  <input
                    name="atas_nama"
                    placeholder="Atas nama rekening"
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c3a]/40"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="bg-[#0f4c3a] hover:bg-[#0d3f31] text-white text-sm font-medium px-4 py-2 rounded transition-colors"
                  >
                    + Tambah
                  </button>
                </div>
              </form>
            </div>
          </details>
        )}
      </section>
    </div>
  )
}
