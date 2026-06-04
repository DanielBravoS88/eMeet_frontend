'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Store, Heart, Bookmark, RefreshCw, Search, Trash2, ShieldCheck, UserCircle2 } from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { fetchApi } from '@/src/lib/fetchApi'
import { getSupabaseBrowserClient } from '@/src/lib/supabase'
import KpiCard, { KpiCardSkeleton } from '@/src/components/admin/KpiCard'
import { cn } from '@/src/lib/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  created_at: string
}

type AdminKpis = {
  totalProfiles: number
  locatariosWithEvents: number
  totalLikes: number
  totalSaves: number
}

type AdminStats = {
  kpis: AdminKpis
  recentProfiles: AdminUser[]
}

type RowAction =
  | { type: 'idle' }
  | { type: 'confirm-delete' }
  | { type: 'deleting' }
  | { type: 'saving-role' }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelative(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 30) return `${diffD}d`
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
}

const ROLE_CONFIG: Record<AdminUser['role'], { label: string; className: string }> = {
  admin: { label: 'Admin', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  user: { label: 'Usuario', className: 'bg-white/8 text-em-muted border-white/10' },
}

// ─── Row component ────────────────────────────────────────────────────────────

function UserRow({
  user,
  currentAdminId,
  onDelete,
  onRoleChange,
}: {
  user: AdminUser
  currentAdminId: string
  onDelete: (id: string) => Promise<void>
  onRoleChange: (id: string, role: AdminUser['role']) => Promise<void>
}) {
  const [action, setAction] = useState<RowAction>({ type: 'idle' })
  // pendingRole es null cuando no hay cambio pendiente; nunca se inicializa desde props
  const [pendingRole, setPendingRole] = useState<AdminUser['role'] | null>(null)
  const [roleError, setRoleError] = useState<string | null>(null)
  const isSelf = user.id === currentAdminId

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const safeRole: AdminUser['role'] =
    user.role === 'admin' || user.role === 'user' ? user.role : 'user'
  // El select muestra pendingRole si hay cambio pendiente, si no muestra el rol real
  const displayRole = pendingRole ?? safeRole
  const roleDirty = pendingRole !== null && pendingRole !== safeRole

  async function handleDelete() {
    setAction({ type: 'deleting' })
    try {
      await onDelete(user.id)
    } catch {
      setAction({ type: 'idle' })
    }
  }

  async function handleSaveRole() {
    if (!pendingRole) return
    setAction({ type: 'saving-role' })
    setRoleError(null)
    try {
      await onRoleChange(user.id, pendingRole)
      setPendingRole(null)
    } catch (e) {
      setRoleError(e instanceof Error ? e.message : 'Error al cambiar rol')
    } finally {
      setAction({ type: 'idle' })
    }
  }

  const roleConfig = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.user

  return (
    <tr className="transition-colors hover:bg-white/[0.025]">
      {/* Avatar + Nombre + Email */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-em-accent/20 text-xs font-bold text-em-accent">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-em-text">{user.name}</p>
            <p className="truncate text-[11px] text-em-muted">{user.email}</p>
          </div>
        </div>
      </td>

      {/* Rol actual + selector */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', roleConfig.className)}>
            {roleConfig.label}
          </span>
        </div>
      </td>

      {/* Cambiar rol */}
      <td className="px-5 py-3.5">
        {isSelf ? (
          <span className="text-[11px] text-em-muted italic">Tu cuenta</span>
        ) : (
          <div className="flex items-center gap-2">
            <select
              value={displayRole}
              onChange={(e) => setPendingRole(e.target.value as AdminUser['role'])}
              disabled={action.type === 'saving-role'}
              className="rounded-md border border-em-border bg-em-bg px-2 py-1 text-xs text-em-text focus:border-em-accent focus:outline-none disabled:opacity-50"
            >
              <option value="user">Usuario</option>
              <option value="admin">Admin</option>
            </select>
            {roleDirty && (
              <button
                type="button"
                onClick={handleSaveRole}
                disabled={action.type === 'saving-role'}
                className="rounded-md bg-em-accent px-2.5 py-1 text-[11px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {action.type === 'saving-role' ? 'Guardando…' : 'Guardar'}
              </button>
            )}
            {roleError && <span className="text-[11px] text-em-negative">{roleError}</span>}
          </div>
        )}
      </td>

      {/* Registrado */}
      <td className="px-5 py-3.5 text-xs text-em-muted">{formatRelative(user.created_at)}</td>

      {/* Acciones */}
      <td className="px-5 py-3.5">
        {isSelf ? null : action.type === 'confirm-delete' ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-em-negative">¿Eliminar?</span>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-md bg-em-negative/20 px-2.5 py-1 text-[11px] font-semibold text-em-negative transition-colors hover:bg-em-negative/30"
            >
              Sí
            </button>
            <button
              type="button"
              onClick={() => setAction({ type: 'idle' })}
              className="rounded-md border border-em-border px-2.5 py-1 text-[11px] font-semibold text-em-muted transition-colors hover:text-em-text"
            >
              No
            </button>
          </div>
        ) : action.type === 'deleting' ? (
          <span className="text-[11px] text-em-muted">Eliminando…</span>
        ) : (
          <button
            type="button"
            onClick={() => setAction({ type: 'confirm-delete' })}
            className="flex items-center gap-1.5 rounded-md border border-em-negative/25 px-2.5 py-1 text-[11px] font-semibold text-em-negative transition-colors hover:border-em-negative/50 hover:bg-em-negative/10"
          >
            <Trash2 className="h-3 w-3" />
            Eliminar
          </button>
        )}
      </td>
    </tr>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function UsersTableSkeleton() {
  return (
    <div className="divide-y divide-em-border">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5">
          <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-36 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-48 animate-pulse rounded bg-white/10" />
          </div>
          <div className="h-5 w-16 animate-pulse rounded-full bg-white/10" />
          <div className="h-5 w-24 animate-pulse rounded bg-white/10" />
        </div>
      ))}
    </div>
  )
}

// ─── API helper ───────────────────────────────────────────────────────────────

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await getSupabaseBrowserClient().auth.getSession()
  const token = data.session?.access_token
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(path, { ...init, headers })
  if (res.status === 204) return undefined as T
  const body = (await res.json()) as T & { error?: string }
  if (!res.ok) throw new Error((body as { error?: string }).error ?? 'Error en la operación')
  return body
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { user: currentUser, isAuthReady } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (isAuthReady && (!currentUser || currentUser.role !== 'admin')) {
      router.replace('/auth')
    }
  }, [isAuthReady, currentUser, router])

  const load = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'admin') return
    setLoading(true)
    setError(null)
    try {
      const [statsRes, usersRes] = await Promise.allSettled([
        fetchApi<AdminStats>('/admin/stats', { method: 'GET' }),
        adminFetch<AdminUser[]>('/api/admin/users'),
      ])

      if (statsRes.status === 'fulfilled') setStats(statsRes.value)
      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value)
      } else if (statsRes.status === 'fulfilled') {
        setUsers(statsRes.value.recentProfiles ?? [])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => { load() }, [load, refreshKey])

  const handleDelete = useCallback(async (id: string) => {
    await adminFetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }, [])

  const handleRoleChange = useCallback(async (id: string, role: AdminUser['role']) => {
    await adminFetch(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    })
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u))
  }, [])

  if (!isAuthReady) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-em-border border-t-em-accent" />
      </div>
    )
  }
  if (!currentUser || currentUser.role !== 'admin') return null

  const kpis = stats?.kpis
  const kpiCards = [
    { label: 'Total usuarios', value: kpis ? kpis.totalProfiles.toLocaleString('es-CL') : '—', icon: Users, accentColor: '#3B82F6' },
    { label: 'Creadores con eventos', value: kpis ? kpis.locatariosWithEvents.toLocaleString('es-CL') : '—', icon: Store, accentColor: '#FF6B00' },
    { label: 'Likes totales', value: kpis ? kpis.totalLikes.toLocaleString('es-CL') : '—', icon: Heart, accentColor: '#F6465D' },
    { label: 'Guardados totales', value: kpis ? kpis.totalSaves.toLocaleString('es-CL') : '—', icon: Bookmark, accentColor: '#A855F7' },
  ]

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  return (
    <div className="min-h-full p-6">
      {/* Header */}
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-em-text">Usuarios</h1>
          <p className="mt-0.5 text-xs text-em-muted">Gestión de cuentas · eMeet</p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-em-border bg-em-surface px-3 py-2 text-xs font-medium text-em-muted transition-colors hover:border-white/30 hover:text-em-text disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-em-negative/30 bg-em-negative/10 px-4 py-3 text-sm text-em-negative">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* KPIs */}
        <div className="col-span-1 grid grid-cols-2 gap-3 md:col-span-12 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
            : kpiCards.map((c) => (
                <KpiCard key={c.label} label={c.label} value={c.value} icon={c.icon} accentColor={c.accentColor} />
              ))}
        </div>

        {/* Tabla de usuarios */}
        <div className="col-span-1 md:col-span-12">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-em-text">
              <span className="h-4 w-0.5 rounded-full bg-em-accent" />
              Todos los usuarios
              {!loading && (
                <span className="ml-1 rounded-full bg-em-surface px-2 py-0.5 text-[11px] text-em-muted">
                  {filteredUsers.length}
                </span>
              )}
            </h2>

            {/* Buscador */}
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-em-muted" />
              <input
                type="text"
                placeholder="Buscar por nombre o email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-full rounded-lg border border-em-border bg-em-bg pl-8 pr-3 text-xs text-em-text placeholder:text-em-muted focus:border-em-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-em-border bg-em-surface">
            {loading ? (
              <UsersTableSkeleton />
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <UserCircle2 className="h-8 w-8 text-em-muted" />
                <p className="text-sm text-em-muted">
                  {search ? 'Sin resultados para esa búsqueda.' : 'Sin usuarios registrados aún.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-em-border">
                      {['Usuario', 'Rol actual', 'Cambiar rol', 'Registrado', 'Acciones'].map((h) => (
                        <th key={h} className="whitespace-nowrap px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-em-muted">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-em-border">
                    {filteredUsers.map((u) => (
                      <UserRow
                        key={u.id}
                        user={u}
                        currentAdminId={currentUser.id}
                        onDelete={handleDelete}
                        onRoleChange={handleRoleChange}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-start gap-4 rounded-lg border border-em-border/50 bg-em-surface/50 px-4 py-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-em-accent" />
            <div className="space-y-1 text-[11px] text-em-muted">
              <p><span className="font-semibold text-em-text">Eliminar usuario</span> — borra el perfil y sus datos. Acción irreversible.</p>
              <p><span className="font-semibold text-em-text">Cambiar a Admin</span> — otorga acceso total al panel de administración.</p>
              <p><span className="font-semibold text-em-text">Cambiar a Usuario</span> — cuenta estándar. Cada usuario activa el modo creador desde su propio perfil.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
