import { render, screen, fireEvent } from '@testing-library/react'
import DistanceFilter from '@/src/components/DistanceFilter'

describe('DistanceFilter', () => {
  it('renderiza las opciones de distancia', () => {
    render(<DistanceFilter selectedKm={1} onChange={jest.fn()} />)
    expect(screen.getByText('1 km')).toBeInTheDocument()
    expect(screen.getByText('3 km')).toBeInTheDocument()
    expect(screen.getByText('5 km')).toBeInTheDocument()
  })

  it('llama onChange con los km elegidos', () => {
    const onChange = jest.fn()
    render(<DistanceFilter selectedKm={1} onChange={onChange} />)
    fireEvent.click(screen.getByText('5 km'))
    expect(onChange).toHaveBeenCalledWith(5)
  })

  it('marca la distancia seleccionada', () => {
    render(<DistanceFilter selectedKm={3} onChange={jest.fn()} />)
    const btn = screen.getByText('3 km').closest('button')
    expect(btn?.className).toMatch(/bg-primary/)
  })
})
