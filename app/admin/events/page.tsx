'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, MessageSquare, Heart, Users, RefreshCw, Search } from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { fetchApi } from '@/src/lib/fetchApi'
import { getSupabaseBrowserClient } from '@/src/lib/supabase'
import KpiCard, { KpiCardSkeleton } from '@/src/components/admin/KpiCard'
import EventsTable, { EventsTableSkeleton } from '@/src/components/admin/EventsTable'
import type { AdminEvent } from '@/src/components/admin/EventsTable'
import { cn } from '@/src/lib/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

type RawEvent = {
  id: string
  title: string
  category: string
  address: string
  created_at: string
  organizer_name: string
  status?: 'live' | 'draft' | 'flagged'
}

type AdminKpis = {
  totalEvents: number
  totalCommunities: number
  totalLikes: number
  totalMessages: number
}

type AdminStats = {
  kpis: AdminKpis
  recentEvents: RawEvent[]
}

function toAdminEvent(e: RawEvent): AdminEvent {
  return {
    id: e.id,
    title: e.title,
    category: e.category,
    organizerName: e.organizer_name,
    status: e.status ?? 'draft',
    createdAt: e.created_at,
  }
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

export default function AdminEventsPage() {
  const { user, isAuthReady } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (isAuthReady && (!user || user.role !== 'admin')) {
      router.replace('/auth')
    }
  }, [isAuthReady, user, router])

  const load = useCallback(async () => {
    if (!user || user.role !== 'admin') return
    setLoading(true)
    setError(null)
    try {
      const [statsRes, eventsRes] = await Promise.allSettled([
        fetchApi<AdminStats>('/admin/stats', { method: 'GET' }),
        adminFetch<RawEvent[]>('/api/admin/events'),
      ])

      if (statsRes.status === 'fulfilled') setStats(statsRes.value)

      if (eventsRes.status === 'fulfilled') {
        setEvents(eventsRes.value.map(toAdminEvent))
      } else if (statsRes.status === 'fulfilled') {
        setEvents((statsRes.value.recentEvents ?? []).map(toAdminEvent))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load, refreshKey])

  const handleDelete = useCallback(async (id: string) => {
    await adminFetch(`/api/admin/events/${id}`, { method: 'DELETE' })
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }, [])

  if (!isAuthReady) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-em-border border-t-em-accent" />
      </div>
    )
  }
  if (!user || user.role !== 'admin') return null

  const kpis = stats?.kpis
  const kpiCards = [
    { label: 'Total eventos', value: kpis ? kpis.totalEvents.toLocaleString('es-CL') : '—', icon: CalendarDays, accentColor: '#3B82F6' },
    { label: 'Comunidades activas', value: kpis ? kpis.totalCommunities.toLocaleString('es-CL') : '—', icon: Users, accentColor: '#0ECB81' },
    { label: 'Likes totales', value: kpis ? kpis.totalLikes.toLocaleString('es-CL') : '—', icon: Heart, accentColor: '#F6465D' },
    { label: 'Mensajes enviados', value: kpis ? kpis.totalMessages.toLocaleString('es-CL') : '—', icon: MessageSquare, accentColor: '#A855F7' },
  ]

  const filteredEvents = events.filter((e) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return e.title.toLowerCase().includes(q) || e.organizerName.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
  })

  return (
    <div className="min-h-full p-6">
      {/* Header */}
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-em-text">Eventos</h1>
          <p className="mt-0.5 text-xs text-em-muted">Gestión de publicaciones · eMeet</p>
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

        {/* Tabla de eventos */}
        <div className="col-span-1 md:col-span-12">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-em-text">
              <span className="h-4 w-0.5 rounded-full bg-em-accent" />
              Todos los eventos
              {!loading && (
                <span className="ml-1 rounded-full bg-em-surface px-2 py-0.5 text-[11px] text-em-muted">
                  {filteredEvents.length}
                </span>
              )}
            </h2>

            {/* Buscador */}
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-em-muted" />
              <input
                type="text"
                placeholder="Buscar por título, organizador…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-full rounded-lg border border-em-border bg-em-bg pl-8 pr-3 text-xs text-em-text placeholder:text-em-muted focus:border-em-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-em-border bg-em-surface">
            {loading ? (
              <EventsTableSkeleton />
            ) : (
              <EventsTable
                events={filteredEvents}
                loading={false}
                onDelete={handleDelete}
              />
            )}
          </div>

          {!loading && filteredEvents.length > 0 && (
            <p className="mt-2 text-[11px] text-em-muted">
              Eliminar un evento lo borra permanentemente de la base de datos y del feed público.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
