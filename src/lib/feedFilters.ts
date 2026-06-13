import type { Event } from '../types'

// ── Precio ─────────────────────────────────────────────────────────────────
export type PriceMode = 'any' | 'free' | 'paid'

export function matchesPrice(event: Event, mode: PriceMode): boolean {
  if (mode === 'any') return true
  const isFree = event.price === null || event.price === 0
  if (mode === 'free') return isFree
  if (mode === 'paid') return !isFree
  return true
}

// ── Fecha ──────────────────────────────────────────────────────────────────
export type DateRangeMode = 'any' | 'today' | 'weekend' | 'week'

/**
 * Devuelve [startMs, endMs] del rango de fecha seleccionado.
 * Si mode === 'any' devuelve null (no aplicar filtro).
 */
export function dateRangeBounds(mode: DateRangeMode, now: Date = new Date()): [number, number] | null {
  if (mode === 'any') return null

  const start = new Date(now)
  const end = new Date(now)

  if (mode === 'today') {
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    return [start.getTime(), end.getTime()]
  }

  if (mode === 'week') {
    start.setHours(0, 0, 0, 0)
    end.setDate(end.getDate() + 7)
    end.setHours(23, 59, 59, 999)
    return [start.getTime(), end.getTime()]
  }

  if (mode === 'weekend') {
    const day = now.getDay() // 0 = dom, 6 = sáb
    if (day === 6) {
      // Sábado: hoy + mañana (dom)
      start.setHours(0, 0, 0, 0)
      end.setDate(end.getDate() + 1)
      end.setHours(23, 59, 59, 999)
    } else if (day === 0) {
      // Domingo: solo hoy
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    } else {
      // Lunes-Viernes: próximo sábado y domingo
      const daysUntilSat = 6 - day
      start.setDate(start.getDate() + daysUntilSat)
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 1)
      end.setHours(23, 59, 59, 999)
    }
    return [start.getTime(), end.getTime()]
  }

  return null
}

/**
 * ¿El evento cae dentro del rango de fecha seleccionado?
 *
 * Los lugares de Google Places no tienen fecha intrínseca; cuando el usuario
 * filtra por fecha esperamos eventos específicos, así que descartamos los
 * lugares sin fecha (no contaminan el resultado).
 */
export function matchesDateRange(event: Event, mode: DateRangeMode, now: Date = new Date()): boolean {
  const bounds = dateRangeBounds(mode, now)
  if (!bounds) return true
  if (!event.date) return false
  const ts = new Date(event.date).getTime()
  if (Number.isNaN(ts)) return false
  return ts >= bounds[0] && ts <= bounds[1]
}
