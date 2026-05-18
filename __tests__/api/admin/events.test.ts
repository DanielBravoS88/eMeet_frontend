/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

// ── Mock de Supabase ──────────────────────────────────────────────────────────

const mockGetUser = jest.fn()

function makeChain(resolvedSingle: unknown, resolvedQuery?: unknown) {
  const chain: Record<string, jest.Mock> = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(resolvedSingle),
    delete: jest.fn().mockReturnThis(),
    order: jest.fn(),
  }
  chain.order.mockResolvedValue(resolvedQuery ?? resolvedSingle)
  chain.delete.mockReturnValue({ ...chain, eq: jest.fn().mockResolvedValue({ error: null }) })
  return chain
}

jest.mock('@/src/lib/supabase', () => ({
  createSupabaseAdminClient: jest.fn(),
}))

// ── Helper ────────────────────────────────────────────────────────────────────

function makeRequest(options: { method?: string; headers?: Record<string, string> }) {
  return new NextRequest('http://localhost/api/admin/events', {
    method: options.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
}

function authHeader(token = 'valid-token') {
  return { Authorization: `Bearer ${token}` }
}

// ── Tests: GET /api/admin/events ──────────────────────────────────────────────

describe('GET /api/admin/events', () => {
  let GET: (req: NextRequest) => Promise<Response>

  beforeAll(async () => {
    ;({ GET } = await import('@/app/api/admin/events/route'))
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('devuelve 401 sin token', async () => {
    const res = await GET(makeRequest({}))
    expect(res.status).toBe(401)
  })

  it('devuelve 401 con token inválido', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('bad token') })
    const { createSupabaseAdminClient } = jest.requireMock('@/src/lib/supabase')
    createSupabaseAdminClient.mockReturnValue({
      auth: { getUser: mockGetUser, admin: {} },
      from: jest.fn(() => makeChain({ data: { role: 'admin' }, error: null })),
    })
    const res = await GET(makeRequest({ headers: authHeader() }))
    expect(res.status).toBe(401)
  })

  it('devuelve 403 si el usuario no es admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    const { createSupabaseAdminClient } = jest.requireMock('@/src/lib/supabase')
    createSupabaseAdminClient.mockReturnValue({
      auth: { getUser: mockGetUser, admin: {} },
      from: jest.fn(() => makeChain({ data: { role: 'user' }, error: null })),
    })
    const res = await GET(makeRequest({ headers: authHeader() }))
    expect(res.status).toBe(403)
  })

  it('devuelve la lista de eventos cuando el caller es admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null })

    const MOCK_EVENTS = [
      { id: 'e1', title: 'Noche de Jazz', category: 'musica', address: 'Bellavista 1', created_at: '2024-01-01', organizer_name: 'Bar Central', status: 'live' },
      { id: 'e2', title: 'Feria Gastro', category: 'gastronomia', address: 'Lastarria 2', created_at: '2024-01-02', organizer_name: 'El Patio', status: 'draft' },
    ]

    let callCount = 0
    const adminChain = makeChain({ data: { role: 'admin' }, error: null })
    const eventsChain = makeChain(null, { data: MOCK_EVENTS, error: null })

    const { createSupabaseAdminClient } = jest.requireMock('@/src/lib/supabase')
    createSupabaseAdminClient.mockReturnValue({
      auth: { getUser: mockGetUser, admin: {} },
      from: jest.fn(() => {
        callCount++
        return callCount === 1 ? adminChain : eventsChain
      }),
    })

    const res = await GET(makeRequest({ headers: authHeader() }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(2)
    expect(body[0]).toMatchObject({ id: 'e1', title: 'Noche de Jazz', status: 'live' })
    expect(body[1]).toMatchObject({ id: 'e2', title: 'Feria Gastro', status: 'draft' })
  })
})

// ── Tests: DELETE /api/admin/events/[id] ─────────────────────────────────────

describe('DELETE /api/admin/events/[id]', () => {
  let DELETE: (req: NextRequest, ctx: { params: { id: string } }) => Promise<Response>

  beforeAll(async () => {
    ;({ DELETE } = await import('@/app/api/admin/events/[id]/route'))
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('devuelve 401 sin token', async () => {
    const res = await DELETE(makeRequest({ method: 'DELETE' }), { params: { id: 'e1' } })
    expect(res.status).toBe(401)
  })

  it('devuelve 403 si el usuario no es admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    const { createSupabaseAdminClient } = jest.requireMock('@/src/lib/supabase')
    createSupabaseAdminClient.mockReturnValue({
      auth: { getUser: mockGetUser, admin: {} },
      from: jest.fn(() => makeChain({ data: { role: 'locatario' }, error: null })),
    })
    const res = await DELETE(
      makeRequest({ method: 'DELETE', headers: authHeader() }),
      { params: { id: 'e1' } },
    )
    expect(res.status).toBe(403)
  })

  it('devuelve 204 al eliminar el evento correctamente', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null })

    let callCount = 0
    const adminChain = makeChain({ data: { role: 'admin' }, error: null })
    const deleteChain: Record<string, jest.Mock> = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
      single: jest.fn(),
      delete: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    }
    deleteChain.delete.mockReturnValue(deleteChain)

    const { createSupabaseAdminClient } = jest.requireMock('@/src/lib/supabase')
    createSupabaseAdminClient.mockReturnValue({
      auth: { getUser: mockGetUser, admin: {} },
      from: jest.fn(() => {
        callCount++
        return callCount === 1 ? adminChain : deleteChain
      }),
    })

    const res = await DELETE(
      makeRequest({ method: 'DELETE', headers: authHeader() }),
      { params: { id: 'e1' } },
    )
    expect(res.status).toBe(204)
  })

  it('devuelve 500 si Supabase falla al eliminar', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null })

    let callCount = 0
    const adminChain = makeChain({ data: { role: 'admin' }, error: null })
    const deleteChain: Record<string, jest.Mock> = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: { message: 'DB error' } }),
      single: jest.fn(),
      delete: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    }
    deleteChain.delete.mockReturnValue(deleteChain)

    const { createSupabaseAdminClient } = jest.requireMock('@/src/lib/supabase')
    createSupabaseAdminClient.mockReturnValue({
      auth: { getUser: mockGetUser, admin: {} },
      from: jest.fn(() => {
        callCount++
        return callCount === 1 ? adminChain : deleteChain
      }),
    })

    const res = await DELETE(
      makeRequest({ method: 'DELETE', headers: authHeader() }),
      { params: { id: 'e1' } },
    )
    expect(res.status).toBe(500)
  })
})
