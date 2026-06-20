import React from 'react'
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer'
import type { SaleDetail } from '@/lib/db/sales'

// ── Format helpers (react-pdf cannot use Intl.NumberFormat on all Node versions) ──
function rupiahPdf(n: number): string {
  const rounded = Math.round(Number.isFinite(n) ? n : 0)
  return 'Rp ' + rounded.toLocaleString('id-ID')
}

function tanggalPdf(iso: string): string {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// ── Styles ────────────────────────────────────────────────────────────────────
const GREEN = '#0f4c3a'
const LIGHT_GREEN = '#e8f5e9'
const GRAY = '#555555'
const BORDER = '#cccccc'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#222222',
    paddingTop: 32,
    paddingBottom: 48,
    paddingHorizontal: 36,
  },

  // ── Kop ──
  kopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  kopTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
  },
  kopSub: {
    fontSize: 8,
    color: GRAY,
    marginTop: 2,
  },
  kopBankBox: {
    backgroundColor: LIGHT_GREEN,
    padding: 6,
    borderRadius: 3,
    minWidth: 160,
  },
  kopBankLabel: {
    fontSize: 7,
    color: GRAY,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  kopBankValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },

  divider: {
    borderBottomWidth: 1.5,
    borderBottomColor: GREEN,
    marginVertical: 8,
  },

  // ── Invoice title ──
  invoiceTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 1,
  },

  // ── Info grid ──
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  infoBox: {
    flex: 1,
  },
  infoField: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  infoLabel: {
    width: 90,
    color: GRAY,
  },
  infoColon: {
    width: 8,
    color: GRAY,
  },
  infoValue: {
    flex: 1,
    fontFamily: 'Helvetica-Bold',
  },
  statusBadge: {
    fontSize: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
  },

  // ── Table ──
  table: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 2,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: GREEN,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableHeaderText: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
  },
  tableRowAlt: {
    backgroundColor: '#f9f9f9',
  },

  // Column widths
  colNo: { width: 22 },
  colNama: { flex: 1 },
  colQty: { width: 36, textAlign: 'right' },
  colSatuan: { width: 44 },
  colHarga: { width: 76, textAlign: 'right' },
  colJumlah: { width: 76, textAlign: 'right' },

  // ── Total row ──
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    width: 80,
    textAlign: 'right',
    paddingRight: 8,
    color: GREEN,
  },
  totalValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    width: 76,
    textAlign: 'right',
    color: GREEN,
  },

  // ── Terbilang ──
  terbilangBox: {
    backgroundColor: LIGHT_GREEN,
    borderLeftWidth: 3,
    borderLeftColor: GREEN,
    padding: 6,
    marginBottom: 20,
  },
  terbilangLabel: {
    fontSize: 7,
    color: GRAY,
    marginBottom: 2,
  },
  terbilangText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Oblique',
    color: GREEN,
  },

  // ── Footer tanda tangan ──
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
  },
  ttdBox: {
    alignItems: 'center',
    width: '30%',
  },
  ttdLabel: {
    fontSize: 8,
    color: GRAY,
    marginBottom: 40,
  },
  ttdLine: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    width: '100%',
    marginBottom: 3,
  },
  ttdName: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  ttdRole: {
    fontSize: 7,
    color: GRAY,
    textAlign: 'center',
  },
})

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  sale: SaleDetail
}

