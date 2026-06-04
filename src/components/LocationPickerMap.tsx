'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { GoogleMap, OverlayView, useJsApiLoader } from '@react-google-maps/api'
import type { Libraries } from '@react-google-maps/api'
import { FiNavigation, FiLoader, FiSearch } from 'react-icons/fi'

const LIBRARIES: Libraries = ['places']

const DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#16213e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8896aa' }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#4a5568' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#262d46' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6b7a8d' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#3b4878' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b1522' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d597a' }] },
]

const MAP_OPTIONS: google.maps.MapOptions = {
  styles: DARK_STYLE,
  disableDefaultUI: true,
  clickableIcons: false,
  gestureHandling: 'greedy',
}

const DEFAULT_CENTER: google.maps.LatLngLiteral = { lat: -33.4364, lng: -70.6358 }
const GOOGLE_MAPS_API_KEY = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '').trim()

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`,
    )
    const data = (await res.json()) as { display_name?: string }
    return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
}

interface LocationPickerMapProps {
  value: { lat: number; lng: number } | null
  /** Dirección actual resuelta (controla el texto del buscador). */
  address?: string
  onLocationChange: (coords: { lat: number; lng: number }, address: string) => void
  /** Se llama cuando el usuario escribe libremente sin elegir una sugerencia. */
  onAddressChange?: (address: string) => void
}

export function LocationPickerMap({
  value,
  address = '',
  onLocationChange,
  onAddressChange,
}: LocationPickerMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'script-loader',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
    version: 'weekly',
  })

  const [gpsLoading, setGpsLoading] = useState(false)
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)
  const [inputValue, setInputValue] = useState(address)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  // Sincroniza el texto del buscador cuando la dirección resuelta cambia
  // desde fuera (click en el mapa, GPS o estado del formulario).
  useEffect(() => {
    setInputValue(address)
  }, [address])

  const onLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map)
  }, [])

  useEffect(() => {
    if (value && mapInstance) {
      mapInstance.panTo(value)
      mapInstance.setZoom(16)
    }
  }, [value, mapInstance])

  // Inicializa el autocompletado de Google Places sobre el input de búsqueda.
  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return
    if (!window.google?.maps?.places) return

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['geometry', 'formatted_address', 'name'],
      componentRestrictions: { country: 'cl' },
    })
    autocompleteRef.current = autocomplete

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      const loc = place.geometry?.location
      if (!loc) return
      const lat = loc.lat()
      const lng = loc.lng()
      const resolved = place.formatted_address || place.name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      setInputValue(resolved)
      onLocationChange({ lat, lng }, resolved)
    })

    return () => listener.remove()
  }, [isLoaded, onLocationChange])

  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return
    const lat = e.latLng.lat()
    const lng = e.latLng.lng()
    const resolved = await reverseGeocode(lat, lng)
    setInputValue(resolved)
    onLocationChange({ lat, lng }, resolved)
  }, [onLocationChange])

  const handleGPS = useCallback(async () => {
    if (!navigator.geolocation) return
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const lat = coords.latitude
        const lng = coords.longitude
        const resolved = await reverseGeocode(lat, lng)
        setInputValue(resolved)
        onLocationChange({ lat, lng }, resolved)
        setGpsLoading(false)
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [onLocationChange])

  // Buscador de dirección reutilizable (con o sin Google cargado).
  const searchInput = (
    <div className="relative">
      <FiSearch
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-300/50"
      />
      <input
        ref={inputRef}
        type="text"
        placeholder="Escribe una dirección (ej. Av. Providencia 1234)"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value)
          onAddressChange?.(e.target.value)
        }}
        // Evita que Enter envíe el formulario al elegir una sugerencia.
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault()
        }}
        className="w-full rounded-xl border border-violet-500/20 bg-violet-500/8 py-2.5 pl-9 pr-3 text-sm text-white placeholder-violet-300/30 outline-none transition-colors focus:border-violet-500/70"
      />
    </div>
  )

  if (!GOOGLE_MAPS_API_KEY) {
    // Sin API key: al menos permite escribir la dirección manualmente.
    return (
      <div className="space-y-2">
        {searchInput}
        <div className="h-40 rounded-xl bg-surface border border-card flex flex-col items-center justify-center gap-2 text-center px-4">
          <span className="text-2xl">🗺️</span>
          <p className="text-muted text-xs">
            Configura <code className="text-primary-light">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> para activar el mapa y las sugerencias.
          </p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="space-y-2">
        {searchInput}
        <div className="h-40 rounded-xl bg-surface border border-card flex items-center justify-center text-red-400 text-xs">
          Error al cargar el mapa
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="space-y-2">
        {searchInput}
        <div className="h-40 rounded-xl bg-surface border border-card flex items-center justify-center gap-2 text-muted text-sm">
          <FiLoader className="animate-spin" size={15} />
          Cargando mapa...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
    {searchInput}
    <div className="relative rounded-xl overflow-hidden border border-card">
      <div style={{ height: '192px' }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={value ?? DEFAULT_CENTER}
          zoom={value ? 16 : 13}
          options={MAP_OPTIONS}
          onLoad={onLoad}
          onClick={handleMapClick}
        >
          {value && (
            <OverlayView
              position={value}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              getPixelPositionOffset={(w, h) => ({ x: -w / 2, y: -h })}
            >
              <div className="flex flex-col items-center pointer-events-none">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(139,92,246,0.92)',
                    border: '2.5px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 0 7px rgba(139,92,246,0.22), 0 4px 16px rgba(0,0,0,0.55)',
                  }}
                >
                  <span style={{ fontSize: 15, lineHeight: 1 }}>📍</span>
                </div>
                <div style={{
                  width: 0, height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: '7px solid rgba(139,92,246,0.92)',
                }} />
              </div>
            </OverlayView>
          )}
        </GoogleMap>
      </div>

      <div className="absolute top-2 left-2 bg-black/70 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white/55 backdrop-blur-sm pointer-events-none select-none">
        Toca el mapa para fijar la ubicación
      </div>

      <button
        type="button"
        onClick={handleGPS}
        disabled={gpsLoading}
        className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/80 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-primary-light backdrop-blur-sm hover:bg-black transition-colors disabled:opacity-50"
      >
        {gpsLoading ? <FiLoader className="animate-spin" size={11} /> : <FiNavigation size={11} />}
        Mi ubicación
      </button>
    </div>
    </div>
  )
}
