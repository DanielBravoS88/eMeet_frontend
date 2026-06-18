import { render, screen, fireEvent } from '@testing-library/react'
import PlaceTypeFilters from '@/src/components/PlaceTypeFilters'

describe('PlaceTypeFilters', () => {
  it('renderiza los tipos de lugar con su etiqueta', () => {
    render(<PlaceTypeFilters selectedTypes={[]} onToggleType={jest.fn()} />)
    expect(screen.getByText('Restaurante')).toBeInTheDocument()
    expect(screen.getByText('Bar')).toBeInTheDocument()
    expect(screen.getByText('Discoteca')).toBeInTheDocument()
    expect(screen.getByText('Museo')).toBeInTheDocument()
  })

  it('llama onToggleType con el tipo al hacer click', () => {
    const onToggle = jest.fn()
    render(<PlaceTypeFilters selectedTypes={[]} onToggleType={onToggle} />)
    fireEvent.click(screen.getByText('Bar'))
    expect(onToggle).toHaveBeenCalledWith('bar')
  })

  it('aplica color de fondo al tipo seleccionado', () => {
    render(<PlaceTypeFilters selectedTypes={['restaurant']} onToggleType={jest.fn()} />)
    const btn = screen.getByText('Restaurante').closest('button')!
    // Seleccionado usa el color de la config (naranjo) como background, no el fondo oscuro
    expect(btn.style.backgroundColor).not.toBe('')
    expect(btn.style.color).toBe('rgb(255, 255, 255)')
  })
})
