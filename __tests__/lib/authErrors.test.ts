import { humanizeAuthError } from '@/src/lib/authErrors'

describe('humanizeAuthError', () => {
  it('devuelve fallback cuando el error es vacío', () => {
    const r = humanizeAuthError('')
    expect(r.suggestion).toBe('retry')
    expect(r.field).toBeNull()
    expect(r.message).toMatch(/No pudimos iniciar sesión/)
  })

  it('detecta credenciales inválidas y sugiere recuperar contraseña', () => {
    const r = humanizeAuthError(new Error('Invalid login credentials'))
    expect(r.message).toBe('Correo o contraseña incorrectos.')
    expect(r.field).toBe('password')
    expect(r.suggestion).toBe('forgot')
    expect(r.hint).toBeDefined()
  })

  it('detecta email no confirmado y sugiere verificar', () => {
    const r = humanizeAuthError(new Error('Email not confirmed'))
    expect(r.field).toBe('email')
    expect(r.suggestion).toBe('verify')
  })

  it('detecta usuario inexistente y sugiere registro', () => {
    const r = humanizeAuthError(new Error('User not found'))
    expect(r.field).toBe('email')
    expect(r.suggestion).toBe('signup')
  })

  it('detecta rate limit', () => {
    const r = humanizeAuthError(new Error('Rate limit exceeded'))
    expect(r.message).toMatch(/Demasiados intentos/)
    expect(r.suggestion).toBeNull()
  })

  it('detecta cuenta deshabilitada', () => {
    const r = humanizeAuthError(new Error('User is banned'))
    expect(r.message).toMatch(/deshabilitada/)
  })

  it('detecta email mal formado', () => {
    const r = humanizeAuthError(new Error('Invalid email'))
    expect(r.field).toBe('email')
    expect(r.message).toMatch(/formato válido/)
  })

  it('detecta contraseña que no cumple requisitos', () => {
    const r = humanizeAuthError(new Error('Password should be at least 6 characters'))
    expect(r.field).toBe('password')
    expect(r.message).toMatch(/requisitos/)
  })

  it('detecta error de red', () => {
    const r = humanizeAuthError(new Error('Failed to fetch'))
    expect(r.message).toMatch(/conexión con el servidor/)
    expect(r.suggestion).toBe('retry')
  })

  it('usa el mensaje original para un Error no reconocido', () => {
    const r = humanizeAuthError(new Error('Un error muy específico'))
    expect(r.message).toBe('Un error muy específico')
    expect(r.suggestion).toBe('retry')
  })

  it('devuelve fallback para un valor no-Error no reconocido', () => {
    const r = humanizeAuthError('algo raro')
    expect(r.message).toMatch(/No pudimos iniciar sesión/)
    expect(r.suggestion).toBe('retry')
  })

  it('maneja null sin lanzar', () => {
    const r = humanizeAuthError(null)
    expect(r.message).toBeDefined()
  })
})
