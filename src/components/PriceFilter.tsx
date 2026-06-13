import type { PriceMode } from '../lib/feedFilters'

interface PriceFilterProps {
  selected: PriceMode
  onChange: (mode: PriceMode) => void
  className?: string
}

const OPTIONS: Array<{ mode: PriceMode; label: string; emoji: string }> = [
  { mode: 'any', label: 'Cualquiera', emoji: '💸' },
  { mode: 'free', label: 'Gratis', emoji: '🎉' },
  { mode: 'paid', label: 'Pagado', emoji: '🎟️' },
]

export default function PriceFilter({ selected, onChange, className }: PriceFilterProps) {
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
