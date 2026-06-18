import { formatEventDate, formatPrice, CATEGORY_COLORS, CATEGORY_EMOJI } from '@/src/lib/eventUtils'

describe('formatEventDate', () => {
  it('formatea una fecha ISO con día y hora', () => {
    const out = formatEventDate('2025-06-15T21:00:00')
    expect(typeof out).toBe('string')
    expect(out).toContain('·')
    expect(out.length).toBeGreaterThan(0)
  })
})

describe('formatPrice', () => {
  it('devuelve "Gratis" cuando el precio es null', () => {
    expect(formatPrice(null)).toBe('Gratis')
  })

  it('formatea un precio en pesos chilenos sin decimales', () => {
    const out = formatPrice(5000)
    expect(out).toContain('5')
    expect(out).not.toContain(',00')
  })

  it('formatea el precio 0 como moneda', () => {
    expect(formatPrice(0)).toMatch(/0/)
  })
})

describe('mapas de categoría', () => {
  it('todas las categorías con color tienen también emoji', () => {
    for (const cat of Object.keys(CATEGORY_COLORS)) {
      expect(CATEGORY_EMOJI[cat]).toBeDefined()
    }
  })

  it('cada color es una clase de tailwind', () => {
    for (const color of Object.values(CATEGORY_COLORS)) {
      expect(color).toMatch(/^bg-/)
    }
  })
})
