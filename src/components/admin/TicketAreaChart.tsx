'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export interface TicketPoint {
  month: string
  tickets: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-em-border bg-em-surface px-3 py-2 shadow-xl">
      <p className="text-[11px] text-em-muted">{label}</p>
      <p className="text-sm font-bold text-em-accent">{payload[0].value.toLocaleString('es-CL')} tickets</p>
    </div>
  )
}

interface Props {
  data?: TicketPoint[]
  loading?: boolean
}

export default function TicketAreaChart({ data, loading }: Props) {
  if (loading) {
    return <div className="h-[220px] animate-pulse rounded-lg bg-white/5" />
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-center">
        <span className="text-3xl">🎟️</span>
        <p className="text-sm text-em-muted">Sin datos de ventas aún</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="ticketGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E2329" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: '#848E9C', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#848E9C', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#FF6B00', strokeWidth: 1, strokeDasharray: '4 4' }} />
        <Area
          type="monotone"
          dataKey="tickets"
          stroke="#FF6B00"
          strokeWidth={2}
          fill="url(#ticketGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#FF6B00', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
