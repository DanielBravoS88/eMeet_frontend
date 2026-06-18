import { render, screen } from '@testing-library/react'
import { Users } from 'lucide-react'
import KpiCard, { KpiCardSkeleton } from '@/src/components/admin/KpiCard'

describe('KpiCard', () => {
  it('muestra label y valor', () => {
    render(<KpiCard label="Usuarios totales" value="1.234" icon={Users} />)
    expect(screen.getByText('Usuarios totales')).toBeInTheDocument()
    expect(screen.getByText('1.234')).toBeInTheDocument()
  })

  it('muestra el skeleton cuando loading=true', () => {
    const { container } = render(<KpiCard label="x" value="0" icon={Users} loading />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    expect(screen.queryByText('x')).not.toBeInTheDocument()
  })

  it('muestra cambio positivo con su porcentaje', () => {
    render(<KpiCard label="Eventos" value="50" change={12.5} icon={Users} />)
    expect(screen.getByText('12.5%')).toBeInTheDocument()
  })

  it('muestra cambio negativo en valor absoluto', () => {
    render(<KpiCard label="Reportes" value="3" change={-8.2} icon={Users} />)
    expect(screen.getByText('8.2%')).toBeInTheDocument()
  })

  it('muestra cambio neutro (0%)', () => {
    render(<KpiCard label="Comunidades" value="10" change={0} icon={Users} />)
    expect(screen.getByText('0.0%')).toBeInTheDocument()
  })

  it('KpiCardSkeleton renderiza placeholders animados', () => {
    const { container } = render(<KpiCardSkeleton />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})
