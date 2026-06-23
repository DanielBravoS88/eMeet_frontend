import { matchesPrice, dateRangeBounds, matchesDateRange } from '@/src/lib/feedFilters'
import type { Event } from '@/src/types'

function makeEvent(overrides?: Partial<Event>): Event {
  return {
    id: 'e1',
    title: 'Evento',
    description: '',
    category: 'fiesta',
    date: '2025-06-15T21:00:00',
    location: '',
    address: '',
    distance: 0,
    price: 5000,
    imageUrl: '',
    videoUrl: null,
    audioPreviewUrl: null,
    websiteUrl: null,
    organizerName: '',
    organizerAvatar: '',
    attendees: 0,
    capacity: 0,
    tags: [],
    isLiked: false,
    isSaved: false,
    rating: 0,
    isOpen: true,
    lat: 0,
    lng: 0,
    ...overrides,
  } as Event
}

// Devuelve una fecha (mediodía) cuyo getDay() coincide con targetDay (0=dom..6=sáb)
function dateWithDay(targetDay: number): Date {
  const d = new Date('2025-06-01T12:00:00')
  while (d.getDay() !== targetDay) d.setDate(d.getDate() + 1)
  return d
}

describe('matchesPrice', () => {
  it('mode "any" siempre pasa', () => {
    expect(matchesPrice(makeEvent({ price: 9000 }), 'any')).toBe(true)
    expect(matchesPrice(makeEvent({ price: null }), 'any')).toBe(true)
  })

  it('mode "free" sólo eventos gratis (price null o 0)', () => {
    expect(matchesPrice(makeEvent({ price: null }), 'free')).toBe(true)
    expect(matchesPrice(makeEvent({ price: 0 }), 'free')).toBe(true)
    expect(matchesPrice(makeEvent({ price: 3000 }), 'free')).toBe(false)
  })

  it('mode "paid" sólo eventos con precio > 0', () => {
    expect(matchesPrice(makeEvent({ price: 3000 }), 'paid')).toBe(true)
    expect(matchesPrice(makeEvent({ price: 0 }), 'paid')).toBe(false)
    expect(matchesPrice(makeEvent({ price: null }), 'paid')).toBe(false)
  })
})

describe('dateRangeBounds', () => {
  it('mode "any" devuelve null', () => {
    expect(dateRangeBounds('any')).toBeNull()
  })

  it('mode "today" devuelve el rango del día actual', () => {
    const now = new Date('2025-06-18T15:00:00')
    const bounds = dateRangeBounds('today', now)
    expect(bounds).not.toBeNull()
    const [start, end] = bounds!
    expect(start).toBeLessThan(end)
    expect(new Date(start).getDate()).toBe(18)
    expect(new Date(end).getDate()).toBe(18)
  })

  it('mode "week" abarca aproximadamente una semana', () => {
    const now = new Date('2025-06-18T15:00:00')
    const [start, end] = dateRangeBounds('week', now)!
    const days = (end - start) / (1000 * 60 * 60 * 24)
    // start es hoy 00:00 y end es el día +7 a las 23:59 → entre 7 y 8 días
    expect(days).toBeGreaterThanOrEqual(7)
    expect(days).toBeLessThanOrEqual(8)
  })

  it('mode "weekend" en día de semana apunta al próximo sábado y domingo', () => {
    const [start, end] = dateRangeBounds('weekend', dateWithDay(3))! // miércoles
    expect(new Date(start).getDay()).toBe(6) // sábado
    expect(new Date(end).getDay()).toBe(0) // domingo
  })

  it('mode "weekend" un sábado abarca hoy y mañana', () => {
    const [start, end] = dateRangeBounds('weekend', dateWithDay(6))!
    expect(new Date(start).getDay()).toBe(6)
    expect(new Date(end).getDay()).toBe(0)
  })

  it('mode "weekend" un domingo abarca sólo hoy', () => {
    const [start, end] = dateRangeBounds('weekend', dateWithDay(0))!
    expect(new Date(start).getDay()).toBe(0)
    expect(new Date(end).getDay()).toBe(0)
  })
})

describe('matchesDateRange', () => {
  it('mode "any" siempre pasa', () => {
    expect(matchesDateRange(makeEvent(), 'any')).toBe(true)
  })

  it('descarta eventos sin fecha cuando hay filtro activo', () => {
    expect(matchesDateRange(makeEvent({ date: null as unknown as string }), 'today')).toBe(false)
  })

  it('descarta eventos con fecha inválida', () => {
    expect(matchesDateRange(makeEvent({ date: 'no-es-fecha' }), 'today')).toBe(false)
  })

  it('acepta un evento dentro del rango', () => {
    const now = new Date('2025-06-18T09:00:00')
    const event = makeEvent({ date: '2025-06-18T21:00:00' })
    expect(matchesDateRange(event, 'today', now)).toBe(true)
  })

  it('rechaza un evento fuera del rango', () => {
    const now = new Date('2025-06-18T09:00:00')
    const event = makeEvent({ date: '2025-07-01T21:00:00' })
    expect(matchesDateRange(event, 'today', now)).toBe(false)
  })
})
