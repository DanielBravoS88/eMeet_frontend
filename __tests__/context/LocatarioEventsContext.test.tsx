import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LocatarioEventsProvider, useLocatarioEvents } from '@/src/context/LocatarioEventsContext'

// ── Mocks ──────────────────────────────────────────────────────────────────────

// Sobreescribir el mock global de supabase para este test: necesitamos hasSupabaseEnv: true
jest.mock('@/src/lib/supabase', () => ({
  hasSupabaseEnv: true,
  getSupabaseBrowserClient: jest.fn(() => ({
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  })),
}))

const mockGetAccessToken = jest.fn()
const mockGetSession = jest.fn()

jest.mock('@/src/lib/authSession', () => ({
  getSupabaseAccessToken: () => mockGetAccessToken(),
  getSupabaseAuthSession: () => mockGetSession(),
}))

// global.fetch ya está mockeado en jest.setup.ts

// ── Fixtures ───────────────────────────────────────────────────────────────────

const MOCK_ROW = {
  id: 'ev1',
  title: 'Noche de Jazz',
  description: 'Jazz en vivo',
  category: 'musica',
  event_date: '2025-06-15T21:00:00',
  address: 'Bellavista 123',
  price: 5000,
  image_url: null,
  video_url: null,
  audio_preview_url: null,
  organizer_name: 'Bar Central',
  organizer_avatar: null,
  lat: -33.4,
  lng: -70.6,
}

// ── Consumers de prueba ────────────────────────────────────────────────────────

function StatusConsumer() {
  const { locatarioEvents, publicLocatarioEvents, isLoading } = useLocatarioEvents()
  return (
    <div>
      <span data-testid="loading">{isLoading ? 'cargando' : 'listo'}</span>
      <span data-testid="public-count">{publicLocatarioEvents.length}</span>
      <span data-testid="private-count">{locatarioEvents.length}</span>
      {publicLocatarioEvents.map((e) => (
        <div key={e.id} data-testid="event-title">{e.title}</div>
      ))}
    </div>
  )
}

function CreateConsumer() {
  const { createLocatarioEvent, locatarioEvents } = useLocatarioEvents()
  return (
    <div>
      <span data-testid="count">{locatarioEvents.length}</span>
      <button
        onClick={() =>
          createLocatarioEvent({
            title: 'Nuevo Evento',
            description: 'Desc',
            category: 'musica',
            date: '2025-07-01T20:00:00',
            address: 'Lastarria 10',
            price: null,
            organizerName: 'Yo',
            organizerAvatar: '',
          })
        }
      >
        Crear
      </button>
    </div>
  )
}

function DeleteConsumer() {
  const { removeLocatarioEvent, locatarioEvents, publicLocatarioEvents } = useLocatarioEvents()
  return (
    <div>
      <span data-testid="private-count">{locatarioEvents.length}</span>
      <span data-testid="public-count">{publicLocatarioEvents.length}</span>
      <button onClick={() => removeLocatarioEvent('ev1')}>Eliminar</button>
    </div>
  )
}

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  mockGetSession.mockResolvedValue(null)
  mockGetAccessToken.mockResolvedValue(null)

  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue([]),
  })
})

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('LocatarioEventsContext', () => {
  describe('useLocatarioEvents fuera del provider', () => {
    it('lanza error si se usa fuera del provider', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => render(<StatusConsumer />)).toThrow(
        'useLocatarioEvents debe usarse dentro de LocatarioEventsProvider',
      )
      spy.mockRestore()
    })
  })

  describe('carga inicial sin sesión', () => {
    it('termina en estado listo con listas vacías si no hay sesión', async () => {
      render(
        <LocatarioEventsProvider>
          <StatusConsumer />
        </LocatarioEventsProvider>,
      )

      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('listo'))
      expect(screen.getByTestId('public-count')).toHaveTextContent('0')
      expect(screen.getByTestId('private-count')).toHaveTextContent('0')
    })
  })

  describe('carga inicial con sesión', () => {
    it('carga eventos públicos cuando fetch devuelve filas', async () => {
      mockGetSession.mockResolvedValue({ access_token: 'token-123' })
      mockGetAccessToken.mockResolvedValue('token-123')

      let callCount = 0
      ;(global.fetch as jest.Mock).mockImplementation(() => {
        callCount++
        return Promise.resolve({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue([MOCK_ROW]),
        })
      })

      render(
        <LocatarioEventsProvider>
          <StatusConsumer />
        </LocatarioEventsProvider>,
      )

      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('listo'))
      expect(screen.getByTestId('public-count')).toHaveTextContent('1')
      expect(screen.getByTestId('event-title')).toHaveTextContent('Noche de Jazz')
    })
  })

  describe('createLocatarioEvent', () => {
    it('añade el nuevo evento a locatarioEvents', async () => {
      mockGetSession.mockResolvedValue({ access_token: 'token-123' })
      mockGetAccessToken.mockResolvedValue('token-123')

      const CREATED_ROW = { ...MOCK_ROW, id: 'ev-new', title: 'Nuevo Evento' }

      // Primera carga (público/privado) vacía; POST devuelve la fila creada
      let callCount = 0
      ;(global.fetch as jest.Mock).mockImplementation(() => {
        callCount++
        const data = callCount <= 2 ? [] : CREATED_ROW
        return Promise.resolve({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue(data),
        })
      })

      const user = userEvent.setup()
      render(
        <LocatarioEventsProvider>
          <CreateConsumer />
        </LocatarioEventsProvider>,
      )

      await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('0'))

      await user.click(screen.getByRole('button', { name: 'Crear' }))

      await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'))
    })

    it('lanza error "Debes iniciar sesión" si no hay sesión activa', async () => {
      mockGetSession.mockResolvedValue(null)

      let caughtError: Error | null = null

      function ThrowConsumer() {
        const { createLocatarioEvent } = useLocatarioEvents()
        return (
          <button
            onClick={() =>
              createLocatarioEvent({
                title: 'X',
                description: '',
                category: 'musica',
                date: '',
                address: '',
                price: null,
                organizerName: '',
                organizerAvatar: '',
              }).catch((e: Error) => {
                caughtError = e
              })
            }
          >
            Crear
          </button>
        )
      }

      const user = userEvent.setup()
      render(
        <LocatarioEventsProvider>
          <ThrowConsumer />
        </LocatarioEventsProvider>,
      )

      await user.click(screen.getByRole('button', { name: 'Crear' }))

      await waitFor(() => expect(caughtError?.message).toContain('Debes iniciar sesión'))
    })
  })

  describe('removeLocatarioEvent', () => {
    it('elimina el evento del estado local antes de que el fetch termine', async () => {
      mockGetSession.mockResolvedValue({ access_token: 'token-123' })
      mockGetAccessToken.mockResolvedValue('token-123')

      let callCount = 0
      ;(global.fetch as jest.Mock).mockImplementation(() => {
        callCount++
        if (callCount <= 2) {
          // Carga inicial: público y privado con 1 evento cada uno
          return Promise.resolve({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue([MOCK_ROW]),
          })
        }
        // DELETE
        return Promise.resolve({ ok: true, status: 204, json: jest.fn().mockResolvedValue(undefined) })
      })

      const user = userEvent.setup()
      render(
        <LocatarioEventsProvider>
          <DeleteConsumer />
        </LocatarioEventsProvider>,
      )

      await waitFor(() => expect(screen.getByTestId('public-count')).toHaveTextContent('1'))

      await user.click(screen.getByRole('button', { name: 'Eliminar' }))

      await waitFor(() => expect(screen.getByTestId('public-count')).toHaveTextContent('0'))
    })
  })
})
