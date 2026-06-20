import * as XLSX from 'xlsx'

const ERR = /#(N\/A|VALUE|REF|DIV)/i

/** Konversi nilai ke angka; NaN/non-finite → 0 */
const num = (v: unknown): number => {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}

/**
 * Peta nama bulan (Indonesia / singkatan) ke nomor bulan 2-digit.
 */
const BULAN: Record<string, string> = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MEI: '05', JUN: '06',
  JUL: '07', AGU: '08', SEP: '09', OKT: '10', NOV: '11', DES: '12',
  JUNI: '06', JULI: '07', AGUS: '08',
}

/**
 * Coba urai tanggal dari nama sheet.
 * Contoh: "23 MEI", "28 MEI ", "2&3 JUNI", "7 JUNI ", "8,9,10 JUNI", "10-14 JUNI".
 * Ambil angka PERTAMA sebagai tanggal, lalu nama bulan, tahun default 2026.
 * Return format: "YYYY-MM-DD" atau null bila tidak bisa diurai.
 */
function parseTanggalDariNamaSheet(name: string): string | null {
  const s = name.trim().toUpperCase()
  // cari token bulan
  let bulanNum: string | null = null
  let matchedBulan = ''
  // coba multiword bulan dulu (JUNI, JULI, AGUS, dll)
  for (const [key, val] of Object.entries(BULAN)) {
    if (s.includes(key)) {
      if (key.length > matchedBulan.length) {
        matchedBulan = key
        bulanNum = val
      }
    }
  }
  if (!bulanNum) return null

  // Cari angka pertama di depan nama bulan
  const beforeBulan = s.slice(0, s.indexOf(matchedBulan))
  const angka = beforeBulan.match(/\d+/)
  if (!angka) return null

  const tgl = angka[0].padStart(2, '0')
  return `2026-${bulanNum}-${tgl}`
}

export interface FakturItem {
  no: number
  nama: string
  bobotKg: number | null
  qty: number
  satuan: string
  harga: number
  diskonPersen: number
  jumlah: number
  supplier: string
}

export interface FakturSheet {
  tanggal: string
  items: FakturItem[]
}

const skipped: string[] = []

export function parseFakturBelanja(path: string): FakturSheet[] {
  const wb = XLSX.readFile(path, { cellDates: true })
  const out: FakturSheet[] = []

  for (const name of wb.SheetNames) {
    const tanggal = parseTanggalDariNamaSheet(name)
    if (!tanggal) continue // skip Lembar4 dan sheet tanpa info tanggal

    const rows: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets[name], {
      header: 1,
      raw: true,
    })

    const items: FakturItem[] = []

    for (const r of rows) {
      const no = r[0]
      // Baris detail: kolom-A adalah angka bulat positif (nomor urut)
      if (typeof no !== 'number' || !Number.isInteger(no) || no <= 0) continue

      const namaRaw = r[1]
      // Skip bila nama kosong / null
      if (namaRaw == null || String(namaRaw).trim() === '') continue

      const nama = String(namaRaw).trim()

      // Skip baris yang mengandung penanda error Excel
      const rowStr = JSON.stringify(r)
      if (ERR.test(rowStr)) {
        skipped.push(`[${name}] row no=${no}: ${rowStr}`)
        continue
      }

      items.push({
        no: num(no),
        nama,
        bobotKg: r[2] == null ? null : num(r[2]),
        qty: num(r[3]),
        satuan: String(r[4] ?? '').trim(),
        harga: num(r[5]),
        diskonPersen: num(r[6]),
        jumlah: num(r[7]),
        supplier: String(r[8] ?? '').trim(),
      })
    }

    if (items.length > 0) {
      out.push({ tanggal, items })
    }
  }

  if (skipped.length > 0) {
    console.warn('[parseFakturBelanja] baris dilewati:', skipped)
  }

  return out
}
