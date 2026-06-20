import { describe, it, expect } from 'vitest'
import { parseFakturBelanja } from '@/lib/import/parse-faktur-belanja'
import { parseInvoiceRecap } from '@/lib/import/parse-invoice'

describe('parseFakturBelanja', () => {
  const sheets = parseFakturBelanja('FAKTUR BELANJA.xlsx')
  it('menemukan sheet tanggal', () => { expect(sheets.length).toBeGreaterThanOrEqual(6) })
  it('baris pertama sheet 23 Mei = Minyak sovia 18L', () => {
    const s = sheets.find(x => x.tanggal.startsWith('2026-05-23'))!
    expect(s.items[0].nama).toContain('Minyak sovia')
    expect(s.items[0].jumlah).toBe(730000)
  })
})
describe('parseInvoiceRecap', () => {
  const rows = parseInvoiceRecap('INVOICE BERKAH ABADI REV.xlsx')
  it('membaca baris rekap Lembar1', () => { expect(rows.length).toBeGreaterThan(10) })
  it('tidak memuat baris error', () => {
    expect(rows.every(r => !/#(N\/A|VALUE|REF)/.test(JSON.stringify(r)))).toBe(true)
  })
})
