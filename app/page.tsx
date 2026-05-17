'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import SwipeCard from '../src/components/SwipeCard'
import Layout from '../src/components/Layout'

const BellavistaMapMobile = dynamic(() => import('../src/components/BellavistaMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-muted">
      Cargando mapa...
    </div>
  ),
})
import DistanceFilter from '../src/components/DistanceFilter'
import PlaceTypeFilters from '../src/components/PlaceTypeFilters'
import { placeToEvent } from '../src/data/placeFeedAdapter'
import { NearbyPlacesProvider, useNearbyPlacesContext } from '../src/context/NearbyPlacesContext'
import { useChatContext } from '../src/context/ChatContext'
import { useAuth } from '../src/context/AuthContext'
import { useLocatarioEvents } from '../src/context/LocatarioEventsContext'
import { hasSupabaseEnv, getSupabaseBrowserClient } from '../src/lib/supabase'
import { fetchApi } from '../src/lib/fetchApi'
import { HiMapPin, HiClock } from 'react-icons/hi2'
import { HiHeart, HiBookmark } from 'react-icons/hi'
import type { Event, PlaceType } from '../src/types'
import { formatEventDate, formatPrice, CATEGORY_EMOJI } from '../src/lib/eventUtils'

const DEFAULT_FEED_TYPES: PlaceType[] = ['restaurant', 'bar', 'night_club', 'cafe']

function toRad(value: number) {
  return (value * Math.PI) / 180
}

