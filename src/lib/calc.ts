import type { SaleItem, PurchaseItem } from './types'
const num = (x: number) => (Number.isFinite(x) ? x : 0)

export function lineSale(i: SaleItem) {
  const jumlahJual = num(i.qty) * num(i.hargaJual)
  const jumlahModal = num(i.qty) * num(i.hargaModal)
  return { jumlahJual, jumlahModal, fee: jumlahJual - jumlahModal }
}
export function linePurchase(i: PurchaseItem) {
  const bruto = num(i.qty) * num(i.harga)
  const jumlah = bruto - bruto * (num(i.diskonPersen) / 100)
  return { jumlah }
}
export function totalSale(items: SaleItem[]) {
  return items.reduce((a, it) => {
    const r = lineSale(it)
    return { totalJual: a.totalJual + r.jumlahJual, totalModal: a.totalModal + r.jumlahModal, totalFee: a.totalFee + r.fee }
  }, { totalJual: 0, totalModal: 0, totalFee: 0 })
}
export function safeRatio(a: number, b: number) {
  return num(b) === 0 ? 0 : num(a) / num(b)
}
