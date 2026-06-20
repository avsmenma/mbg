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
    <div className="bg-white border border-gray-200 rounded shadow px-3 py-2 text-sm">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      <p className={val < 0 ? 'text-red-600 font-semibold' : 'text-[#0f4c3a] font-semibold'}>
        {rupiah(val)}
      </p>
    </div>
  )
}

export function ProfitChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Belum ada data transaksi.
      </div>
    )
  }

  const hasNegative = data.some((d) => d.profit < 0)

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="tanggal"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => {
            if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}Jt`
            if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}Rb`
            return String(v)
          }}
        />
        {hasNegative && <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={1} />}
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="profit" radius={[3, 3, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.profit < 0 ? '#ef4444' : '#0f4c3a'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
