import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EventsTable, { EventsTableSkeleton } from '@/src/components/admin/EventsTable'
import type { AdminEvent } from '@/src/components/admin/EventsTable'

const MOCK_EVENTS: AdminEvent[] = [
  {
    id: 'event-1',
    title: 'Noche de Jazz',
    category: 'musica',
    organizerName: 'Bar Central',
    status: 'live',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // hace 30 min
  },
  {
    id: 'event-2',
    title: 'Feria Gastronómica',
    category: 'gastronomia',
    organizerName: 'Restaurante El Patio',
    status: 'draft',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // hace 3h
  },
  {
    id: 'event-3',
    title: 'Evento Flagged',
    category: 'arte',
    organizerName: 'Galería Norte',
    status: 'flagged',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(), // hace 25h
  },
]

describe('EventsTable', () => {
  describe('renderizado', () => {
    it('muestra mensaje vacío cuando no hay eventos', () => {
      render(<EventsTable events={[]} />)
      expect(screen.getByText(/sin eventos/i)).toBeInTheDocument()
    })

    it('muestra el skeleton cuando loading=true', () => {
      render(<EventsTable events={[]} loading={true} />)
      // El skeleton renderiza divs con animate-pulse
      const pulseElements = document.querySelectorAll('.animate-pulse')
      expect(pulseElements.length).toBeGreaterThan(0)
    })

    it('renderiza la lista de eventos correctamente', () => {
      render(<EventsTable events={MOCK_EVENTS} />)
      expect(screen.getByText('Noche de Jazz')).toBeInTheDocument()
      expect(screen.getByText('Feria Gastronómica')).toBeInTheDocument()
      expect(screen.getByText('Evento Flagged')).toBeInTheDocument()
    })

    it('muestra el nombre del organizador', () => {
      render(<EventsTable events={MOCK_EVENTS} />)
      expect(screen.getByText('Bar Central')).toBeInTheDocument()
    })

    it('muestra la categoría traducida', () => {
      render(<EventsTable events={MOCK_EVENTS} />)
      expect(screen.getByText('Música')).toBeInTheDocument()
      expect(screen.getByText('Gastronomía')).toBeInTheDocument()
    })

    it('muestra los badges de estado correctamente', () => {
      render(<EventsTable events={MOCK_EVENTS} />)
      expect(screen.getByText('Live')).toBeInTheDocument()
      expect(screen.getByText('Draft')).toBeInTheDocument()
      expect(screen.getByText('Flagged')).toBeInTheDocument()
    })

    it('no muestra columna Acciones si no se pasa onDelete', () => {
      render(<EventsTable events={MOCK_EVENTS} />)
      expect(screen.queryByText('Acciones')).not.toBeInTheDocument()
    })

    it('muestra columna Acciones cuando se pasa onDelete', () => {
      render(<EventsTable events={MOCK_EVENTS} onDelete={jest.fn()} />)
      expect(screen.getByText('Acciones')).toBeInTheDocument()
    })
  })

  describe('flujo de eliminación', () => {
    it('muestra botones de confirmación al hacer clic en Eliminar', async () => {
      const user = userEvent.setup()
      render(<EventsTable events={MOCK_EVENTS} onDelete={jest.fn()} />)
      const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i })
      await user.click(deleteButtons[0])
      expect(screen.getByText('¿Eliminar?')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sí/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument()
    })

    it('cancela la eliminación al hacer clic en No', async () => {
      const user = userEvent.setup()
      render(<EventsTable events={MOCK_EVENTS} onDelete={jest.fn()} />)
      const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i })
      await user.click(deleteButtons[0])
      await user.click(screen.getByRole('button', { name: /no/i }))
      expect(screen.queryByText('¿Eliminar?')).not.toBeInTheDocument()
    })

    it('llama a onDelete con el id correcto al confirmar', async () => {
      const user = userEvent.setup()
      const mockDelete = jest.fn().mockResolvedValue(undefined)
      render(<EventsTable events={MOCK_EVENTS} onDelete={mockDelete} />)
      const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i })
      await user.click(deleteButtons[0])
      await user.click(screen.getByRole('button', { name: /sí/i }))
      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith('event-1')
      })
    })

    it('no llama onDelete al cancelar', async () => {
      const user = userEvent.setup()
      const mockDelete = jest.fn()
      render(<EventsTable events={MOCK_EVENTS} onDelete={mockDelete} />)
      const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i })
      await user.click(deleteButtons[0])
      await user.click(screen.getByRole('button', { name: /no/i }))
      expect(mockDelete).not.toHaveBeenCalled()
    })
  })

  describe('EventsTableSkeleton', () => {
    it('renderiza elementos de skeleton', () => {
      render(<EventsTableSkeleton />)
      const pulseElements = document.querySelectorAll('.animate-pulse')
      expect(pulseElements.length).toBeGreaterThan(0)
    })
  })
})
