import { render, screen } from '@testing-library/react'
import { EventPreviewCard } from '@/src/components/EventPreviewCard'
import type { Event } from '@/src/types'

function makeEvent(overrides?: Partial<Event>): Event {
  return {
    id: 'e1',
    title: 'Noche de Jazz',
    description: 'Jazz en vivo',
    category: 'musica',
    date: '2025-06-15T21:00:00',
    location: 'Bar Central',
    address: 'Bellavista 123',
    distance: 1.2,
    price: 5000,
    imageUrl: 'https://example.com/jazz.jpg',
    videoUrl: null,
    audioPreviewUrl: null,
    audioTrackId: null,
    websiteUrl: null,
    organizerName: 'Jazz Productions',
    organizerAvatar: 'https://example.com/a.jpg',
    attendees: 30,
    capacity: 100,
    tags: [],
    isLiked: false,
    isSaved: false,
    rating: 4.5,
    isOpen: true,
    lat: -33.4,
    lng: -70.6,
    ...overrides,
  } as Event
}

describe('EventPreviewCard', () => {
  it('muestra título, descripción y organizador', () => {
    render(<EventPreviewCard event={makeEvent()} />)
    expect(screen.getByText('Noche de Jazz')).toBeInTheDocument()
    expect(screen.getByText('Jazz en vivo')).toBeInTheDocument()
    expect(screen.getByText('Jazz Productions')).toBeInTheDocument()
    expect(screen.getByText('Bar Central')).toBeInTheDocument()
  })

  it('renderiza imagen cuando no hay video', () => {
    render(<EventPreviewCard event={makeEvent({ videoUrl: null })} />)
    const img = screen.getByAltText('Noche de Jazz') as HTMLImageElement
    expect(img.tagName).toBe('IMG')
  })

  it('renderiza video cuando hay videoUrl', () => {
    const { container } = render(
      <EventPreviewCard event={makeEvent({ videoUrl: 'https://example.com/v.mp4' })} />,
    )
    expect(container.querySelector('video')).toBeInTheDocument()
  })

  it('muestra "Gratis" cuando el precio es null', () => {
    render(<EventPreviewCard event={makeEvent({ price: null })} />)
    expect(screen.getByText('Gratis')).toBeInTheDocument()
  })

  it('muestra el contador de asistentes cuando hay capacidad', () => {
    render(<EventPreviewCard event={makeEvent({ attendees: 30, capacity: 100 })} />)
    expect(screen.getByText('30/100 asistentes')).toBeInTheDocument()
  })

  it('muestra "Fecha por definir" cuando no hay fecha', () => {
    render(<EventPreviewCard event={makeEvent({ date: null as unknown as string })} />)
    expect(screen.getByText('Fecha por definir')).toBeInTheDocument()
  })
})