export function InvoicePDF({ sale }: Props) {
  const bank = sale.customer_bank ?? 'BNI'
  const noRek = sale.customer_no_rekening ?? '-'
  const atasNama = sale.customer_atas_nama ?? 'Toko Berkah Abadi'
  const statusColor = sale.status_bayar === 'cair' ? '#2e7d32' : '#c62828'
  const statusLabel = sale.status_bayar === 'cair' ? 'LUNAS' : 'BELUM LUNAS'

  return (
    <Document title={`Invoice ${sale.no_invoice ?? ''}`} author="Toko Berkah Abadi">
      <Page size="A4" style={styles.page}>

        {/* ── Kop ── */}
        <View style={styles.kopRow}>
          <View>
            <Text style={styles.kopTitle}>Toko Berkah Abadi</Text>
            <Text style={styles.kopSub}>Distributor & Perdagangan Umum</Text>
          </View>
          <View style={styles.kopBankBox}>
            <Text style={styles.kopBankLabel}>Transfer ke</Text>
            <Text style={styles.kopBankValue}>{bank}</Text>
            <Text style={{ fontSize: 8 }}>No. Rek: {noRek}</Text>
            <Text style={{ fontSize: 8 }}>A/N: {atasNama}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Judul ── */}
        <Text style={styles.invoiceTitle}>INVOICE / FAKTUR</Text>

        {/* ── Info ── */}
        <View style={styles.infoRow}>
          {/* Kolom kiri: detail invoice */}
          <View style={styles.infoBox}>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>No. Invoice</Text>
              <Text style={styles.infoColon}>:</Text>
              <Text style={styles.infoValue}>{sale.no_invoice ?? '-'}</Text>
            </View>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>No. PO</Text>
              <Text style={styles.infoColon}>:</Text>
              <Text style={styles.infoValue}>{sale.no_po ?? '-'}</Text>
            </View>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>Tanggal Antar</Text>
              <Text style={styles.infoColon}>:</Text>
              <Text style={styles.infoValue}>{tanggalPdf(sale.tanggal_antar)}</Text>
            </View>
            <View style={[styles.infoField, { marginTop: 2 }]}>
              <Text style={styles.infoLabel}>Status Bayar</Text>
              <Text style={styles.infoColon}>:</Text>
              <View>
                <Text style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                  {statusLabel}
                </Text>
              </View>
            </View>
          </View>

          {/* Kolom kanan: pelanggan */}
          <View style={styles.infoBox}>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>Kepada</Text>
              <Text style={styles.infoColon}>:</Text>
              <Text style={[styles.infoValue, { fontSize: 10 }]}>
                {sale.customer_nama ?? '-'}
              </Text>
            </View>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>Alamat</Text>
              <Text style={styles.infoColon}>:</Text>
              <Text style={[styles.infoValue, { color: GRAY }]}>
                {sale.customer_alamat ?? '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Tabel Item ── */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colNo]}>No</Text>
            <Text style={[styles.tableHeaderText, styles.colNama]}>Nama Barang</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colSatuan, { paddingLeft: 4 }]}>Satuan</Text>
            <Text style={[styles.tableHeaderText, styles.colHarga]}>Harga</Text>
            <Text style={[styles.tableHeaderText, styles.colJumlah]}>Jumlah</Text>
          </View>

          {/* Rows */}
          {sale.items.map((item, idx) => (
            <View
              key={item.id}
              style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={styles.colNo}>{idx + 1}</Text>
              <Text style={styles.colNama}>{item.product_nama ?? '-'}</Text>
              <Text style={styles.colQty}>{item.qty}</Text>
              <Text style={[styles.colSatuan, { paddingLeft: 4 }]}>{item.satuan}</Text>
              <Text style={styles.colHarga}>{rupiahPdf(item.harga_jual)}</Text>
              <Text style={styles.colJumlah}>{rupiahPdf(item.jumlah_jual)}</Text>
            </View>
          ))}
        </View>

        {/* ── Total ── */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{rupiahPdf(sale.total_jual)}</Text>
        </View>

        {/* ── Terbilang ── */}
        {sale.terbilang && (
          <View style={styles.terbilangBox}>
            <Text style={styles.terbilangLabel}>Terbilang:</Text>
            <Text style={styles.terbilangText}>
              {sale.terbilang.charAt(0).toUpperCase() + sale.terbilang.slice(1)}
            </Text>
          </View>
        )}

        {/* ── Tanda Tangan ── */}
        <View style={styles.footer}>
          <View style={styles.ttdBox}>
            <Text style={styles.ttdLabel}>Tanda Terima</Text>
            <View style={styles.ttdLine} />
            <Text style={styles.ttdName}>{sale.customer_nama ?? 'Pelanggan'}</Text>
            <Text style={styles.ttdRole}>Penerima</Text>
          </View>
          <View style={styles.ttdBox}>
            <Text style={styles.ttdLabel}>Dibuat Oleh</Text>
            <View style={styles.ttdLine} />
            <Text style={styles.ttdName}>Admin</Text>
            <Text style={styles.ttdRole}>Toko Berkah Abadi</Text>
          </View>
          <View style={styles.ttdBox}>
            <Text style={styles.ttdLabel}>Hormat Kami</Text>
            <View style={styles.ttdLine} />
            <Text style={styles.ttdName}>TRI APRILIYANTA, S.M.</Text>
            <Text style={styles.ttdRole}>Toko Berkah Abadi</Text>
          </View>
        </View>

      </Page>
    </Document>
  )
}
