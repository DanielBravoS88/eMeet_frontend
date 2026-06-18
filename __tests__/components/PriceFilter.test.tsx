import { render, screen, fireEvent } from '@testing-library/react'
import PriceFilter from '@/src/components/PriceFilter'

describe('PriceFilter', () => {
  it('renderiza las 3 opciones de precio', () => {
    render(<PriceFilter selected="any" onChange={jest.fn()} />)
    expect(screen.getByText('Cualquiera')).toBeInTheDocument()
    expect(screen.getByText('Gratis')).toBeInTheDocument()
    expect(screen.getByText('Pagado')).toBeInTheDocument()
  })

  it('llama onChange con el modo elegido', () => {
    const onChange = jest.fn()
    render(<PriceFilter selected="any" onChange={onChange} />)
    fireEvent.click(screen.getByText('Gratis'))
    expect(onChange).toHaveBeenCalledWith('free')
  })

  it('marca la opción seleccionada', () => {
    render(<PriceFilter selected="paid" onChange={jest.fn()} />)
    const btn = screen.getByText('Pagado').closest('button')
    expect(btn?.className).toMatch(/bg-primary/)
  })
})
