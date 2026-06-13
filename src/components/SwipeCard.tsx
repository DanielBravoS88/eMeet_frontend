'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import type { PanInfo } from 'framer-motion'
import { HiMapPin, HiClock, HiUsers, HiGlobeAlt } from 'react-icons/hi2'
import { HiHeart, HiX, HiBookmark } from 'react-icons/hi'
import type { Event } from '../types'
import { formatEventDate, formatPrice, CATEGORY_COLORS, CATEGORY_EMOJI } from '../lib/eventUtils'

interface SwipeCardProps {
  event: Event
  onSwipeRight: (id: string) => void   // like
  onSwipeLeft: (id: string) => void    // descarte
  onSave: (id: string) => void
  /** Índice en el stack (0 = carta superior/activa) */
  stackIndex: number
}

// ─── Umbral de px para considerar un swipe válido ────────────────────────────
const SWIPE_THRESHOLD = 120
// Un flick rápido cuenta como swipe aunque no alcance el umbral de distancia
const VELOCITY_THRESHOLD = 500

function StarRating({ rating }: { rating: number }) {
  const filled = Math.round(rating)
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-amber-300/35 bg-black/35 px-2.5 py-1 backdrop-blur-sm">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`text-sm leading-none ${i < filled ? 'text-amber-300' : 'text-white/25'}`}>★</span>
      ))}
      <span className="ml-1 text-[11px] font-bold text-amber-100">{rating.toFixed(1)}</span>
    </div>
  )
}

/**
 * SwipeCard — Tarjeta de evento con interacción de swipe.
 *
 * Tecnología: Framer Motion para el gesto de arrastre + animación de salida.
 *
 * Mecánica:
 *  • Arrastrar la tarjeta activa (stackIndex === 0).
 *  • Si el usuario suelta con x > SWIPE_THRESHOLD → swipe right (like).
 *  • Si el usuario suelta con x < -SWIPE_THRESHOLD → swipe left (descarte).
 *  • Las tarjetas de abajo se escalan y apilan visualmente (z-index + scale).
 *
 * Props:
 *  - onSwipeRight / onSwipeLeft: callbacks al padre para actualizar el estado.
 *  - stackIndex: determina escala y opacidad de fondo.
 */
