import * as XLSX from 'xlsx'

const ERR = /#(N\/A|VALUE|REF|DIV)/i

/** Konversi nilai ke angka; NaN/non-finite → 0 */
const num = (v: unknown): number => {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}

export interface InvoiceRow {
  nama: string
  keterangan: string
  volume: number
  satuan: string
  hargaModal: number
  hargaJual: number
  /** Jumlah Harga Jual tercatat di Excel (col[7]) */
  jumlahJual: number
  /** Jumlah Harga Suplier tercatat di Excel (col[8]) */
  jumlahModal: number
  /** Profit tercatat di Excel (col[9]) */
  profitRecorded: number
  statusBayar: 'cair' | 'belum'
  tanggal: string | null
}

const skipped: string[] = []

/**
 * Parse sheet "Lembar1" dari file INVOICE BERKAH ABADI REV.xlsx.
 *
 * Layout kolom Lembar1:
 *   [0] No  [1] Nama Barang  [2] Keterangan (atau Date pada baris subtotal)
 *   [3] Volume  [4] Satuan  [5] Harga Suplier  [6] Harga Jual
 *   [7] Jumlah Harga Jual  [8] Jumlah Harga Suplier  [9] Profit
 *
 * Baris subtotal: col[1] null, col[2] adalah Date → tandai tanggalAktif, lalu skip.
 * Status bayar: keterangan mengandung "belum" → 'belum', selainnya → 'cair'.
 */
export function parseInvoiceRecap(path: string): InvoiceRow[] {
  const wb = XLSX.readFile(path, { cellDates: true })
  const ws = wb.Sheets['Lembar1']
  if (!ws) throw new Error('Sheet "Lembar1" tidak ditemukan di file: ' + path)

  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true })
  const out: InvoiceRow[] = []
  let tanggalAktif: string | null = null

  for (const r of rows) {
    // Baris subtotal pembawa tanggal: col[2] adalah Date, col[1] null/kosong
    const col2 = r[2]
    if (col2 instanceof Date && (r[1] == null || String(r[1]).trim() === '')) {
      tanggalAktif = col2.toISOString().slice(0, 10)
      continue
    }

    // Cek penanda error Excel pada seluruh baris
    const rowStr = JSON.stringify(r)
    if (ERR.test(rowStr)) {
      skipped.push(`[Lembar1] ${rowStr}`)
      continue
    }

    const nama = String(r[1] ?? '').trim()
    if (!nama) continue // skip baris header, kosong, jumlah total, dll

    const ket = String(r[2] ?? '').trim()
    const hargaModal = num(r[5])
    const hargaJual = num(r[6])

    // Skip baris yang bukan data barang (harga keduanya nol → kemungkinan baris judul)
    if (hargaModal === 0 && hargaJual === 0) continue

    out.push({
      nama,
      keterangan: ket,
      volume: num(r[3]),
      satuan: String(r[4] ?? '').trim(),
      hargaModal,
      hargaJual,
      jumlahJual: num(r[7]),
      jumlahModal: num(r[8]),
      profitRecorded: num(r[9]),
      statusBayar: /belum/i.test(ket) ? 'belum' : 'cair',
      tanggal: tanggalAktif,
    })
  }

  if (skipped.length > 0) {
    console.warn('[parseInvoiceRecap] baris dilewati:', skipped)
  }

  return out
}
