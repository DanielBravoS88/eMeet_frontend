'use client'

import { HiMapPin, HiClock, HiUsers } from 'react-icons/hi2'
import type { Event } from '../types'
import { formatEventDate, formatPrice, CATEGORY_COLORS, CATEGORY_EMOJI } from '../lib/eventUtils'

/**
 * EventPreviewCard — versión estática (sin swipe, sin audio, sin botones) de la
 * SwipeCard. Se usa en el panel de creación para mostrar en vivo cómo se verá el
 * evento en el feed mientras el usuario completa el formulario.
 *
 * Mantiene deliberadamente el mismo lenguaje visual que SwipeCard (gradientes,
 * badges, tipografía y disposición) para que el preview sea fiel.
 */
export function EventPreviewCard({ event }: { event: Event }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[30px] bg-card shadow-2xl select-none lg:rounded-[36px]">
      {/* Media de fondo: video o imagen */}
      {event.videoUrl ? (
        <video
          src={event.videoUrl}
          muted
          playsInline
          loop
          autoPlay
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <img
          src={event.imageUrl}
          alt={event.title}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      )}

      {/* Doble gradiente para contraste */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

      {/* Badge de categoría */}
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-1.5 lg:left-5 lg:top-5">
        <span
          className={`${CATEGORY_COLORS[event.category] ?? 'bg-purple-600'} w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white lg:px-4 lg:py-1.5`}
        >
          {CATEGORY_EMOJI[event.category]} {event.category}
        </span>
      </div>

      {/* Disco de música (estático) cuando hay audio */}
      {(event.audioPreviewUrl || event.audioTrackId) && (
        <div className="absolute right-4 top-4 z-10 h-11 w-11 lg:right-5 lg:top-5" aria-hidden>
          <div className="relative h-full w-full rounded-full shadow-xl">
            <div className="absolute inset-0 rounded-full border border-white/20 bg-gray-950" />
            <div className="absolute inset-[5px] rounded-full border border-white/[0.08]" />
            <div className="absolute inset-[9px] rounded-full border border-white/[0.08]" />
            <div className="absolute inset-[13px] rounded-full border border-white/[0.08]" />
            <div className="absolute inset-[17px] rounded-full bg-primary/90" />
            <div className="absolute inset-[22px] rounded-full bg-white/40" />
          </div>
        </div>
      )}

      {/* Info inferior */}
      <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-5">
        <h2 className="mb-1 line-clamp-2 text-lg font-bold leading-tight text-white lg:text-[1.55rem]">
          {event.title}
        </h2>

        <p className="mb-2 line-clamp-2 text-[13px] text-white/70 lg:text-sm lg:leading-5">
          {event.description}
        </p>

        <div className="mb-3 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[13px] text-white/80 lg:text-sm">
            <HiClock className="h-4 w-4 flex-shrink-0 text-primary-light" />
            <span>{event.date ? formatEventDate(event.date) : 'Fecha por definir'}</span>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-white/80 lg:text-sm">
            <HiMapPin className="h-4 w-4 flex-shrink-0 text-primary-light" />
            <span className="truncate">{event.location}</span>
          </div>
          {event.capacity && (
            <div className="flex items-center gap-2 text-[13px] text-white/80 lg:text-sm">
              <HiUsers className="h-4 w-4 flex-shrink-0 text-primary-light" />
              <span>{event.attendees}/{event.capacity} asistentes</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={event.organizerAvatar}
              alt={event.organizerName}
              className="h-6 w-6 rounded-full border border-white/20"
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
      </div>
    </div>
  )
}