export default function SwipeCard({
  event,
  onSwipeRight,
  onSwipeLeft,
  onSave,
  stackIndex,
}: SwipeCardProps) {
  const x = useMotionValue(0)
  const [isDragging, setIsDragging] = useState(false)

  // Rotación proporcional al arrastre horizontal
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15])

  // Opacidad de los indicadores LIKE / NOPE
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1])
  const nopeOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0])

  // Escala de las tarjetas de fondo
  const scale = 1 - stackIndex * 0.04
  const yOffset = stackIndex * 10

  const cardRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [audioBlocked, setAudioBlocked] = useState(false)

  const isActive = stackIndex === 0
  const hasAudio = Boolean(event.audioPreviewUrl || event.audioTrackId)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (isActive) {
      video.play().catch(() => undefined)
    } else {
      video.pause()
    }
  }, [isActive])

  /**
   * Resuelve la URL de preview a usar. Las URLs guardadas en la base caducan
   * (Deezer las firma con un `exp`), así que si el evento trae el ID estable
   * del track pedimos un preview fresco a `/api/deezer/track`. La URL guardada
   * queda solo como respaldo (eventos antiguos sin ID).
   */
  async function resolveAudioUrl(): Promise<string | null> {
    if (event.audioTrackId) {
      try {
        const res = await fetch(`/api/deezer/track?id=${encodeURIComponent(event.audioTrackId)}`)
        if (res.ok) {
          const json = (await res.json()) as { preview?: string | null }
          if (json.preview) return json.preview
        }
      } catch {
        // cae al respaldo
      }
    }
    return event.audioPreviewUrl ?? null
  }

  // Reproducir/pausar audio preview de Deezer según carta activa
  useEffect(() => {
    if (!hasAudio) return

    let cancelled = false

    if (isActive) {
      ;(async () => {
        if (!audioRef.current) {
          const url = await resolveAudioUrl()
          if (cancelled || !url) {
            if (!url) setAudioBlocked(true)
            return
          }
          if (!audioRef.current) {
            const audio = new Audio(url)
            audio.loop = true
            audio.volume = 0.55
            audioRef.current = audio
          }
        }
        if (cancelled) return
        audioRef.current.play()
          .then(() => { setIsAudioPlaying(true); setAudioBlocked(false) })
          .catch(() => { setAudioBlocked(true); setIsAudioPlaying(false) })
      })()
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setIsAudioPlaying(false)
      }
    }

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, hasAudio, event.audioTrackId, event.audioPreviewUrl])

  // Limpiar audio al desmontar la carta
  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    setIsDragging(false)
    if (!isActive) return

    // Distancia o velocidad: un flick rápido vale como swipe completo
    const swipeRight = info.offset.x > SWIPE_THRESHOLD || info.velocity.x > VELOCITY_THRESHOLD
    const swipeLeft = info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -VELOCITY_THRESHOLD

    if (swipeRight) {
      // La carta sale conservando el impulso del gesto
      animate(x, 600, {
        type: 'spring',
        stiffness: 220,
        damping: 28,
        velocity: info.velocity.x,
        onComplete: () => onSwipeRight(event.id),
      })
    } else if (swipeLeft) {
      animate(x, -600, {
        type: 'spring',
        stiffness: 220,
        damping: 28,
        velocity: info.velocity.x,
        onComplete: () => onSwipeLeft(event.id),
      })
    } else {
      // Retorno elástico al centro, hereda la velocidad para no "cortar" el gesto
      animate(x, 0, { type: 'spring', stiffness: 420, damping: 28, velocity: info.velocity.x })
    }
  }

  return (
    <motion.div
      ref={cardRef}
      className="swipe-card"
      style={{
        x: isActive ? x : 0,
        rotate: isActive ? rotate : 0,
        zIndex: 10 - stackIndex,
        // Las cartas de fondo no reciben eventos de puntero
        pointerEvents: isActive ? 'auto' : 'none',
      }}
      // scale/y animados: al salir la carta superior, las de abajo suben con spring
      animate={{ scale, y: yOffset }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      drag={isActive ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragStart={() => {
        setIsDragging(true)
        if (audioBlocked && audioRef.current) {
          audioRef.current.play()
            .then(() => { setIsAudioPlaying(true); setAudioBlocked(false) })
            .catch(() => {})
        }
      }}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: isActive ? 1.02 : scale }}
    >
      {/* Tarjeta contenido */}
      <div className="relative h-full w-full overflow-hidden rounded-[30px] bg-card shadow-2xl select-none lg:rounded-[36px]">

        {/* Media de fondo: video promocional o imagen */}
        {event.videoUrl ? (
          <video
            ref={videoRef}
            src={event.videoUrl}
            muted
            playsInline
            loop
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        )}

        {/* Doble gradiente para elevar contraste en textos y badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

        {/* Badges top-left: categoría + estado abierto/cerrado */}
        <div className="absolute left-4 top-4 z-10 flex flex-col gap-1.5 lg:left-5 lg:top-5">
          <span
            className={`${CATEGORY_COLORS[event.category] ?? 'bg-purple-600'} rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white lg:px-4 lg:py-1.5`}
          >
            {CATEGORY_EMOJI[event.category]} {event.category}
          </span>
          {event.isOpen !== null && event.isOpen !== undefined && (
            <span
              className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur-md ${
                event.isOpen
                  ? 'border-green-300/50 bg-green-500/30 text-green-100 shadow-green-900/40'
                  : 'border-red-300/50 bg-red-500/30 text-red-100 shadow-red-900/40'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${event.isOpen ? 'bg-green-200' : 'bg-red-200'}`} />
              {event.isOpen ? 'Abierto' : 'Cerrado'}
            </span>
          )}
        </div>

        {/* Botón guardar (bookmark) */}
        {isActive && (
          <motion.button
            onClick={() => onSave(event.id)}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 lg:right-5 lg:top-5 lg:h-11 lg:w-11"
            aria-label="Guardar evento"
          >
            <motion.span
              key={event.isSaved ? 'saved' : 'unsaved'}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 600, damping: 15 }}
            >
              <HiBookmark className={`w-5 h-5 ${event.isSaved ? 'text-primary fill-current' : ''}`} />
            </motion.span>
          </motion.button>
        )}

        {/* Disco giratorio — se muestra cuando el evento tiene música */}
        {hasAudio && isActive && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (audioBlocked && audioRef.current) {
                audioRef.current.play()
                  .then(() => { setIsAudioPlaying(true); setAudioBlocked(false) })
                  .catch(() => {})
              }
            }}
            className="absolute right-4 top-[66px] z-10 h-11 w-11 lg:right-5 lg:top-[72px]"
            aria-label={audioBlocked ? 'Toca para escuchar música' : 'Música del evento'}
          >
            <div
              className={`relative h-full w-full rounded-full shadow-xl ${isAudioPlaying ? 'animate-spin' : ''}`}
              style={isAudioPlaying ? { animationDuration: '3s' } : undefined}
            >
              <div className="absolute inset-0 rounded-full bg-gray-950 border border-white/20" />
              <div className="absolute inset-[5px] rounded-full border border-white/[0.08]" />
              <div className="absolute inset-[9px] rounded-full border border-white/[0.08]" />
              <div className="absolute inset-[13px] rounded-full border border-white/[0.08]" />
              <div className="absolute inset-[17px] rounded-full bg-primary/90" />
              <div className="absolute inset-[22px] rounded-full bg-white/40" />
            </div>
          </button>
        )}

        {/* ── Indicadores de swipe ────────────────────────────────────────── */}
        {isActive && (
          <>
            {/* Indicador "VOY" cuando arrastra a la derecha */}
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute left-5 top-1/4 rounded-xl border-4 border-green-400 px-4 py-2 -rotate-12 lg:left-6"
            >
              <span className="text-2xl font-extrabold tracking-widest text-green-400 lg:text-3xl">VOY</span>
            </motion.div>

            {/* Indicador "PASO" cuando arrastra a la izquierda */}
            <motion.div
              style={{ opacity: nopeOpacity }}
              className="absolute right-5 top-1/4 rounded-xl border-4 border-red-400 px-4 py-2 rotate-12 lg:right-6"
            >
              <span className="text-2xl font-extrabold tracking-widest text-red-400 lg:text-3xl">PASO</span>
            </motion.div>
          </>
        )}

        {/* ── Info del evento (parte inferior) ────────────────────────────── */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 pb-20 transition-all duration-200 lg:p-5 lg:pb-24 ${isDragging ? 'opacity-80' : 'opacity-100'}`}>

          {event.rating && event.rating > 0 && (
            <div className="mb-1.5">
              <StarRating rating={event.rating} />
            </div>
          )}

          <h2 className="mb-1 line-clamp-2 text-lg font-bold leading-tight text-white lg:text-[1.55rem]">
            {event.title}
          </h2>

          <p className="mb-2 line-clamp-2 text-[13px] text-white/70 lg:text-sm lg:leading-5">
            {event.description}
          </p>

          {/* Meta información */}
          <div className="mb-3 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[13px] text-white/80 lg:text-sm">
              <HiClock className="w-4 h-4 flex-shrink-0 text-primary-light" />
              <span>{formatEventDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-white/80 lg:text-sm">
              <HiMapPin className="w-4 h-4 flex-shrink-0 text-primary-light" />
              <span className="truncate">{event.location}</span>
              <span className="text-white/50 text-xs flex-shrink-0">· {event.distance} km</span>
            </div>
            {event.capacity && (
              <div className="flex items-center gap-2 text-[13px] text-white/80 lg:text-sm">
                <HiUsers className="w-4 h-4 flex-shrink-0 text-primary-light" />
                <span>{event.attendees}/{event.capacity} asistentes</span>
              </div>
            )}
          </div>

          {/* Precio + Organizador */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={event.organizerAvatar}
                alt={event.organizerName}
                className="w-6 h-6 rounded-full border border-white/20"
              />
              <span className="max-w-[150px] truncate text-[11px] text-white/60 lg:max-w-[190px]">
                {event.organizerName}
              </span>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                event.price === null
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-primary/20 text-primary-light'
              }`}
            >
              {formatPrice(event.price)}
            </span>
          </div>

          {event.websiteUrl && (
            <div className="mt-2.5">
              <a
                href={event.websiteUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-200 backdrop-blur-sm transition-colors hover:bg-cyan-500/20"
              >
                <HiGlobeAlt className="h-4 w-4" />
                Ver sitio web
              </a>
            </div>
          )}

        </div>

        {/* Botones de acción (solo en carta activa) */}
        {isActive && (
          <div className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-4 px-4 lg:bottom-5">
            <motion.button
              onClick={() => onSwipeLeft(event.id)}
              whileHover={{ scale: 1.1, rotate: -8 }}
              whileTap={{ scale: 0.82 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-red-300/55 bg-red-500/30 text-red-100 shadow-lg shadow-red-900/35 backdrop-blur-md hover:border-red-300/80 hover:bg-red-500/40"
              aria-label="Paso, fome"
              title="Paso"
            >
              <HiX className="h-7 w-7" />
            </motion.button>

            <motion.button
              onClick={() => onSwipeRight(event.id)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.82 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-green-300/55 bg-green-500/30 text-green-100 shadow-lg shadow-green-900/35 backdrop-blur-md hover:border-green-300/80 hover:bg-green-500/40"
              aria-label="Me tinca, voy"
              title="Voy"
            >
              <HiHeart className="h-7 w-7" />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
