import { listStock } from '@/lib/db/stock'

export default async function StokPage() {
  const items = await listStock()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-semibold"
          style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', color: 'var(--ink)' }}
        >
          Laporan Stok
        </h2>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header-row">
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
                  <td colSpan={6} className="px-4 py-8 text-center" style={{ color: 'var(--moss)' }}>
                    Belum ada data stok.
                  </td>
                </tr>
              )}
              {items.map((item, i) => (
                <tr
                  key={item.product_id}
                  className="border-t hover:bg-[#EEF5F0] transition-colors"
                  style={{
                    borderColor: 'var(--line)',
                    backgroundColor: i % 2 === 1 ? 'var(--canvas)' : 'var(--paper-elev)',
                  }}
                >
                  <td className="px-4 py-2 text-[#9a9a9a]">{i + 1}</td>
                  <td className="px-4 py-2 font-medium" style={{ color: 'var(--ink)' }}>{item.nama}</td>
                  <td className="px-4 py-2 text-[#5a5a5a]">{item.satuan}</td>
                  <td className="px-4 py-2 text-right money">{item.qty_masuk.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-2 text-right money">{item.qty_terpakai.toLocaleString('id-ID')}</td>
                  <td
                    className={`px-4 py-2 text-right font-semibold money ${
                      item.qty_sisa < 0 ? 'bg-red-50' : ''
                    }`}
                    style={item.qty_sisa < 0 ? { color: 'var(--clay)' } : { color: 'var(--ink)' }}
                  >
                    {item.qty_sisa.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length > 0 && (
          <div className="px-4 py-2 border-t text-xs" style={{ borderColor: 'var(--line)', color: 'var(--moss)' }}>
            {items.length} produk
          </div>
        )}
      </div>
    </div>
  )
}