function getDistanceKm(
  lat: number,
  lng: number,
  refLat: number,
  refLng: number,
): number {
  const earthRadiusKm = 6371
  const dLat = toRad(lat - refLat)
  const dLng = toRad(lng - refLng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(refLat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function FeedSkeleton() {
  return (
    <div className="card-stack mx-auto h-full min-h-[500px] w-full max-w-[380px] lg:min-h-[560px] xl:min-h-[620px]">
      {[2, 1, 0].map((i) => (
        <div
          key={i}
          className="swipe-card"
          style={{
            transform: `scale(${1 - i * 0.04}) translateY(${i * 10}px)`,
            zIndex: 10 - i,
            opacity: 1 - i * 0.15,
          }}
        >
          <div className="flex h-full w-full flex-col overflow-hidden rounded-[30px] bg-card shadow-2xl lg:rounded-[36px]">
            <div className="relative shrink-0 basis-[62%]">
              <div className="shimmer absolute inset-0" />
              <div className="absolute left-4 top-4">
                <div className="h-6 w-24 rounded-full shimmer" style={{ background: 'rgba(255,255,255,0.12)' }} />
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-between p-5">
              <div className="space-y-2">
                <div className="shimmer h-6 w-3/4 rounded-xl" />
                <div className="shimmer h-3.5 w-full rounded-md" />
                <div className="shimmer h-3.5 w-2/3 rounded-md" />
                <div className="mt-1 flex items-center gap-2">
                  <div className="shimmer h-4 w-4 flex-shrink-0 rounded-full" />
                  <div className="shimmer h-3.5 w-28 rounded-md" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="shimmer h-4 w-4 flex-shrink-0 rounded-full" />
                  <div className="shimmer h-3.5 w-36 rounded-md" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="shimmer h-6 w-6 rounded-full" />
                    <div className="shimmer h-3.5 w-24 rounded-md" />
                  </div>
                  <div className="shimmer h-7 w-20 rounded-full" />
                </div>
                <div className="flex items-center justify-center gap-6">
                  <div className="shimmer h-14 w-14 rounded-full" />
                  <div className="shimmer h-14 w-14 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function LocationRequired({
  locationError,
  onRequest,
}: {
  locationError: string | null
  onRequest: () => void
}) {
  const isDenied = locationError?.toLowerCase().includes('denied') || locationError?.toLowerCase().includes('denegado')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex h-full w-full flex-col items-center justify-center gap-6 px-6 text-center"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="flex h-20 w-20 items-center justify-center rounded-full border border-primary/40 bg-primary/10 shadow-lg shadow-primary/20"
      >
        <HiMapPin className="h-10 w-10 text-primary-light" />
      </motion.div>

      <div className="max-w-xs">
        <h2 className="text-xl font-bold text-white">
          {isDenied ? 'Permiso de ubicación denegado' : 'Activa tu ubicación'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          eMeet necesita tu ubicación para mostrarte los mejores eventos y lugares cerca de ti.
        </p>
        {isDenied && (
          <p className="mt-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            El permiso fue denegado. Ve a la configuración de tu navegador → Privacidad → Ubicación y activa el permiso para este sitio.
          </p>
        )}
      </div>

      <button
        onClick={onRequest}
        className="rounded-full bg-primary px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary-dark active:scale-95"
      >
        {isDenied ? 'Reintentar' : 'Activar ubicación'}
      </button>
    </motion.div>
  )
}

function CommunityEventCard({
  event,
  isLiked,
  isSaved,
  onLike,
  onSave,
}: {
  event: Event
  isLiked: boolean
  isSaved: boolean
  onLike: () => void
  onSave: () => void
}) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-white/8 bg-card/80 transition-all hover:border-primary/30">
      <div className="relative h-28 overflow-hidden">
        <img
          src={event.imageUrl}
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
          {CATEGORY_EMOJI[event.category]} {event.category}
        </span>
        <span
          className={`absolute bottom-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            event.price === null
              ? 'bg-green-500/30 text-green-300'
              : 'bg-primary/30 text-primary-light'
          }`}
        >
          {formatPrice(event.price)}
        </span>
      </div>

      <div className="p-3">
        <h3 className="mb-1.5 line-clamp-1 text-sm font-bold text-white">{event.title}</h3>

        <div className="mb-3 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-[11px] text-white/55">
            <HiClock className="h-3 w-3 flex-shrink-0 text-primary-light" />
            <span>{formatEventDate(event.date)}</span>
          </div>
          {event.address && (
            <div className="flex items-center gap-1.5 text-[11px] text-white/55">
              <HiMapPin className="h-3 w-3 flex-shrink-0 text-primary-light" />
              <span className="truncate">{event.address}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onLike}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-semibold transition-all ${
              isLiked
                ? 'border border-green-500/40 bg-green-500/20 text-green-300'
                : 'border border-white/10 bg-white/5 text-white/60 hover:border-green-400/40 hover:text-green-300'
            }`}
          >
            <HiHeart className="h-3.5 w-3.5" />
            {isLiked ? 'Interesado' : 'Me interesa'}
          </button>
          <button
            onClick={onSave}
            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border transition-all ${
              isSaved
                ? 'border-primary/50 bg-primary/20 text-primary-light'
                : 'border-white/10 bg-white/5 text-white/50 hover:border-primary/30 hover:text-primary-light'
            }`}
            aria-label="Guardar evento"
          >
            <HiBookmark className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function CommunityEventsPanel({
  events,
  onLike,
  onSave,
  likedIds,
  savedIds,
}: {
  events: Event[]
  onLike: (id: string) => void
  onSave: (id: string) => void
  likedIds: Set<string>
  savedIds: Set<string>
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex flex-shrink-0 items-center gap-2">
        <h2 className="text-sm font-bold text-white">Eventos de la comunidad</h2>
        {events.length > 0 && (
          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary-light">
            {events.length}
          </span>
        )}
      </div>

      {events.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 px-4 text-center">
          <span className="text-3xl">🎪</span>
          <p className="text-xs text-muted">
            Aún no hay eventos de la comunidad. ¡Sé el primero en crear uno!
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
          {events.map((event) => (
            <CommunityEventCard
              key={event.id}
              event={event}
              isLiked={likedIds.has(event.id)}
              isSaved={savedIds.has(event.id)}
              onLike={() => onLike(event.id)}
              onSave={() => onSave(event.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function HomePageContent() {
  const {
    places,
    excludePlace,
    userLocation,
    loading,
    locating,
    locationError,
    invalidApiKey,
    selectedPlaceTypes,
    selectedDistanceKm,
    requestUserLocation,
    resetExcludedPlaces,
    setDistanceKm,
    togglePlaceType,
    refreshPlaces,
    setSelectedDestination,
    setActiveEventLocation,
  } = useNearbyPlacesContext()
  const { reloadRooms } = useChatContext()
  const { user, updateUser } = useAuth()
  const { publicLocatarioEvents } = useLocatarioEvents()
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'like' | 'nope' | 'save' } | null>(null)
  const [mobileView, setMobileView] = useState<'cards' | 'map' | 'comunidad'>('cards')

  useEffect(() => {
    if (!user) {
      setLikedIds(new Set())
      setSavedIds(new Set())
      return
    }
    setLikedIds(new Set(user.likedEvents))
    setSavedIds(new Set(user.savedEvents))
  }, [user])

  const events = useMemo(() => {
    if (!userLocation) return []

    const placeEvents = places
      .filter((place) => selectedPlaceTypes.includes(place.type))
      .map((place) => {
        const distance = getDistanceKm(place.position.lat, place.position.lng, userLocation.lat, userLocation.lng)
        return placeToEvent(place, distance)
      })

    const locatarioMapped = publicLocatarioEvents
      .filter((e) => e.lat != null && e.lng != null)
      .map((e) => ({
        ...e,
        distance: getDistanceKm(e.lat!, e.lng!, userLocation.lat, userLocation.lng),
      }))

    return [...placeEvents, ...locatarioMapped]
      .filter((event) => event.distance <= selectedDistanceKm)
      .sort((a, b) => a.distance - b.distance)
      .filter((event) => !dismissedIds.has(event.id))
      .map((event) => ({
        ...event,
        isLiked: likedIds.has(event.id),
        isSaved: savedIds.has(event.id),
      }))
  }, [dismissedIds, likedIds, places, publicLocatarioEvents, savedIds, selectedDistanceKm, selectedPlaceTypes, userLocation])

  function showToast(message: string, type: 'like' | 'nope' | 'save') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 1800)
  }

  const handleSwipeRight = useCallback(async (id: string) => {
    const likedEvent = events.find((event) => event.id === id) ??
      publicLocatarioEvents.find((event) => event.id === id)

    if (!user || !likedEvent) {
      showToast('Inicia sesión para guardar tus likes.', 'nope')
      return
    }

    setLikedIds((prev) => new Set(prev).add(id))
    setDismissedIds((prev) => new Set(prev).add(id))
    excludePlace(id)
    showToast('¡Te interesa! Ruta en el mapa 🗺️', 'like')

    // Activar ruta en el mapa: Google Maps place tiene placeId, locatario usa coordenadas
    const likedPlace = places.find((p) => p.placeId === likedEvent.id)
    if (likedPlace) {
      setSelectedDestination({
        placeId: likedEvent.id,
        title: likedEvent.title,
        position: likedPlace.position,
      })
    } else if (likedEvent.lat != null && likedEvent.lng != null) {
      setSelectedDestination({
        title: likedEvent.title,
        position: { lat: likedEvent.lat, lng: likedEvent.lng },
      })
    }

    // Cambiar a vista mapa en mobile tras el like
    setMobileView('map')

    try {
      await updateUser({ likedEvents: Array.from(new Set([...(user.likedEvents ?? []), likedEvent.id])) })
    } catch { /* fallo silencioso */ }

    if (hasSupabaseEnv) {
      try {
        await fetchApi('/events/like', {
          method: 'POST',
          body: JSON.stringify({
            eventId: likedEvent.id,
            eventTitle: likedEvent.title,
            eventImageUrl: likedEvent.imageUrl,
            eventAddress: likedEvent.address,
            eventDate: likedPlace ? null : likedEvent.date ?? null,
          }),
        })
        await reloadRooms()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        console.error('[handleSwipeRight] like/chat error:', message)
        if (message.toLowerCase().includes('sesión') || message.toLowerCase().includes('token')) {
          showToast('Tu sesión expiró. Inicia sesión nuevamente.', 'nope')
        } else {
          showToast(`No se pudo crear el chat: ${message}`, 'nope')
        }
      }
    }
  }, [events, excludePlace, places, publicLocatarioEvents, reloadRooms, setSelectedDestination, updateUser, user])

  const handleSwipeLeft = useCallback((id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id))
    excludePlace(id)
    showToast('No es para ti', 'nope')
  }, [excludePlace])

  const handleSave = useCallback(async (id: string) => {
    if (!user) {
      showToast('Inicia sesión para guardar eventos.', 'nope')
      return
    }

    const eventToSave = events.find((event) => event.id === id) ??
      publicLocatarioEvents.find((event) => event.id === id)
    if (!eventToSave) return

    const isCurrentlySaved = savedIds.has(id)
    const nextSaved = new Set(savedIds)
    if (nextSaved.has(id)) nextSaved.delete(id)
    else nextSaved.add(id)
    setSavedIds(nextSaved)

    if (hasSupabaseEnv) {
      const supabase = getSupabaseBrowserClient()
      try {
        if (isCurrentlySaved) {
          const { error } = await supabase
            .from('user_events')
            .delete()
            .eq('user_id', user.id)
            .eq('event_id', id)
            .eq('action', 'save')
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('user_events')
            .insert({
              user_id: user.id,
              event_id: eventToSave.id,
              event_title: eventToSave.title,
              event_image_url: eventToSave.imageUrl ?? null,
              event_address: eventToSave.address ?? null,
              action: 'save',
              created_at: new Date().toISOString(),
            })
          if (error && error.code !== '23505') throw error
        }
      } catch (err) {
        console.error('[handleSave] Supabase error:', err)
        setSavedIds(savedIds)
        try {
          await updateUser({ savedEvents: Array.from(savedIds) })
        } catch { /* fallo silencioso */ }
        const code = (err as { code?: string })?.code ?? 'unknown'
        showToast(`No se pudo guardar (${code})`, 'nope')
        return
      }
    }

    try {
      await updateUser({ savedEvents: Array.from(nextSaved) })
    } catch { /* fallo silencioso */ }

    showToast(!isCurrentlySaved ? 'Evento guardado 🔖' : 'Quitado de guardados', 'save')
  }, [events, publicLocatarioEvents, savedIds, updateUser, user])

  const visibleEvents = events.slice(0, 3)

  useEffect(() => {
    const active = visibleEvents[0]
    if (!active) { setActiveEventLocation(null); return }

    if (active.lat != null && active.lng != null) {
      setActiveEventLocation({ id: active.id, lat: active.lat, lng: active.lng, title: active.title })
    } else {
      const place = places.find(p => p.placeId === active.id)
      if (place) {
        setActiveEventLocation({ id: active.id, lat: place.position.lat, lng: place.position.lng, title: active.title })
      } else {
        setActiveEventLocation(null)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleEvents[0]?.id])

  const activeFilterCount =
    (selectedDistanceKm !== 3 ? 1 : 0) +
    (selectedPlaceTypes.length !== DEFAULT_FEED_TYPES.length ? 1 : 0)

  function restoreDefaultFilters() {
    setDistanceKm(3)
    const selectedSet = new Set(selectedPlaceTypes)
    const defaultSet = new Set(DEFAULT_FEED_TYPES)
    selectedPlaceTypes.forEach((type) => { if (!defaultSet.has(type)) togglePlaceType(type) })
    DEFAULT_FEED_TYPES.forEach((type) => { if (!selectedSet.has(type)) togglePlaceType(type) })
  }

  return (
    <Layout showDesktopMap>
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
        <AnimatePresence>
          {toast && (
            <motion.div
              key="toast"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`absolute top-3 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-2 text-sm font-semibold shadow-lg ${
                toast.type === 'like'
                  ? 'bg-green-500 text-white'
                  : toast.type === 'nope'
                    ? 'bg-red-500 text-white'
                    : 'bg-primary text-white'
              }`}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex min-h-0 flex-1 gap-4 px-4 pb-4 pt-3 lg:px-5 lg:pb-5 lg:pt-2">

          {/* Toggle Tarjetas / Mapa / Comunidad — solo mobile */}
          <div className="absolute left-1/2 top-2 z-30 -translate-x-1/2 lg:hidden">
            <div className="flex rounded-full border border-white/15 bg-white/10 p-1 shadow-lg backdrop-blur-md">
              {(['cards', 'map', 'comunidad'] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setMobileView(view)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    mobileView === view
                      ? 'bg-primary text-white shadow-md'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {view === 'cards' ? 'Tarjetas' : view === 'map' ? 'Mapa' : 'Comunidad'}
                </button>
              ))}
            </div>
          </div>

          {/* Vista mapa en móvil */}
          {mobileView === 'map' && (
            <div className="absolute inset-0 lg:hidden">
              <BellavistaMapMobile />
            </div>
          )}

          {/* Vista comunidad en móvil */}
          {mobileView === 'comunidad' && (
            <div className="absolute inset-0 overflow-y-auto pt-12 lg:hidden">
              <div className="px-4 pb-4">
                <CommunityEventsPanel
                  events={publicLocatarioEvents}
                  onLike={handleSwipeRight}
                  onSave={handleSave}
                  likedIds={likedIds}
                  savedIds={savedIds}
                />
              </div>
            </div>
          )}

          {/* Botón filtros — solo desktop */}
          <div className="absolute right-4 top-2 z-30 hidden lg:block lg:right-5">
            <button
              type="button"
              onClick={() => setIsFiltersOpen((v) => !v)}
              className={`rounded-full border px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur-md transition-colors ${
                isFiltersOpen || activeFilterCount > 0
                  ? 'border-primary/70 bg-primary/20 text-primary-light'
                  : 'border-white/20 bg-surface/70 text-slate-200 hover:border-white/40'
              }`}
            >
              Filtros {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
            </button>

            <AnimatePresence>
              {isFiltersOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className="mt-3 w-[320px] rounded-2xl border border-white/10 bg-card/95 p-3 shadow-2xl backdrop-blur-lg"
                >
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-300">Opciones de filtro</p>
                  <div className="space-y-3">
                    <div>
                      <p className="mb-1 text-[11px] font-semibold text-muted">Distancia</p>
                      <DistanceFilter
                        selectedKm={selectedDistanceKm}
                        onChange={setDistanceKm}
                        className="flex flex-wrap gap-2"
                      />
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-semibold text-muted">Tipos de lugar</p>
                      <PlaceTypeFilters
                        selectedTypes={selectedPlaceTypes}
                        onToggleType={togglePlaceType}
                        className="flex flex-wrap gap-2"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={restoreDefaultFilters}
                      className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-white/40"
                    >
                      Limpiar filtros
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFiltersOpen(false)}
                      className="rounded-full border border-primary/60 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary-light"
                    >
                      Aplicar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Contenido principal: Tarjetas + Panel comunidad */}
          <div
            className={`${mobileView !== 'cards' ? 'hidden lg:flex' : 'flex'} min-h-0 h-full w-full gap-5`}
          >
            {/* Área de tarjetas */}
            <div className="flex h-full min-h-0 flex-1 items-center justify-center">
              {invalidApiKey ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
                  <span className="text-5xl">🔑</span>
                  <h2 className="text-xl font-bold text-white">Configura tu API key de Google Maps</h2>
                  <p className="text-sm text-muted">El feed de eventos cercanos usa lugares reales según tu ubicación.</p>
                </div>
              ) : locating || (!userLocation && !locationError) ? (
                <FeedSkeleton />
              ) : !userLocation ? (
                <LocationRequired locationError={locationError} onRequest={() => requestUserLocation()} />
              ) : loading ? (
                <FeedSkeleton />
              ) : visibleEvents.length > 0 ? (
                <div className="card-stack mx-auto h-full min-h-[500px] w-full max-w-[380px] lg:min-h-[560px] xl:min-h-[620px]">
                  {[...visibleEvents].reverse().map((event, reverseIndex) => {
                    const stackIndex = visibleEvents.length - 1 - reverseIndex
                    return (
                      <SwipeCard
                        key={event.id}
                        event={event}
                        stackIndex={stackIndex}
                        onSwipeRight={handleSwipeRight}
                        onSwipeLeft={handleSwipeLeft}
                        onSave={handleSave}
                      />
                    )
                  })}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center"
                >
                  <span className="text-6xl">🎉</span>
                  <h2 className="text-2xl font-bold text-white">No quedan más lugares cercanos</h2>
                  <p className="text-sm text-muted">Ya recorriste los resultados cercanos a tu ubicación actual.</p>
                  <div className="mt-2 flex flex-col items-center gap-3">
                    <button
                      onClick={() => {
                        setDismissedIds(new Set())
                        resetExcludedPlaces()
                        refreshPlaces()
                      }}
                      className="rounded-full bg-primary px-6 py-3 font-semibold text-white transition-colors active:scale-95 hover:bg-primary-dark"
                    >
                      Ver de nuevo
                    </button>
                    <button
                      onClick={() => requestUserLocation(true)}
                      className="text-sm font-medium text-primary-light"
                    >
                      Actualizar mi ubicación
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Panel eventos de la comunidad — solo desktop */}
            <div className="hidden h-full w-72 flex-shrink-0 xl:w-80 lg:flex flex-col">
              <CommunityEventsPanel
                events={publicLocatarioEvents}
                onLike={handleSwipeRight}
                onSave={handleSave}
                likedIds={likedIds}
                savedIds={savedIds}
              />
            </div>
          </div>
        </div>

        {visibleEvents.length > 0 && mobileView === 'cards' && (
          <div className="flex items-center justify-center gap-3 px-4 pb-2 lg:px-5 lg:pb-3">
            <span className="text-xs text-muted">{events.length} lugares cerca de ti</span>
            {likedIds.size > 0 && (
              <span className="text-xs font-medium text-green-400">· {likedIds.size} te interesaron</span>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default function HomePage() {
  return (
    <NearbyPlacesProvider>
      <HomePageContent />
    </NearbyPlacesProvider>
  )
}
