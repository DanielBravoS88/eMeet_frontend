import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignUpForm from '@/src/components/SignUpForm'

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockPush = jest.fn()
const mockGet = jest.fn(() => null)

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockGet }),
}))

const mockRegister = jest.fn()

jest.mock('@/src/context/AuthContext', () => ({
  useAuth: () => ({ register: mockRegister }),
}))

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  mockGet.mockReturnValue(null)
  mockRegister.mockResolvedValue({ needsEmailVerification: false })
})

function renderForm() {
  return render(<SignUpForm />)
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('Juan Pérez'), 'Carlos Test')
  await user.type(screen.getByPlaceholderText('tu@email.com'), 'carlos@emeet.com')
  await user.type(screen.getByLabelText('Contraseña'), 'Abc123!!')
  await user.type(screen.getByLabelText('Confirmar contraseña'), 'Abc123!!')
  await user.click(screen.getByRole('button', { name: /crear cuenta/i }))
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('SignUpForm', () => {
  describe('renderizado inicial', () => {
    it('muestra el título y la descripción de registro único', () => {
      renderForm()
      expect(screen.getByText('Crea tu cuenta')).toBeInTheDocument()
      expect(screen.getByText(/activar el modo creador desde tu perfil/i)).toBeInTheDocument()
    })

    it('no muestra selector de tipo de cuenta ni campos de negocio', () => {
      renderForm()
      expect(screen.queryByRole('button', { name: /soy locatario/i })).not.toBeInTheDocument()
      expect(screen.queryByPlaceholderText('Mi Restaurante')).not.toBeInTheDocument()
      expect(screen.getByPlaceholderText('Juan Pérez')).toBeInTheDocument()
    })
  })

  describe('validaciones', () => {
    it('muestra error si las contraseñas no coinciden', async () => {
      const user = userEvent.setup()
      renderForm()

      await user.type(screen.getByPlaceholderText('Juan Pérez'), 'Test')
      await user.type(screen.getByPlaceholderText('tu@email.com'), 'test@emeet.com')
      await user.type(screen.getByLabelText('Contraseña'), 'Abc123!!')
      await user.type(screen.getByLabelText('Confirmar contraseña'), 'OtraPass!!')
      await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

      await waitFor(() => {
        const msgs = screen.getAllByText('Las contraseñas no coinciden')
        expect(msgs.length).toBeGreaterThan(0)
      })
      expect(mockRegister).not.toHaveBeenCalled()
    })

    it('muestra error si la contraseña tiene menos de 6 caracteres', async () => {
      const user = userEvent.setup()
      renderForm()

      await user.type(screen.getByPlaceholderText('Juan Pérez'), 'Test')
      await user.type(screen.getByPlaceholderText('tu@email.com'), 'test@emeet.com')
      await user.type(screen.getByLabelText('Contraseña'), '123')
      await user.type(screen.getByLabelText('Confirmar contraseña'), '123')
      await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

      await waitFor(() =>
        expect(screen.getByText('La contraseña debe tener al menos 6 caracteres')).toBeInTheDocument(),
      )
      expect(mockRegister).not.toHaveBeenCalled()
    })
  })

  describe('registro exitoso', () => {
    it('llama a register con nombre, email y contraseña', async () => {
      const user = userEvent.setup()
      renderForm()
      await fillAndSubmit(user)

      await waitFor(() =>
        expect(mockRegister).toHaveBeenCalledWith('Carlos Test', 'carlos@emeet.com', 'Abc123!!'),
      )
    })

    it('redirige a / sin needsEmailVerification', async () => {
      const user = userEvent.setup()
      renderForm()
      await fillAndSubmit(user)

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'))
    })

    it('redirige a verify-email si needsEmailVerification es true', async () => {
      mockRegister.mockResolvedValue({ needsEmailVerification: true, email: 'carlos@emeet.com' })
      const user = userEvent.setup()
      renderForm()
      await fillAndSubmit(user)

      await waitFor(() =>
        expect(mockPush).toHaveBeenCalledWith(
          '/auth/verify-email?email=carlos%40emeet.com',
        ),
      )
    })

    it('respeta el parámetro next al terminar el registro', async () => {
      mockGet.mockReturnValue('/mi-perfil')
      const user = userEvent.setup()
      renderForm()
      await fillAndSubmit(user)

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/mi-perfil'))
    })
  })

  describe('barra de fortaleza de contraseña', () => {
    it('no muestra la barra cuando el campo está vacío', () => {
      renderForm()
      expect(screen.queryByText('Muy débil')).not.toBeInTheDocument()
    })

    it('muestra Fuerte para una contraseña con todos los criterios', async () => {
      const user = userEvent.setup()
      renderForm()
      // 8+ chars + mayúscula + número + especial = score 4 → Fuerte
      await user.type(screen.getByLabelText('Contraseña'), 'Abcde123!')
      expect(screen.getByText('Fuerte')).toBeInTheDocument()
    })
  })

  describe('error de registro', () => {
    it('muestra el error si register rechaza la promesa', async () => {
      mockRegister.mockRejectedValue(new Error('Email ya registrado'))
      const user = userEvent.setup()
      renderForm()
      await fillAndSubmit(user)

      await waitFor(() => expect(screen.getByText('Email ya registrado')).toBeInTheDocument())
      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})
