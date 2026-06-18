import { render, screen } from '@testing-library/react'

const mockUseAuth = jest.fn()
jest.mock('@/src/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

import Topbar from '@/src/components/admin/Topbar'

describe('Topbar (admin)', () => {
  it('muestra las iniciales y el nombre del usuario', () => {
    mockUseAuth.mockReturnValue({ user: { name: 'Ana Pérez' } })
    render(<Topbar />)
    expect(screen.getByText('AP')).toBeInTheDocument()
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument()
  })

  it('usa "A" y "Admin" como fallback cuando no hay usuario', () => {
    mockUseAuth.mockReturnValue({ user: null })
    render(<Topbar />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('toma sólo las dos primeras iniciales de un nombre largo', () => {
    mockUseAuth.mockReturnValue({ user: { name: 'Juan Carlos Soto Vega' } })
    render(<Topbar />)
    expect(screen.getByText('JC')).toBeInTheDocument()
  })

  it('renderiza el campo de búsqueda', () => {
    mockUseAuth.mockReturnValue({ user: { name: 'Ana' } })
    render(<Topbar />)
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument()
  })
})
