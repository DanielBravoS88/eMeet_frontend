import type { ScrapedPlace, PlaceType } from '../types'
import { requireBackendUrl } from '../lib/backend'

const PLACES_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_PLACES_TIMEOUT_MS ?? 9000)

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

async function fetchJsonWithTimeout<T>(input: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), Math.max(1000, PLACES_TIMEOUT_MS))

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    })
    const payload = await response.json()

    if (!response.ok) {
      const message =
        typeof payload === 'object' && payload !== null && 'message' in payload
          ? String((payload as { message?: unknown }).message ?? `HTTP ${response.status}`)
          : `HTTP ${response.status}`

      throw new Error(message)
    }

    return payload as T
  } finally {
    clearTimeout(timeoutId)
  }
}

// ─── Configuración visual por tipo de lugar ──────────────────────────────────

export const PLACE_TYPE_CONFIG: Record<
  PlaceType,
  { category: string; emoji: string; color: string }
> = {
  restaurant:         { category: 'Restaurante',    emoji: '🍽️', color: '#F97316' },
  cafe:               { category: 'Café',            emoji: '☕',  color: '#A1662F' },
  bar:                { category: 'Bar',             emoji: '🍺',  color: '#F59E0B' },
  night_club:         { category: 'Discoteca',       emoji: '🎵',  color: '#EC4899' },
  liquor_store:       { category: 'Licorería',       emoji: '🍷',  color: '#8B5CF6' },
  food:               { category: 'Comida',          emoji: '🍴',  color: '#10B981' },
  gym:                { category: 'Gimnasio',        emoji: '💪',  color: '#06B6D4' },
  stadium:            { category: 'Estadio',         emoji: '🏟️', color: '#22C55E' },
  park:               { category: 'Parque',          emoji: '🌳',  color: '#84CC16' },
  museum:             { category: 'Museo',           emoji: '🏛️', color: '#6366F1' },
  art_gallery:        { category: 'Galería de Arte', emoji: '🎨',  color: '#D946EF' },
  movie_theater:      { category: 'Cine / Teatro',   emoji: '🎬',  color: '#F43F5E' },
  tourist_attraction: { category: 'Atracción',       emoji: '🗺️', color: '#0EA5E9' },
}

// ─── Mapeo de PlaceType a Google Places type ────────────────────────────────

const PLACE_TYPE_MAPPING: Record<PlaceType, string> = {
  restaurant:         'restaurant',
  bar:                'bar',
  night_club:         'night_club',
  cafe:               'cafe',
  liquor_store:       'liquor_store',
  food:               'food',
  gym:                'gym',
  stadium:            'stadium',
  park:               'park',
  museum:             'museum',
  art_gallery:        'art_gallery',
  movie_theater:      'movie_theater',
  tourist_attraction: 'tourist_attraction',
}

interface GooglePlaceSearchResult {
  place_id?: string
  name?: string
  formatted_address?: string
  geometry?: {
    location?: {
      lat?: number
      lng?: number
    }
  }
  rating?: number
  user_ratings_total?: number
  photos?: Array<{ photo_reference?: string }>
}

interface PlacesSearchNearbyResponse {
  places?: GooglePlaceSearchResult[]
}

