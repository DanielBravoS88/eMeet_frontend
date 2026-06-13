import type { EventCategory } from '../types'
import { CATEGORY_EMOJI } from '../lib/eventUtils'

const ORDERED_CATEGORIES: EventCategory[] = [
  'gastronomia',
  'musica',
  'cultura',
  'fiesta',
  'networking',
  'deporte',
  'teatro',
  'arte',
]

const CATEGORY_LABEL: Record<EventCategory, string> = {
  gastronomia: 'Gastronomía',
  musica: 'Música',
  cultura: 'Cultura',
  networking: 'Networking',
  deporte: 'Deporte',
  fiesta: 'Fiesta',
  teatro: 'Teatro',
  arte: 'Arte',
}

interface EventCategoryFilterProps {
  selected: EventCategory[]
  onToggle: (cat: EventCategory) => void
  className?: string
}

export default function EventCategoryFilter({
  selected,
  onToggle,
  className,
}: EventCategoryFilterProps) {
  const selectedSet = new Set(selected)

  return (
    <div className={className ?? 'flex flex-wrap gap-2'}>
      {ORDERED_CATEGORIES.map((cat) => {
        const isOn = selectedSet.has(cat)
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onToggle(cat)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
              isOn
                ? 'border-primary bg-primary text-white shadow-[0_0_12px_rgba(124,58,237,0.45)]'
                : 'border-white/20 bg-[rgba(10,12,30,0.82)] text-slate-300 hover:border-primary/60'
            }`}
          >
            <span>{CATEGORY_EMOJI[cat]}</span>
            <span>{CATEGORY_LABEL[cat]}</span>
          </button>
        )
      })}
    </div>
  )
}
