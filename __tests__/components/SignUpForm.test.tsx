import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

async function fillAndSubmitUser(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('Juan Pérez'), 'Carlos Test')
  await user.type(screen.getByPlaceholderText('tu@email.com'), 'carlos@emeet.com')
  await user.type(screen.getByLabelText('Contraseña'), 'Abc123!!')
  await user.type(screen.getByLabelText('Confirmar contraseña'), 'Abc123!!')
  await user.click(screen.getByRole('button', { name: /crear cuenta/i }))
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('SignUpForm', () => {
  describe('renderizado inicial', () => {
    it('muestra el título y el selector de tipo de cuenta', () => {
      renderForm()
      expect(screen.getByText('Crea tu cuenta')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /usuario regular/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /soy locatario/i })).toBeInTheDocument()
    })

    it('empieza en modo usuario (campo nombre visible, no nombre de negocio)', () => {
      renderForm()
      expect(screen.getByPlaceholderText('Juan Pérez')).toBeInTheDocument()
      expect(screen.queryByPlaceholderText('Mi Restaurante')).not.toBeInTheDocument()
    })
  })

  describe('cambio de rol', () => {
    it('al seleccionar Locatario muestra campos de negocio', async () => {
      const user = userEvent.setup()
      renderForm()

      await user.click(screen.getByRole('button', { name: /soy locatario/i }))

      expect(screen.getByPlaceholderText('Mi Restaurante')).toBeInTheDocument()
      expect(screen.queryByPlaceholderText('Juan Pérez')).not.toBeInTheDocument()
    })

    it('al volver a Usuario oculta campos de negocio', async () => {
      const user = userEvent.setup()
      renderForm()

      await user.click(screen.getByRole('button', { name: /soy locatario/i }))
      await user.click(screen.getByRole('button', { name: /usuario regular/i }))

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

    it('exige nombre de negocio para locatario', async () => {
      const user = userEvent.setup()
      renderForm()

      await user.click(screen.getByRole('button', { name: /soy locatario/i }))
      await user.type(screen.getByPlaceholderText('tu@email.com'), 'loc@emeet.com')
      await user.type(screen.getByLabelText('Contraseña'), 'Abc123!!')
      await user.type(screen.getByLabelText('Confirmar contraseña'), 'Abc123!!')
      // fireEvent.submit bypasses HTML5 required-field validation so the JS handler runs
      fireEvent.submit(screen.getByRole('button', { name: /crear cuenta/i }).closest('form')!)

      await waitFor(() =>
        expect(screen.getByText('Ingresa el nombre del negocio')).toBeInTheDocument(),
      )
    })
  })

  describe('registro exitoso', () => {
    it('redirige a / para usuario regular sin needsEmailVerification', async () => {
      const user = userEvent.setup()
      renderForm()
      await fillAndSubmitUser(user)

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'))
    })

    it('redirige a /locatario para locatario sin needsEmailVerification', async () => {
      const user = userEvent.setup()
      renderForm()

      await user.click(screen.getByRole('button', { name: /soy locatario/i }))
      await user.type(screen.getByPlaceholderText('Mi Restaurante'), 'Bar Central')
      await user.type(screen.getByPlaceholderText('tu@email.com'), 'loc@emeet.com')
      await user.type(screen.getByLabelText('Contraseña'), 'Abc123!!')
      await user.type(screen.getByLabelText('Confirmar contraseña'), 'Abc123!!')
      await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/locatario'))
    })

    it('redirige a verify-email si needsEmailVerification es true', async () => {
      mockRegister.mockResolvedValue({ needsEmailVerification: true, email: 'carlos@emeet.com' })
      const user = userEvent.setup()
      renderForm()
      await fillAndSubmitUser(user)

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
      await fillAndSubmitUser(user)

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
      await fillAndSubmitUser(user)

      await waitFor(() => expect(screen.getByText('Email ya registrado')).toBeInTheDocument())
      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})
