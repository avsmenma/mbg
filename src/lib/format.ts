export const rupiah = (n: number) =>
  'Rp ' + (Number.isFinite(n) ? Math.round(n) : 0).toLocaleString('id-ID')

export const tanggalID = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'
