'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Event, EventCategory } from '../types'
import { getSupabaseAccessToken, getSupabaseAuthSession } from '../lib/authSession'
import { getSupabaseBrowserClient, hasSupabaseEnv } from '../lib/supabase'
import { requireBackendUrl } from '../lib/backend'

interface CreateLocatarioEventInput {
  title: string
  description: string
  category: EventCategory
  date: string
  address: string
  price: number | null
  imageUrl?: string
  videoUrl?: string
  audioPreviewUrl?: string | null
  organizerName: string
  organizerAvatar: string
  lat?: number
  lng?: number
}

interface LocatarioEventsContextValue {
  locatarioEvents: Event[]
  publicLocatarioEvents: Event[]
  isLoading: boolean
  createLocatarioEvent: (input: CreateLocatarioEventInput) => Promise<Event>
  removeLocatarioEvent: (eventId: string) => Promise<void>
}

const LocatarioEventsContext = createContext<LocatarioEventsContextValue | undefined>(undefined)

const STORAGE_KEY = 'emeet-locatario-events'
const FALLBACK_EVENT_IMAGE = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=80'

function loadEventsFromStorage(): Event[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Event[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveEventsToStorage(events: Event[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
}

type LocatarioEventRow = {
  id: string
  title: string
  description: string
  category: string
  event_date: string
  address: string
  price: number | null
  image_url: string | null
  video_url: string | null
  audio_preview_url: string | null
  organizer_name: string
  organizer_avatar: string | null
  lat: number | null
  lng: number | null
}

function dbRowToEvent(row: LocatarioEventRow): Event {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as EventCategory,
    date: row.event_date,
    location: row.organizer_name,
    address: row.address,
    distance: 0,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    price: row.price,
    imageUrl: row.image_url || FALLBACK_EVENT_IMAGE,
    videoUrl: row.video_url ?? null,
    audioPreviewUrl: row.audio_preview_url ?? null,
    websiteUrl: null,
    organizerName: row.organizer_name,
    organizerAvatar: row.organizer_avatar || 'https://i.pravatar.cc/150?img=32',
    attendees: 0,
    capacity: null,
    tags: ['locatario', row.category as EventCategory],
    isLiked: false,
    isSaved: false,
    rating: undefined,
    isOpen: null,
  }
}

async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const endpoint = `${requireBackendUrl('eventos de locatario con backend separado')}${input}`
  const headers = new Headers({ 'Content-Type': 'application/json', ...(init?.headers ?? {}) })

  if (hasSupabaseEnv) {
    const accessToken = await getSupabaseAccessToken()
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }
  }

  const res = await fetch(endpoint, {
    credentials: 'include',
    ...init,
    headers,
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? 'Error al comunicarse con el servidor.')
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function LocatarioEventsProvider({ children }: { children: ReactNode }) {
  const [locatarioEvents, setLocatarioEvents] = useState<Event[]>([])
  const [publicLocatarioEvents, setPublicLocatarioEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadPublicEvents = useCallback(async () => {
    if (!hasSupabaseEnv) {
      const stored = loadEventsFromStorage()
      setPublicLocatarioEvents(stored)
      return stored
    }

    const rows = await apiFetch<LocatarioEventRow[]>('/events/locatario/public')
    const mapped = rows.map(dbRowToEvent)
    setPublicLocatarioEvents(mapped)
    return mapped
  }, [])

  const loadPrivateEvents = useCallback(async () => {
    if (!hasSupabaseEnv) {
      const stored = loadEventsFromStorage()
      setLocatarioEvents(stored)
      return stored
    }

    const session = await getSupabaseAuthSession()
    if (!session) {
      setLocatarioEvents([])
      return []
    }

    const rows = await apiFetch<LocatarioEventRow[]>('/events/locatario')
    const mapped = rows.map(dbRowToEvent)
    setLocatarioEvents(mapped)
    return mapped
  }, [])

  useEffect(() => {
    if (!hasSupabaseEnv) {
      const stored = loadEventsFromStorage()
      setLocatarioEvents(stored)
      setPublicLocatarioEvents(stored)
      return
    }

    let mounted = true
    setIsLoading(true)
    requireBackendUrl()

    ;(async () => {
      try {
        const publicEvents = await loadPublicEvents().catch(() => loadEventsFromStorage())
        if (!mounted) return
        setPublicLocatarioEvents(publicEvents)

        const session = await getSupabaseAuthSession()
        if (!mounted) return

        if (!session) {
          setLocatarioEvents([])
          return
        }

        const ownEvents = await loadPrivateEvents().catch(() => loadEventsFromStorage())
        if (!mounted) return
        setLocatarioEvents(ownEvents)
      } finally {
        if (mounted) setIsLoading(false)
      }
    })().catch(() => {
      if (!mounted) return
      const stored = loadEventsFromStorage()
      setLocatarioEvents(stored)
      setPublicLocatarioEvents(stored)
      setIsLoading(false)
    })

    const { data: authListener } = getSupabaseBrowserClient().auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setLocatarioEvents([])
        loadPublicEvents().catch(() => {
          if (!mounted) return
          setPublicLocatarioEvents(loadEventsFromStorage())
        })
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadPrivateEvents().catch(() => {
          if (!mounted) return
          setLocatarioEvents(loadEventsFromStorage())
        })
        loadPublicEvents().catch(() => {
          if (!mounted) return
          setPublicLocatarioEvents(loadEventsFromStorage())
        })
      }
    })

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [loadPrivateEvents, loadPublicEvents])

  const createLocatarioEvent = useCallback(async (input: CreateLocatarioEventInput): Promise<Event> => {
    if (!hasSupabaseEnv) {
      const newEvent: Event = {
        id: `loc-event-${Date.now()}`,
        title: input.title.trim(),
        description: input.description.trim(),
        category: input.category,
        date: new Date(input.date).toISOString(),
        location: input.organizerName,
        address: input.address.trim(),
        distance: 0,
        lat: input.lat,
        lng: input.lng,
        price: input.price,
        imageUrl: input.imageUrl?.trim() || FALLBACK_EVENT_IMAGE,
        videoUrl: input.videoUrl?.trim() || null,
        websiteUrl: null,
        organizerName: input.organizerName,
        organizerAvatar: input.organizerAvatar,
        attendees: 0,
        capacity: null,
        tags: ['locatario', input.category],
        isLiked: false,
        isSaved: false,
        rating: undefined,
        isOpen: null,
      }

      setLocatarioEvents((prev) => {
        const next = [newEvent, ...prev]
        saveEventsToStorage(next)
        return next
      })
      setPublicLocatarioEvents((prev) => [newEvent, ...prev])
      return newEvent
    }

    const session = await getSupabaseAuthSession()
    if (!session) {
      throw new Error('Debes iniciar sesión para crear eventos de locatario.')
    }

    const row = await apiFetch<LocatarioEventRow>('/events/locatario', {
      method: 'POST',
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        category: input.category,
        event_date: input.date,
        address: input.address,
        price: input.price,
        image_url: input.imageUrl || null,
        video_url: input.videoUrl || null,
        audio_preview_url: input.audioPreviewUrl || null,
        organizer_name: input.organizerName,
        organizer_avatar: input.organizerAvatar,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
      }),
    })

    const newEvent = dbRowToEvent(row)
    setLocatarioEvents((prev) => [newEvent, ...prev])
    setPublicLocatarioEvents((prev) => [newEvent, ...prev.filter((event) => event.id !== newEvent.id)])
    return newEvent
  }, [])

  const removeLocatarioEvent = useCallback(async (eventId: string): Promise<void> => {
    setLocatarioEvents((prev) => {
      const next = prev.filter((e) => e.id !== eventId)
      if (!hasSupabaseEnv) saveEventsToStorage(next)
      return next
    })
    setPublicLocatarioEvents((prev) => prev.filter((e) => e.id !== eventId))

    if (!hasSupabaseEnv) return

    const session = await getSupabaseAuthSession()
    if (!session) {
      throw new Error('Debes iniciar sesión para eliminar eventos de locatario.')
    }

    await apiFetch<void>(`/events/locatario/${eventId}`, { method: 'DELETE' })
  }, [])

  const value = useMemo(
    () => ({ locatarioEvents, publicLocatarioEvents, isLoading, createLocatarioEvent, removeLocatarioEvent }),
    [locatarioEvents, publicLocatarioEvents, isLoading, createLocatarioEvent, removeLocatarioEvent],
  )

  return <LocatarioEventsContext.Provider value={value}>{children}</LocatarioEventsContext.Provider>
}

export function useLocatarioEvents() {
  const context = useContext(LocatarioEventsContext)
  if (!context) {
    throw new Error('useLocatarioEvents debe usarse dentro de LocatarioEventsProvider')
  }
  return context
}