function buildPhotoProxyUrl(photoReference: string, maxWidth: number) {
  const params = new URLSearchParams({
    photoReference,
    maxWidth: String(maxWidth),
  })
  return `${requireBackendUrl('lugares cercanos')}/places/photo?${params.toString()}`
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function boundsToCircle(
  bounds: google.maps.LatLngBounds,
): { center: { lat: number; lng: number }; radius: number } {
  if (!bounds || typeof bounds.getCenter !== 'function' || typeof bounds.getNorthEast !== 'function') {
    throw new Error('Google Maps bounds no disponibles')
  }

  const center = bounds.getCenter()
  const ne = bounds.getNorthEast()

  if (!center || !ne || typeof center.lat !== 'function' || typeof ne.lat !== 'function') {
    throw new Error('Google Maps bounds incompletos')
  }

  const R = 6371000 // Radio de la Tierra en metros
  const lat1 = center.lat() * (Math.PI / 180)
  const lat2 = ne.lat() * (Math.PI / 180)
  const dLat = lat2 - lat1
  const dLng = (ne.lng() - center.lng()) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  const radius = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return {
    center: { lat: center.lat(), lng: center.lng() },
    radius: Math.max(500, radius),
  }
}

// ─── API pública (ahora llamando al backend) ─────────────────────────────────

/**
 * Busca lugares cercanos usando el backend como intermediario
 * El backend llama a Google Places API y retorna los resultados
 */
export async function searchNearbyPlaces(
  bounds: google.maps.LatLngBounds | null | undefined,
  types: PlaceType[],
  maxPerType = 8,
): Promise<ScrapedPlace[]> {
  const backendUrl = requireBackendUrl('lugares cercanos')
  if (!bounds) {
    throw new Error('No se pudo calcular el area de busqueda del mapa')
  }

  try {
    const { center, radius } = boundsToCircle(bounds)
    const allPlaces: ScrapedPlace[] = []
    const seenIds = new Set<string>()
    const seenNames = new Set<string>()

    // Buscar cada tipo en paralelo
    const searches = types.map((type) =>
      fetchJsonWithTimeout<PlacesSearchNearbyResponse>(`${backendUrl}/places/search-nearby`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: center,
          radius,
          type: PLACE_TYPE_MAPPING[type],
        }),
      })
        .then(async (payload): Promise<{ type: PlaceType; places: GooglePlaceSearchResult[] }> => {
          return { type, places: payload.places ?? [] }
        })
        .catch((err) => {
          if (isAbortError(err)) {
            console.warn(`Timeout searching ${type}`)
          } else {
            console.error(`Error searching ${type}:`, err)
          }
          return { type, places: [] }
        }),
    )

    const results = await Promise.all(searches)

    // Procesar y deduplicar resultados
    results.forEach(({ type, places }) => {
      places.forEach((place) => {
        const name = place.name || 'Sin nombre'
        const nameKey = name.toLowerCase()
        const placeId = place.place_id || ''

        if (placeId && seenIds.has(placeId)) return
        if (seenNames.has(nameKey)) return
        if (placeId) seenIds.add(placeId)
        seenNames.add(nameKey)

        const lat = place.geometry?.location?.lat
        const lng = place.geometry?.location?.lng

        if (typeof lat !== 'number' || typeof lng !== 'number') return

        allPlaces.push({
          placeId,
          name,
          address: place.formatted_address || '',
          type,
          category: PLACE_TYPE_CONFIG[type].category,
          rating: place.rating || 0,
          totalRatings: place.user_ratings_total || 0,
          priceLevel: null,
          isOpen: null,
          position: { lat, lng },
          photoUrl: place.photos?.[0]?.photo_reference
            ? buildPhotoProxyUrl(place.photos[0].photo_reference, 800)
            : undefined,
          website: undefined,
          phone: undefined,
          openingHours: undefined,
        })
      })
    })

    return allPlaces.slice(0, types.length * maxPerType)
  } catch (error) {
    console.error('Error in searchNearbyPlaces:', error)
    return []
  }
}

/**
 * Obtiene detalles enriquecidos de un lugar desde el backend
 */
export async function fetchPlaceDetails(placeId: string): Promise<Partial<ScrapedPlace>> {
  const backendUrl = requireBackendUrl('detalle de lugares')

  try {
    const { details } = await fetchJsonWithTimeout<{ details?: {
      photos?: Array<{ photo_reference?: string }>
      website?: string
      formatted_phone_number?: string
      international_phone_number?: string
      opening_hours?: { weekday_text?: string[] }
      rating?: number
    } | null }>(`${backendUrl}/places/${placeId}/details`)

    if (!details) {
      return { photoUrl: null, website: null, phone: null, openingHours: null }
    }

    return {
      photoUrl: details.photos?.[0]?.photo_reference
        ? buildPhotoProxyUrl(details.photos[0].photo_reference, 400)
        : null,
      website: details.website || null,
      phone: details.formatted_phone_number || details.international_phone_number || null,
      openingHours: details.opening_hours?.weekday_text || null,
      rating: details.rating || undefined,
    }
  } catch (error) {
    if (isAbortError(error)) {
      console.warn('Timeout in fetchPlaceDetails')
    } else {
      console.error('Error in fetchPlaceDetails:', error)
    }
    return { photoUrl: null, website: null, phone: null, openingHours: null }
  }
}
