import type { DateRangeMode } from '../lib/feedFilters'

interface DateRangeFilterProps {
  selected: DateRangeMode
  onChange: (mode: DateRangeMode) => void
  className?: string
}

const OPTIONS: Array<{ mode: DateRangeMode; label: string; emoji: string }> = [
  { mode: 'any', label: 'Cualquier momento', emoji: '🗓️' },
  { mode: 'today', label: 'Hoy', emoji: '⚡' },
  { mode: 'weekend', label: 'Este fin de semana', emoji: '🎊' },
  { mode: 'week', label: 'Próximos 7 días', emoji: '📆' },
]

export default function DateRangeFilter({ selected, onChange, className }: DateRangeFilterProps) {
  return (
    <div className={className ?? 'flex flex-wrap gap-2'}>
      {OPTIONS.map(({ mode, label, emoji }) => {
        const isSelected = selected === mode
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
              isSelected
                ? 'border-primary bg-primary text-white shadow-[0_0_12px_rgba(124,58,237,0.45)]'
                : 'border-white/20 bg-[rgba(10,12,30,0.82)] text-slate-300 hover:border-primary/60'
            }`}
          >
            <span>{emoji}</span>
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
