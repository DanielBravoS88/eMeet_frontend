'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const CATEGORY_LABELS: Record<string, string> = {
  gastronomia: 'Gastronomía',
  musica: 'Música',
  fiesta: 'Fiesta',
  cultura: 'Cultura',
  deporte: 'Deporte',
  networking: 'Networking',
  teatro: 'Teatro',
  arte: 'Arte',
}

const COLORS = ['#FF6B00', '#FF8C3B', '#F0B90B', '#0ECB81', '#3B82F6', '#848E9C', '#A855F7', '#EC4899']

export interface CategoryStat {
  name: string
  count: number
  percentage: number
}

interface TooltipProps {
  active?: boolean
  payload?: { name: string; value: number }[]
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-em-border bg-em-surface px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-em-text">{payload[0].name}</p>
      <p className="text-sm font-bold text-em-accent">{payload[0].value}%</p>
    </div>
  )
}

interface Props {
  data?: CategoryStat[]
  loading?: boolean
}

export default function CategoryDonut({ data, loading }: Props) {
  if (loading) {
    return <div className="h-[300px] animate-pulse rounded-lg bg-white/5" />
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-center">
        <span className="text-3xl">📊</span>
        <p className="text-sm text-em-muted">Sin datos de categorías aún</p>
      </div>
    )
  }

  const chartData = data.map((item) => ({
    name: CATEGORY_LABELS[item.name] ?? item.name,
    value: item.percentage,
  }))

  return (
    <div className="flex flex-col gap-4">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <ul className="space-y-1.5">
        {chartData.map((item, i) => (
          <li key={item.name} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-em-muted">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              {item.name}
            </span>
            <span className="font-semibold text-em-text-dim">{item.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
