import { describe, it, expect } from 'vitest'
import { lineSale, linePurchase, totalSale, safeRatio } from '@/lib/calc'

describe('lineSale', () => {
  it('hitung jumlah jual, modal, fee', () => {
    expect(lineSale({ qty: 60, hargaJual: 17000, hargaModal: 16200 }))
      .toEqual({ jumlahJual: 1020000, jumlahModal: 972000, fee: 48000 })
  })
  it('input kosong -> 0 (anti-error Excel)', () => {
    expect(lineSale({ qty: NaN, hargaJual: 17000, hargaModal: 0 }))
      .toEqual({ jumlahJual: 0, jumlahModal: 0, fee: 0 })
  })
})
describe('linePurchase', () => {
  it('terapkan diskon persen', () => {
    expect(linePurchase({ qty: 2, harga: 100000, diskonPersen: 10 })).toEqual({ jumlah: 180000 })
  })
  it('tanpa diskon', () => {
    expect(linePurchase({ qty: 5, harga: 324000, diskonPersen: 0 })).toEqual({ jumlah: 1620000 })
  })
})
describe('totalSale', () => {
  it('jumlahkan semua baris', () => {
    const r = totalSale([
      { qty: 60, hargaJual: 17000, hargaModal: 16200 },
      { qty: 1, hargaJual: 22500, hargaModal: 19000 },
    ])
    expect(r).toEqual({ totalJual: 1042500, totalModal: 991000, totalFee: 51500 })
  })
})
describe('safeRatio', () => {
  it('penyebut 0 -> 0', () => { expect(safeRatio(5, 0)).toBe(0) })
  it('normal', () => { expect(safeRatio(48000, 16000)).toBe(3) })
})
