import { createClient } from '@/lib/supabase/server'

// ── Types ──────────────────────────────────────────────────────────────────

export interface PerTanggalItem {
  tanggal: string
  profit: number
}

export interface DashboardData {
  totalJual: number
  totalModal: number
  totalProfit: number
  piutang: number
  perluCekCount: number
  perTanggal: PerTanggalItem[]
  recentSales: {
    id: string
    no_invoice: string | null
    tanggal_antar: string
    total_jual: number
    status_bayar: 'cair' | 'belum'
  }[]
}

// ── Query ──────────────────────────────────────────────────────────────────

export async function getDashboard(): Promise<DashboardData> {
  const supabase = await createClient()

  // Fetch all sales columns needed for aggregation
  const { data: salesRows, error: salesErr } = await supabase
    .from('sales')
    .select('id, no_invoice, tanggal_antar, total_jual, total_modal, total_fee, status_bayar')
    .order('tanggal_antar', { ascending: false })
  if (salesErr) throw new Error(salesErr.message)

  const rows = salesRows ?? []

  // Aggregate KPIs
  let totalJual = 0
  let totalModal = 0
  let totalProfit = 0
  let piutang = 0

  // Group profit by tanggal_antar
  const profitByDate: Record<string, number> = {}

  for (const row of rows) {
    const jual = Number(row.total_jual ?? 0)
    const modal = Number(row.total_modal ?? 0)
    const fee = Number(row.total_fee ?? 0)

    totalJual += isFinite(jual) ? jual : 0
    totalModal += isFinite(modal) ? modal : 0
    totalProfit += isFinite(fee) ? fee : 0

    if (row.status_bayar === 'belum') {
      piutang += isFinite(jual) ? jual : 0
    }

    const tgl: string = row.tanggal_antar ?? ''
    if (tgl) {
      profitByDate[tgl] = (profitByDate[tgl] ?? 0) + (isFinite(fee) ? fee : 0)
    }
  }

  // Build perTanggal array ordered by date ascending
  const perTanggal: PerTanggalItem[] = Object.entries(profitByDate)
    .map(([tanggal, profit]) => ({ tanggal, profit }))
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal))

  // Count perlu_cek from sale_items
  const { count: salePerluCek, error: siErr } = await supabase
    .from('sale_items')
    .select('id', { count: 'exact', head: true })
    .eq('perlu_cek', true)
  if (siErr) throw new Error(siErr.message)

  // Count perlu_cek from purchase_items
  const { count: purchasePerluCek, error: piErr } = await supabase
    .from('purchase_items')
    .select('id', { count: 'exact', head: true })
    .eq('perlu_cek', true)
  if (piErr) throw new Error(piErr.message)

  const perluCekCount = (salePerluCek ?? 0) + (purchasePerluCek ?? 0)

  // Recent sales (latest 5)
  const recentSales = rows.slice(0, 5).map((row) => ({
    id: row.id as string,
    no_invoice: (row.no_invoice as string | null) ?? null,
    tanggal_antar: row.tanggal_antar as string,
    total_jual: Number(row.total_jual ?? 0),
    status_bayar: (row.status_bayar as 'cair' | 'belum') ?? 'belum',
  }))

  return {
    totalJual,
    totalModal,
    totalProfit,
    piutang,
    perluCekCount,
    perTanggal,
    recentSales,
  }
}
