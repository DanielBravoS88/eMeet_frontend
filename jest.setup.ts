/// <reference types="node" />
/// <reference types="jest" />
import '@testing-library/jest-dom/jest-globals'

// Evita que los clientes de Supabase intenten conectarse en tests
jest.mock('@/src/lib/supabase', () => ({
  hasSupabaseEnv: false,
  getSupabaseBrowserClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signOut: jest.fn().mockResolvedValue({}),
    },
  })),
  createSupabaseAdminClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      admin: {
        listUsers: jest.fn().mockResolvedValue({ data: { users: [] } }),
        deleteUser: jest.fn().mockResolvedValue({ error: null }),
      },
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
      delete: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    })),
  })),
  createSupabaseServerClient: jest.fn(),
}))

// Evita que requireBackendUrl lance error en tests
jest.mock('@/src/lib/backend', () => ({
  requireBackendUrl: jest.fn(() => 'http://localhost:3001'),
}))

// Evita llamadas reales de fetch al backend
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: jest.fn().mockResolvedValue({}),
})
