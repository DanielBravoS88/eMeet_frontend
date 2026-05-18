import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OnboardingOverlay from '@/src/components/OnboardingOverlay'

const mockUsePathname = jest.fn(() => '/')
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

function renderOverlay() {
  return render(<OnboardingOverlay />)
}

beforeEach(() => {
  localStorage.clear()
  mockUsePathname.mockReturnValue('/')
})

describe('OnboardingOverlay', () => {
  describe('visibilidad', () => {
    it('se muestra en la primera visita', () => {
      renderOverlay()
      expect(screen.getByText('Bienvenido a eMeet')).toBeInTheDocument()
    })

    it('no se muestra si ya fue visto', () => {
      localStorage.setItem('emeet-onboarding-done', '1')
      renderOverlay()
      expect(screen.queryByText('Bienvenido a eMeet')).not.toBeInTheDocument()
    })

    it('no se muestra en /auth', () => {
      mockUsePathname.mockReturnValue('/auth')
      renderOverlay()
      expect(screen.queryByText('Bienvenido a eMeet')).not.toBeInTheDocument()
    })

    it('no se muestra en /admin', () => {
      mockUsePathname.mockReturnValue('/admin/users')
      renderOverlay()
      expect(screen.queryByText('Bienvenido a eMeet')).not.toBeInTheDocument()
    })
  })

  describe('navegación entre pasos', () => {
    it('empieza en el paso 1', () => {
      renderOverlay()
      expect(screen.getByText('Bienvenido a eMeet')).toBeInTheDocument()
    })

    it('avanza al paso 2 al hacer clic en Siguiente', async () => {
      const user = userEvent.setup()
      renderOverlay()
      await user.click(screen.getByRole('button', { name: /siguiente/i }))
      expect(screen.getByText('Activa tu ubicación')).toBeInTheDocument()
    })

    it('avanza al paso 3 desde el paso 2', async () => {
      const user = userEvent.setup()
      renderOverlay()
      await user.click(screen.getByRole('button', { name: /siguiente/i }))
      await user.click(screen.getByRole('button', { name: /siguiente/i }))
      expect(screen.getByText('Swipe y conéctate')).toBeInTheDocument()
    })

    it('retrocede al paso 1 desde el paso 2 con Atrás', async () => {
      const user = userEvent.setup()
      renderOverlay()
      await user.click(screen.getByRole('button', { name: /siguiente/i }))
      await user.click(screen.getByRole('button', { name: /atrás/i }))
      expect(screen.getByText('Bienvenido a eMeet')).toBeInTheDocument()
    })

    it('muestra "Saltar" solo en el paso 1', async () => {
      const user = userEvent.setup()
      renderOverlay()
      expect(screen.getByRole('button', { name: /saltar/i })).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /siguiente/i }))
      expect(screen.queryByRole('button', { name: /saltar/i })).not.toBeInTheDocument()
    })

    it('muestra "¡Empezar!" en el último paso', async () => {
      const user = userEvent.setup()
      renderOverlay()
      await user.click(screen.getByRole('button', { name: /siguiente/i }))
      await user.click(screen.getByRole('button', { name: /siguiente/i }))
      expect(screen.getByRole('button', { name: /empezar/i })).toBeInTheDocument()
    })

    it('los dots son clicables y navegan al paso correcto', async () => {
      const user = userEvent.setup()
      renderOverlay()
      const dots = screen.getAllByRole('button').filter((b) => !b.textContent)
      await user.click(dots[2])
      expect(screen.getByText('Swipe y conéctate')).toBeInTheDocument()
    })
  })

  describe('cierre y persistencia', () => {
    it('Saltar cierra el overlay', async () => {
      const user = userEvent.setup()
      renderOverlay()
      await user.click(screen.getByRole('button', { name: /saltar/i }))
      await waitFor(() => {
        expect(screen.queryByText('Bienvenido a eMeet')).not.toBeInTheDocument()
      })
    })

    it('Saltar guarda la clave en localStorage', async () => {
      const user = userEvent.setup()
      renderOverlay()
      await user.click(screen.getByRole('button', { name: /saltar/i }))
      await waitFor(() => {
        expect(localStorage.getItem('emeet-onboarding-done')).toBe('1')
      })
    })

    it('¡Empezar! cierra el overlay y guarda localStorage', async () => {
      const user = userEvent.setup()
      renderOverlay()
      await user.click(screen.getByRole('button', { name: /siguiente/i }))
      await user.click(screen.getByRole('button', { name: /siguiente/i }))
      await user.click(screen.getByRole('button', { name: /empezar/i }))
      await waitFor(() => {
        expect(localStorage.getItem('emeet-onboarding-done')).toBe('1')
        expect(screen.queryByText('Swipe y conéctate')).not.toBeInTheDocument()
      })
    })
  })
})
