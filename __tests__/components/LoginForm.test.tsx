import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from '@/src/components/LoginForm'

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockPush = jest.fn()
const mockGet = jest.fn(() => null)

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockGet }),
}))

const mockLogin = jest.fn()

jest.mock('@/src/context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}))

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  mockGet.mockReturnValue(null)
})

function renderForm() {
  return render(<LoginForm />)
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('LoginForm', () => {
  describe('renderizado', () => {
    it('muestra el título y campos del formulario', () => {
      renderForm()
      expect(screen.getByText('Bienvenido de regreso')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /inicia sesión/i })).toBeInTheDocument()
    })

    it('el campo de contraseña empieza oculto', () => {
      renderForm()
      expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'password')
    })

    it('muestra la contraseña al hacer click en el ojo', async () => {
      const user = userEvent.setup()
      renderForm()
      const toggle = screen.getByRole('button', { name: '' })
      await user.click(toggle)
      expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'text')
    })
  })

  describe('login exitoso', () => {
    it('redirige a / cuando el rol es user', async () => {
      mockLogin.mockResolvedValue('user')
      const user = userEvent.setup()
      renderForm()

      await user.type(screen.getByPlaceholderText('tu@email.com'), 'user@emeet.com')
      await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
      await user.click(screen.getByRole('button', { name: /inicia sesión/i }))

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'))
    })

    it('redirige a / para roles no-admin (incluye legacy locatario)', async () => {
      // El rol 'locatario' fue eliminado; estas cuentas ahora son 'user' y van al home.
      mockLogin.mockResolvedValue('locatario')
      const user = userEvent.setup()
      renderForm()

      await user.type(screen.getByPlaceholderText('tu@email.com'), 'loc@emeet.com')
      await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
      await user.click(screen.getByRole('button', { name: /inicia sesión/i }))

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'))
    })

    it('redirige a /admin cuando el rol es admin', async () => {
      mockLogin.mockResolvedValue('admin')
      const user = userEvent.setup()
      renderForm()

      await user.type(screen.getByPlaceholderText('tu@email.com'), 'admin@emeet.com')
      await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
      await user.click(screen.getByRole('button', { name: /inicia sesión/i }))

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin'))
    })

    it('respeta el parámetro next si empieza con /', async () => {
      mockLogin.mockResolvedValue('user')
      mockGet.mockReturnValue('/eventos')
      const user = userEvent.setup()
      renderForm()

      await user.type(screen.getByPlaceholderText('tu@email.com'), 'user@emeet.com')
      await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
      await user.click(screen.getByRole('button', { name: /inicia sesión/i }))

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/eventos'))
    })

    it('ignora next si no empieza con /', async () => {
      mockLogin.mockResolvedValue('user')
      mockGet.mockReturnValue('https://malicious.com')
      const user = userEvent.setup()
      renderForm()

      await user.type(screen.getByPlaceholderText('tu@email.com'), 'user@emeet.com')
      await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
      await user.click(screen.getByRole('button', { name: /inicia sesión/i }))

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'))
    })
  })

  describe('login fallido', () => {
    it('muestra el mensaje de error cuando login falla', async () => {
      mockLogin.mockRejectedValue(new Error('Credenciales inválidas'))
      const user = userEvent.setup()
      renderForm()

      await user.type(screen.getByPlaceholderText('tu@email.com'), 'user@emeet.com')
      await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpass')
      await user.click(screen.getByRole('button', { name: /inicia sesión/i }))

      await waitFor(() => expect(screen.getByText('Correo o contraseña incorrectos.')).toBeInTheDocument())
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('muestra mensaje genérico si el error no es un Error', async () => {
      mockLogin.mockRejectedValue('algo raro')
      const user = userEvent.setup()
      renderForm()

      await user.type(screen.getByPlaceholderText('tu@email.com'), 'user@emeet.com')
      await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpass')
      await user.click(screen.getByRole('button', { name: /inicia sesión/i }))

      await waitFor(() =>
        expect(screen.getByText('No pudimos iniciar sesión. Intenta nuevamente en unos segundos.')).toBeInTheDocument(),
      )
    })

    it('deshabilita el botón mientras carga', async () => {
      let resolve!: (v: string) => void
      mockLogin.mockReturnValue(new Promise<string>((r) => { resolve = r }))
      const user = userEvent.setup()
      renderForm()

      await user.type(screen.getByPlaceholderText('tu@email.com'), 'user@emeet.com')
      await user.type(screen.getByPlaceholderText('••••••••'), 'password123')

      const btn = screen.getByRole('button', { name: /inicia sesión/i })
      await user.click(btn)

      await waitFor(() => expect(btn).toBeDisabled())

      resolve('user')
      await waitFor(() => expect(btn).not.toBeDisabled())
    })
  })
})
