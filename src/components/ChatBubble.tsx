'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { HiChatBubbleLeftRight, HiXMark, HiChevronRight } from 'react-icons/hi2'
import { useChatContext } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'
import { usePathname } from 'next/navigation'

export default function ChatBubble() {
  const [open, setOpen] = useState(false)
  const { rooms, totalUnread, isLoadingRooms } = useChatContext()
  const { user } = useAuth()
  const pathname = usePathname()
  const panelRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic fuera del panel
  useEffect(() => {
    if (!open) return
    function handleOutsideClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  // No mostrar en páginas de chat ni en móvil
  if (!user) return null
  if (pathname === '/chat' || pathname?.startsWith('/chat/')) return null

  return (
    // hidden en móvil, visible solo en desktop (lg+)
    <div ref={panelRef} className="fixed bottom-6 right-6 z-50 hidden lg:block">

      {/* ── Panel de rooms ─────────────────────────────────────────────────── */}
      {open && (
        <div
          className="absolute bottom-[72px] right-0 w-[320px] overflow-hidden rounded-2xl
            border border-violet-500/20
            bg-[linear-gradient(145deg,_#1E1240_0%,_#110926_55%,_#0C0618_100%)]
            shadow-[0_8px_40px_rgba(0,0,0,0.6),_0_0_0_1px_rgba(196,181,253,0.05)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-violet-500/15 px-4 py-3">
            <div className="flex items-center gap-2">
              <HiChatBubbleLeftRight className="h-4 w-4 text-primary-light" />
              <span className="text-sm font-semibold text-white">Comunidad</span>
              {totalUnread > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full
                  bg-gradient-to-br from-primary-light to-primary
                  px-1 text-[10px] font-bold text-white">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </div>
            <Link
              href="/chat"
              onClick={() => setOpen(false)}
              className="flex items-center gap-0.5 text-[11px] font-medium text-primary-light transition-opacity hover:opacity-80"
            >
              Ver todo
              <HiChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Lista de rooms */}
          <div className="max-h-72 overflow-y-auto">
            {isLoadingRooms ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500/30 border-t-primary-light" />
              </div>
            ) : rooms.length === 0 ? (
              <p className="py-10 text-center text-xs text-muted">
                Aún no perteneces a ninguna comunidad.
                <br />
                <span className="text-primary-light">Dale like a un evento para unirte.</span>
              </p>
            ) : (
              rooms.slice(0, 8).map((room) => (
                <Link
                  key={room.id}
                  href={`/chat/${room.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-violet-500/10"
                >
                  {/* Imagen del evento */}
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl">
                    {room.eventImageUrl ? (
                      <img
                        src={room.eventImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-violet-500/20">
                        <HiChatBubbleLeftRight className="h-4 w-4 text-primary-light" />
                      </div>
                    )}
                    {room.unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full
                        bg-gradient-to-br from-primary-light to-primary
                        px-1 text-[10px] font-bold leading-none text-white
                        shadow-[0_0_6px_rgba(124,58,237,0.6)]">
                        {room.unreadCount > 9 ? '9+' : room.unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-xs font-medium ${room.unreadCount > 0 ? 'text-white' : 'text-em-text'}`}>
                      {room.eventTitle}
                    </p>
                    {room.lastMessage ? (
                      <p className="truncate text-[11px] text-muted">{room.lastMessage.text}</p>
                    ) : (
                      <p className="text-[11px] text-muted italic">Sin mensajes aún</p>
                    )}
                  </div>

                  {/* Indicador de no leído */}
                  {room.unreadCount > 0 && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-primary-light shadow-[0_0_6px_rgba(196,181,253,0.7)]" />
                  )}
                </Link>
              ))
            )}
          </div>

          {/* Brillo inferior decorativo */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#0C0618] to-transparent" />
        </div>
      )}

      {/* ── Botón burbuja ──────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Cerrar chat' : 'Abrir chat'}
        className="relative flex h-14 w-14 items-center justify-center rounded-full
          bg-gradient-to-br from-violet-600 to-primary
          shadow-[0_4px_24px_rgba(124,58,237,0.55)]
          transition-all duration-200 hover:scale-110 hover:shadow-[0_6px_28px_rgba(124,58,237,0.7)]
          active:scale-95"
      >
        {open ? (
          <HiXMark className="h-6 w-6 text-white" />
        ) : (
          <HiChatBubbleLeftRight className="h-6 w-6 text-white" />
        )}

        {/* Badge de no leídos — solo cuando está cerrado */}
        {!open && totalUnread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full
            bg-gradient-to-br from-primary-light to-primary
            px-1.5 text-[10px] font-bold text-white
            shadow-[0_0_10px_rgba(124,58,237,0.8)]
            animate-bounce">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}

        {/* Pulse ring cuando hay mensajes nuevos */}
        {!open && totalUnread > 0 && (
          <span className="absolute inset-0 animate-ping rounded-full bg-violet-500/30" />
        )}
      </button>
    </div>
  )
}
