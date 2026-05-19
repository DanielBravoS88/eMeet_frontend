import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SwipeCard from '@/src/components/SwipeCard'
import type { Event } from '@/src/types'

// ── Setup global ──────────────────────────────────────────────────────────────

// jsdom no implementa HTMLMediaElement.play/pause
window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined)
window.HTMLMediaElement.prototype.pause = jest.fn()

// ── Mocks ──────────────────────────────────────────────────────────────────────

// Simplificar framer-motion para tests: renderiza hijos normalmente
jest.mock('framer-motion', () => {
  const actual = jest.requireActual<typeof import('framer-motion')>('framer-motion')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react')
  return {
    ...actual,
    motion: {
      div: React.forwardRef(
        ({ children, style, ...rest }: React.HTMLAttributes<HTMLDivElement> & { style?: React.CSSProperties }, ref: React.Ref<HTMLDivElement>) => (
          <div ref={ref} style={style} {...rest}>{children}</div>
        ),
      ),
    },
    useMotionValue: () => ({ get: () => 0, set: jest.fn(), on: jest.fn() }),
    useTransform: () => ({ get: () => 0 }),
    animate: jest.fn(),
  }
})

// ── Fixture ────────────────────────────────────────────────────────────────────

const BASE_EVENT: Event = {
  id: 'e1',
  title: 'Noche de Jazz',
  description: 'La mejor música de jazz en vivo',
  category: 'musica',
  date: '2025-06-15T21:00:00',
  location: 'Bar Central',
  address: 'Bellavista 123',
  distance: 1.2,
  price: 5000,
  imageUrl: 'https://example.com/jazz.jpg',
  videoUrl: null,
  audioPreviewUrl: null,
  websiteUrl: null,
  organizerName: 'Bar Central',
  organizerAvatar: 'https://i.pravatar.cc/150?img=1',
  attendees: 30,
  capacity: 100,
  tags: ['locatario', 'musica'],
  isLiked: false,
  isSaved: false,
  rating: 4.5,
  isOpen: true,
  lat: -33.4,
  lng: -70.6,
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const onSwipeRight = jest.fn()
const onSwipeLeft = jest.fn()
const onSave = jest.fn()

function renderCard(overrides?: Partial<Event>, stackIndex = 0) {
  const event = { ...BASE_EVENT, ...overrides }
  return render(
    <SwipeCard
      event={event}
      onSwipeRight={onSwipeRight}
      onSwipeLeft={onSwipeLeft}
      onSave={onSave}
      stackIndex={stackIndex}
    />,
  )
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('SwipeCard', () => {
  describe('renderizado básico', () => {
    it('muestra el título del evento', () => {
      renderCard()
      expect(screen.getByText('Noche de Jazz')).toBeInTheDocument()
    })

    it('muestra la descripción del evento', () => {
      renderCard()
      expect(screen.getByText('La mejor música de jazz en vivo')).toBeInTheDocument()
    })

    it('muestra la categoría del evento', () => {
      renderCard()
      expect(screen.getByText(/musica/i)).toBeInTheDocument()
    })

    it('muestra badge Abierto cuando isOpen es true', () => {
      renderCard({ isOpen: true })
      expect(screen.getByText('Abierto')).toBeInTheDocument()
    })

    it('muestra badge Cerrado cuando isOpen es false', () => {
      renderCard({ isOpen: false })
      expect(screen.getByText('Cerrado')).toBeInTheDocument()
    })

    it('no muestra badge de estado si isOpen es null', () => {
      renderCard({ isOpen: null })
      expect(screen.queryByText('Abierto')).not.toBeInTheDocument()
      expect(screen.queryByText('Cerrado')).not.toBeInTheDocument()
    })

    it('muestra el nombre del organizador', () => {
      renderCard()
      // Aparece en dos lugares (location + organizerName), ambos tienen el mismo valor
      const matches = screen.getAllByText('Bar Central')
      expect(matches.length).toBeGreaterThan(0)
    })

    it('muestra el precio formateado', () => {
      renderCard()
      expect(screen.getByText(/5\.000|5,000|\$5/)).toBeInTheDocument()
    })

    it('muestra Gratis cuando price es null', () => {
      renderCard({ price: null })
      expect(screen.getByText(/gratis/i)).toBeInTheDocument()
    })
  })

  describe('carta activa (stackIndex 0)', () => {
    it('muestra el botón de guardar', () => {
      renderCard()
      expect(screen.getByRole('button', { name: /guardar evento/i })).toBeInTheDocument()
    })

    it('muestra los botones de like y nope', () => {
      renderCard()
      expect(screen.getByRole('button', { name: 'Me interesa' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'No me interesa' })).toBeInTheDocument()
    })

    it('llama onSave al hacer click en guardar', async () => {
      const user = userEvent.setup()
      renderCard()
      await user.click(screen.getByRole('button', { name: /guardar evento/i }))
      expect(onSave).toHaveBeenCalledWith('e1')
    })

    it('llama onSwipeRight al hacer click en me interesa', async () => {
      const user = userEvent.setup()
      renderCard()
      await user.click(screen.getByRole('button', { name: 'Me interesa' }))
      expect(onSwipeRight).toHaveBeenCalledWith('e1')
    })

    it('llama onSwipeLeft al hacer click en no me interesa', async () => {
      const user = userEvent.setup()
      renderCard()
      await user.click(screen.getByRole('button', { name: 'No me interesa' }))
      expect(onSwipeLeft).toHaveBeenCalledWith('e1')
    })
  })

  describe('carta de fondo (stackIndex > 0)', () => {
    it('no muestra el botón de guardar en cartas de fondo', () => {
      renderCard({}, 1)
      expect(screen.queryByRole('button', { name: /guardar evento/i })).not.toBeInTheDocument()
    })

    it('no muestra botones de like/nope en cartas de fondo', () => {
      renderCard({}, 1)
      expect(screen.queryByRole('button', { name: /me interesa/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /no me interesa/i })).not.toBeInTheDocument()
    })
  })

  describe('media', () => {
    it('renderiza imagen cuando no hay videoUrl', () => {
      renderCard({ videoUrl: null })
      const img = screen.getByRole('img', { name: 'Noche de Jazz' })
      expect(img).toHaveAttribute('src', 'https://example.com/jazz.jpg')
    })

    it('renderiza video cuando hay videoUrl', () => {
      renderCard({ videoUrl: 'https://example.com/jazz.mp4' })
      const video = document.querySelector('video')
      expect(video).toBeInTheDocument()
      expect(video).toHaveAttribute('src', 'https://example.com/jazz.mp4')
    })
  })

  describe('sitio web', () => {
    it('muestra enlace al sitio web si existe websiteUrl', () => {
      renderCard({ websiteUrl: 'https://barcentral.cl' })
      expect(screen.getByRole('link', { name: /ver sitio web/i })).toHaveAttribute(
        'href',
        'https://barcentral.cl',
      )
    })

    it('no muestra enlace si websiteUrl es null', () => {
      renderCard({ websiteUrl: null })
      expect(screen.queryByRole('link', { name: /ver sitio web/i })).not.toBeInTheDocument()
    })
  })
})
