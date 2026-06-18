import { render, screen, fireEvent } from '@testing-library/react'
import EventCategoryFilter from '@/src/components/EventCategoryFilter'

describe('EventCategoryFilter', () => {
  it('renderiza las 8 categorías', () => {
    render(<EventCategoryFilter selected={[]} onToggle={jest.fn()} />)
    expect(screen.getByText('Gastronomía')).toBeInTheDocument()
    expect(screen.getByText('Música')).toBeInTheDocument()
    expect(screen.getByText('Fiesta')).toBeInTheDocument()
    expect(screen.getByText('Arte')).toBeInTheDocument()
  })

  it('llama onToggle con la categoría al hacer click', () => {
    const onToggle = jest.fn()
    render(<EventCategoryFilter selected={[]} onToggle={onToggle} />)
    fireEvent.click(screen.getByText('Música'))
    expect(onToggle).toHaveBeenCalledWith('musica')
  })

  it('resalta las categorías seleccionadas', () => {
    render(<EventCategoryFilter selected={['fiesta']} onToggle={jest.fn()} />)
    const btn = screen.getByText('Fiesta').closest('button')
    expect(btn?.className).toMatch(/bg-primary/)
  })
})
