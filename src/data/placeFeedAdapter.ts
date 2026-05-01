import type { Event, EventCategory, ScrapedPlace } from '../types'

const PLACE_FALLBACK_IMAGES: Record<ScrapedPlace['type'], string> = {
  restaurant:         'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=80',
  cafe:               'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&q=80',
  bar:                'https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?w=1200&q=80',
  night_club:         'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80',
  liquor_store:       'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=80',
  food:               'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80',
  gym:                'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80',
  stadium:            'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1200&q=80',
  park:               'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=80',
  museum:             'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
  art_gallery:        'https://images.unsplash.com/photo-1464378688699-8a81dff3f82d?w=1200&q=80',
  movie_theater:      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80',
  tourist_attraction: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200&q=80',
}

const PLACE_CATEGORY_MAP: Record<ScrapedPlace['type'], EventCategory> = {
  restaurant:         'gastronomia',
  cafe:               'gastronomia',
  food:               'gastronomia',
  bar:                'fiesta',
  night_club:         'musica',
  liquor_store:       'fiesta',
  gym:                'deporte',
  stadium:            'deporte',
  park:               'deporte',
  museum:             'cultura',
  art_gallery:        'arte',
  movie_theater:      'teatro',
  tourist_attraction: 'cultura',
}

const PLACE_CATEGORY_LABEL: Record<ScrapedPlace['type'], string> = {
  restaurant:         'Restaurante',
  cafe:               'Café',
  food:               'Comida',
  bar:                'Bar',
  night_club:         'Discoteca',
  liquor_store:       'Licorería',
  gym:                'Gimnasio',
  stadium:            'Estadio',
  park:               'Parque',
  museum:             'Museo',
  art_gallery:        'Galería de Arte',
  movie_theater:      'Cine / Teatro',
  tourist_attraction: 'Atracción Turística',
}

function formatPlaceDescription(place: ScrapedPlace) {
  const parts = [PLACE_CATEGORY_LABEL[place.type], place.address]

  if (place.rating > 0) {
    parts.push(`rating ${place.rating.toFixed(1)}`)
  }

  if (place.isOpen !== null) {
    parts.push(place.isOpen ? 'abierto ahora' : 'cerrado actualmente')
  }

  return parts.join(' · ')
}

function formatPriceEstimate(priceLevel: number | null) {
  if (priceLevel == null) return null
  return Math.max(0, priceLevel) * 8000
}

function nextRelevantDate(place: ScrapedPlace) {
  const now = new Date()
  if (place.type === 'night_club' || place.type === 'bar') {
    now.setHours(22, 0, 0, 0)
  } else {
    now.setHours(20, 0, 0, 0)
  }
  return now.toISOString()
}

function resolvePlaceImage(place: ScrapedPlace) {
  const googlePhoto = place.photoUrl?.trim()
  if (googlePhoto) return googlePhoto
  return PLACE_FALLBACK_IMAGES[place.type]
}

function normalizeExternalUrl(url?: string | null) {
  const value = url?.trim()
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value}`
}

export function placeToEvent(place: ScrapedPlace, distanceKm: number): Event {
  return {
    id: place.placeId,
    title: place.name,
    description: formatPlaceDescription(place),
    category: PLACE_CATEGORY_MAP[place.type],
    date: nextRelevantDate(place),
    location: place.name,
    address: place.address,
    distance: Number(distanceKm.toFixed(1)),
    price: formatPriceEstimate(place.priceLevel),
    imageUrl: resolvePlaceImage(place),
    websiteUrl: normalizeExternalUrl(place.website),
    organizerName: place.category,
    organizerAvatar: `https://api.dicebear.com/9.x/shapes/svg?seed=${place.placeId}`,
    attendees: Math.max(0, place.totalRatings),
    capacity: null,
    tags: [place.category.toLowerCase(), place.type.replace('_', ' ')],
    isLiked: false,
    isSaved: false,
    rating: place.rating > 0 ? place.rating : undefined,
    isOpen: place.isOpen,
  }
}