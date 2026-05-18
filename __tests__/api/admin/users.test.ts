/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

// ── Mock de Supabase ──────────────────────────────────────────────────────────

const mockGetUser = jest.fn()
const mockListUsers = jest.fn()
const mockDeleteUser = jest.fn()

let mockProfilesChain: Record<string, jest.Mock>

function makeChain(resolved: unknown) {
  const chain: Record<string, jest.Mock> = {
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    order: jest.fn(),
  }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.order.mockReturnValue(chain)
  chain.delete.mockReturnValue(chain)
  chain.update.mockReturnValue(chain)
  chain.single.mockResolvedValue(resolved)
  return chain
}

jest.mock('@/src/lib/supabase', () => ({
  createSupabaseAdminClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
      admin: { listUsers: mockListUsers, deleteUser: mockDeleteUser },
    },
    from: jest.fn(() => mockProfilesChain),
  })),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(options: {
  method?: string
  headers?: Record<string, string>
  body?: unknown
}) {
  return new NextRequest('http://localhost/api/admin/users', {
    method: options.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
}

function authHeader(token = 'valid-token') {
  return { Authorization: `Bearer ${token}` }
}

// ── Tests: GET /api/admin/users ───────────────────────────────────────────────

describe('GET /api/admin/users', () => {
  let GET: (req: NextRequest) => Promise<Response>

  beforeAll(async () => {
    ;({ GET } = await import('@/app/api/admin/users/route'))
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('devuelve 401 sin token de autorización', async () => {
    const res = await GET(makeRequest({}))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/no autorizado/i)
  })

  it('devuelve 401 con token inválido', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('Invalid token') })
    const res = await GET(makeRequest({ headers: authHeader() }))
    expect(res.status).toBe(401)
  })

  it('devuelve 403 si el usuario no es admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockProfilesChain = makeChain({ data: { role: 'user' }, error: null })
    const res = await GET(makeRequest({ headers: authHeader() }))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/acceso denegado/i)
  })

  it('devuelve la lista de usuarios cuando el caller es admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null })

    // Primera llamada: verificar rol del caller → admin
    // Segunda llamada: obtener todos los profiles
    let callCount = 0
    const adminChain = makeChain({ data: { role: 'admin' }, error: null })
    const profilesChain: Record<string, jest.Mock> = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    }
    profilesChain.single.mockResolvedValue({ data: { role: 'admin' }, error: null })
    profilesChain.order.mockResolvedValue({
      data: [
        { id: 'u1', name: 'Alice', role: 'user', created_at: '2024-01-01' },
        { id: 'u2', name: 'Bob', role: 'locatario', created_at: '2024-01-02' },
      ],
      error: null,
    })

    // from() devuelve distinto chain según llamada
    const { createSupabaseAdminClient } = jest.requireMock('@/src/lib/supabase')
    createSupabaseAdminClient.mockReturnValue({
      auth: {
        getUser: mockGetUser,
        admin: { listUsers: mockListUsers, deleteUser: mockDeleteUser },
      },
      from: jest.fn(() => {
        callCount++
        return callCount === 1 ? adminChain : profilesChain
      }),
    })

    mockListUsers.mockResolvedValue({
      data: {
        users: [
          { id: 'u1', email: 'alice@test.com' },
          { id: 'u2', email: 'bob@test.com' },
        ],
      },
    })

    const res = await GET(makeRequest({ headers: authHeader() }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body[0]).toMatchObject({ id: 'u1', name: 'Alice', email: 'alice@test.com' })
    expect(body[1]).toMatchObject({ id: 'u2', name: 'Bob', email: 'bob@test.com' })
  })
})

// ── Tests: DELETE /api/admin/users/[id] ──────────────────────────────────────

describe('DELETE /api/admin/users/[id]', () => {
  let DELETE: (req: NextRequest, ctx: { params: { id: string } }) => Promise<Response>

  beforeAll(async () => {
    ;({ DELETE } = await import('@/app/api/admin/users/[id]/route'))
  })

  beforeEach(() => {
    jest.clearAllMocks()
    const { createSupabaseAdminClient } = jest.requireMock('@/src/lib/supabase')
    mockProfilesChain = makeChain({ data: { role: 'admin' }, error: null })
    createSupabaseAdminClient.mockReturnValue({
      auth: { getUser: mockGetUser, admin: { listUsers: mockListUsers, deleteUser: mockDeleteUser } },
      from: jest.fn(() => mockProfilesChain),
    })
  })

  it('devuelve 401 sin token', async () => {
    const res = await DELETE(makeRequest({ method: 'DELETE' }), { params: { id: 'u2' } })
    expect(res.status).toBe(401)
  })

  it('devuelve 400 si el admin intenta eliminarse a sí mismo', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null })
    const res = await DELETE(
      makeRequest({ method: 'DELETE', headers: authHeader() }),
      { params: { id: 'admin-1' } },
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/propia cuenta/i)
  })

  it('devuelve 204 al eliminar un usuario correctamente', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null })
    mockProfilesChain.delete.mockReturnValue({ ...mockProfilesChain, eq: jest.fn().mockResolvedValue({ error: null }) })
    mockDeleteUser.mockResolvedValue({ error: null })

    const res = await DELETE(
      makeRequest({ method: 'DELETE', headers: authHeader() }),
      { params: { id: 'u2' } },
    )
    expect(res.status).toBe(204)
  })
})

// ── Tests: PATCH /api/admin/users/[id]/role ───────────────────────────────────

describe('PATCH /api/admin/users/[id]/role', () => {
  let PATCH: (req: NextRequest, ctx: { params: { id: string } }) => Promise<Response>

  beforeAll(async () => {
    ;({ PATCH } = await import('@/app/api/admin/users/[id]/role/route'))
  })

  beforeEach(() => {
    jest.clearAllMocks()
    const { createSupabaseAdminClient } = jest.requireMock('@/src/lib/supabase')
    mockProfilesChain = makeChain({ data: { role: 'admin' }, error: null })
    createSupabaseAdminClient.mockReturnValue({
      auth: { getUser: mockGetUser, admin: { listUsers: mockListUsers, deleteUser: mockDeleteUser } },
      from: jest.fn(() => mockProfilesChain),
    })
  })

  it('devuelve 400 con un rol inválido', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null })
    const res = await PATCH(
      makeRequest({ method: 'PATCH', headers: authHeader(), body: { role: 'superuser' } }),
      { params: { id: 'u2' } },
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/rol inválido/i)
  })

  it('acepta los roles válidos: user, locatario, admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null })

    for (const role of ['user', 'locatario', 'admin']) {
      // Resetear el chain para que update/select/eq/single funcionen en cadena
      const chain: Record<string, jest.Mock> = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'u2', name: 'Bob', role, created_at: '' }, error: null }),
        update: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
      }
      chain.update.mockReturnValue(chain)
      chain.select.mockReturnValue(chain)
      chain.eq.mockReturnValue(chain)

      // Primera llamada from() → verificar rol del caller
      // Segunda llamada from() → update del perfil
      let callCount = 0
      const adminChain = makeChain({ data: { role: 'admin' }, error: null })
      const { createSupabaseAdminClient } = jest.requireMock('@/src/lib/supabase')
      createSupabaseAdminClient.mockReturnValue({
        auth: { getUser: mockGetUser, admin: {} },
        from: jest.fn(() => {
          callCount++
          return callCount === 1 ? adminChain : chain
        }),
      })

      const res = await PATCH(
        makeRequest({ method: 'PATCH', headers: authHeader(), body: { role } }),
        { params: { id: 'u2' } },
      )
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.role).toBe(role)
    }
  })
})
