import { render, screen, fireEvent } from '@testing-library/react'
import DateRangeFilter from '@/src/components/DateRangeFilter'

describe('DateRangeFilter', () => {
  it('renderiza las 4 opciones de rango', () => {
    render(<DateRangeFilter selected="any" onChange={jest.fn()} />)
    expect(screen.getByText('Cualquier momento')).toBeInTheDocument()
    expect(screen.getByText('Hoy')).toBeInTheDocument()
    expect(screen.getByText('Este fin de semana')).toBeInTheDocument()
    expect(screen.getByText('Próximos 7 días')).toBeInTheDocument()
  })

  it('llama onChange con el modo elegido al hacer click', () => {
    const onChange = jest.fn()
    render(<DateRangeFilter selected="any" onChange={onChange} />)
    fireEvent.click(screen.getByText('Hoy'))
    expect(onChange).toHaveBeenCalledWith('today')
  })

  it('marca visualmente la opción seleccionada', () => {
    render(<DateRangeFilter selected="weekend" onChange={jest.fn()} />)
    const selected = screen.getByText('Este fin de semana').closest('button')
    expect(selected?.className).toMatch(/bg-primary/)
  })
})
