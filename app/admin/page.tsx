'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Users, MessageSquare, ShieldAlert, Activity, RefreshCw } from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { fetchApi } from '@/src/lib/fetchApi'
import KpiCard, { KpiCardSkeleton } from '@/src/components/admin/KpiCard'
import EventsTable from '@/src/components/admin/EventsTable'
import type { AdminEvent, EventStatus } from '@/src/components/admin/EventsTable'
import type { CategoryStat } from '@/src/components/admin/CategoryDonut'
import type { TicketPoint } from '@/src/components/admin/TicketAreaChart'

// Charts are client-only (recharts uses browser APIs)
const TicketAreaChart = dynamic(() => import('@/src/components/admin/TicketAreaChart'), {
  ssr: false,
  loading: () => <div className="h-[220px] animate-pulse rounded-lg bg-white/5" />,
})
const CategoryDonut = dynamic(() => import('@/src/components/admin/CategoryDonut'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse rounded-lg bg-white/5" />,
})

// ─── Types ────────────────────────────────────────────────────────────────────

type Kpis = {
  totalProfiles: number
  locatariosWithEvents: number
  totalEvents: number
  totalCommunities: number
  totalLikes: number
  totalSaves: number
  totalMessages: number
  reportsPending?: number
  gmv?: number
}

type RawRecentEvent = {
  id: string
  title: string
  category: string
  address: string
  created_at: string
  organizer_name: string
  status?: EventStatus
}

type AdminStats = {
  kpis: Kpis
  recentProfiles: { id: string; name: string; created_at: string }[]
  recentEvents: RawRecentEvent[]
  recentCommunities: { id: string; event_title: string; created_at: string }[]
  categoryStats?: CategoryStat[]
  monthlyTickets?: TicketPoint[]
}

const ADMIN_STATS_CACHE_KEY = 'emeet-admin-stats-cache'

// Status rotation for demo (status field not in API yet)
const DEMO_STATUSES: EventStatus[] = ['live', 'draft', 'draft', 'flagged', 'live']

function toAdminEvent(e: RawRecentEvent, i: number): AdminEvent {
  return {
    id: e.id,
    title: e.title,
    category: e.category,
    organizerName: e.organizer_name,
    status: e.status ?? DEMO_STATUSES[i % DEMO_STATUSES.length],
    createdAt: e.created_at,
  }
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-em-text">
        <span className="h-4 w-0.5 rounded-full bg-em-accent" />
        {title}
      </h2>
      {children}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, isAuthReady } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

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
      const payload = await fetchApi<AdminStats>('/admin/stats', { method: 'GET' })
      setStats(payload)

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(ADMIN_STATS_CACHE_KEY, JSON.stringify(payload))
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconocido'

      if (typeof window !== 'undefined') {
        try {
          const raw = window.sessionStorage.getItem(ADMIN_STATS_CACHE_KEY)
          if (raw) {
            const cached = JSON.parse(raw) as AdminStats
            setStats(cached)
            setError(`${message} Mostrando datos guardados temporalmente.`)
            return
          }
        } catch {
          // Si el cache está corrupto, seguimos con el error normal.
        }
      }

      setError(message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  // ── Auth guard ────────────────────────────────────────────────────────────
  if (!isAuthReady) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-em-border border-t-em-accent" />
      </div>
    )
  }

  if (!user || user.role !== 'admin') return null

  const kpis = stats?.kpis
  const events: AdminEvent[] = (stats?.recentEvents ?? []).map(toAdminEvent)

  function formatCLP(amount: number) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const kpiCards = [
    {
      label: 'GMV Total',
      value: kpis ? formatCLP(kpis.gmv ?? 0) : '—',
      change: undefined,
      icon: Activity,
      accentColor: '#FF6B00',
    },
    {
      label: 'Usuarios activos',
      value: kpis ? kpis.totalProfiles.toLocaleString('es-CL') : '—',
      change: undefined,
      icon: Users,
      accentColor: '#3B82F6',
    },
    {
      label: 'Reportes pendientes',
      value: kpis ? String(kpis.reportsPending ?? 0) : '—',
      change: undefined,
      icon: ShieldAlert,
      accentColor: '#F6465D',
    },
    {
      label: 'Mensajes totales',
      value: kpis ? kpis.totalMessages.toLocaleString('es-CL') : '—',
      change: undefined,
      icon: MessageSquare,
      accentColor: '#0ECB81',
    },
  ]

  return (
    <div className="min-h-full p-6">
      {/* ── Page header ── */}
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-em-text">Overview</h1>
          <p className="mt-0.5 text-xs text-em-muted">Panel de control · eMeet</p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-em-border bg-em-surface px-3 py-2 text-xs font-medium text-em-muted transition-colors hover:border-white/30 hover:text-em-text disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="mb-6 rounded-lg border border-em-negative/30 bg-em-negative/10 px-4 py-3 text-sm text-em-negative">
          {error}
        </div>
      )}

      {/* ── 12-col responsive grid ── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* KPI Cards */}
        <div className="col-span-1 grid grid-cols-2 gap-3 md:col-span-12 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
            : kpiCards.map((c) => (
                <KpiCard
                  key={c.label}
                  label={c.label}
                  value={c.value}
                  change={c.change}
                  icon={c.icon}
                  accentColor={c.accentColor}
                />
              ))}
        </div>

        {/* Area chart — 8/12 cols */}
        <div className="col-span-1 md:col-span-8">
          <Section title="Venta de Tickets vs Tiempo">
            <div className="rounded-lg border border-em-border bg-em-surface p-5">
              <TicketAreaChart data={stats?.monthlyTickets} loading={loading} />
            </div>
          </Section>
        </div>

        {/* Donut chart — 4/12 cols */}
        <div className="col-span-1 md:col-span-4">
          <Section title="Distribución de Categorías">
            <div className="rounded-lg border border-em-border bg-em-surface p-5">
              <CategoryDonut data={stats?.categoryStats} loading={loading} />
            </div>
          </Section>
        </div>

        {/* Events table — full width */}
        <div className="col-span-1 md:col-span-12">
          <Section title="Eventos Recientes">
            <div className="overflow-hidden rounded-lg border border-em-border bg-em-surface">
              <EventsTable events={events} loading={loading} />
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}
