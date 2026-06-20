'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { rupiah } from '@/lib/format'

interface PerTanggalItem {
  tanggal: string
  profit: number
}

interface Props {
  data: PerTanggalItem[]
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null
  const val = payload[0].value
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E6DFD1',
        borderRadius: '0.5rem',
        boxShadow: '0 2px 8px rgb(0 0 0 / 0.10)',
        padding: '0.5rem 0.75rem',
        fontFamily: 'var(--font-body), system-ui, sans-serif',
      }}
    >
      <p style={{ fontSize: '0.75rem', color: '#4C7A5A', marginBottom: '0.25rem' }}>{label}</p>
      <p
        className="money"
        style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: val < 0 ? '#A83A2B' : '#16513D',
        }}
      >
        {rupiah(val)}
      </p>
    </div>
  )
}

export function ProfitChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-48 text-sm"
        style={{ color: 'var(--moss)', fontFamily: 'var(--font-body), system-ui, sans-serif' }}
      >
        Belum ada data transaksi.
      </div>
    )
  }

  const hasNegative = data.some((d) => d.profit < 0)

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E6DFD1" vertical={false} />
        <XAxis
          dataKey="tanggal"
          tick={{ fontSize: 11, fill: '#4C7A5A', fontFamily: 'var(--font-mono), monospace' }}
          tickLine={false}
          axisLine={{ stroke: '#E6DFD1' }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#4C7A5A', fontFamily: 'var(--font-mono), monospace' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => {
            if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}Jt`
            if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}Rb`
            return String(v)
          }}
        />
        {hasNegative && <ReferenceLine y={0} stroke="#E6DFD1" strokeWidth={1.5} />}
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(14, 59, 46, 0.04)' }} />
        <Bar dataKey="profit" radius={[3, 3, 0, 0]} maxBarSize={40}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.profit < 0 ? '#A83A2B' : '#16513D'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
