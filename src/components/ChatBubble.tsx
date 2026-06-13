'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { HiChatBubbleLeftRight, HiXMark, HiChevronRight, HiArrowLeft, HiPaperAirplane } from 'react-icons/hi2'
import { useChatContext } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'
import { usePathname } from 'next/navigation'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatBubble() {
  const [open, setOpen] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const {
    rooms,
    totalUnread,
    isLoadingRooms,
    messages,
    loadMessagesForRoom,
    sendMessage,
    markRoomRead,
    loadingMessages,
  } = useChatContext()
  const { user } = useAuth()
  const pathname = usePathname()
  const panelRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedRoom = useMemo(() => rooms.find((r) => r.id === selectedRoomId), [rooms, selectedRoomId])
  const roomMessages = useMemo(
    () => (selectedRoomId ? (messages[selectedRoomId] ?? []) : []),
    [messages, selectedRoomId],
  )
  const isLoadingMessages = selectedRoomId ? (loadingMessages[selectedRoomId] ?? false) : false

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

  useEffect(() => {
    if (!selectedRoomId) return
    loadMessagesForRoom(selectedRoomId).catch(() => {})
    markRoomRead(selectedRoomId).catch(() => {})
  }, [selectedRoomId, loadMessagesForRoom, markRoomRead])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [roomMessages.length])

  function handleOpenRoom(roomId: string) {
    setSelectedRoomId(roomId)
    setInput('')
  }

  function handleBack() {
    setSelectedRoomId(null)
    setInput('')
  }

  function handleSend() {
    if (!input.trim() || !selectedRoomId) return
    sendMessage(selectedRoomId, input.trim()).catch(() => {})
    setInput('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!user) return null
  if (pathname === '/chat' || pathname?.startsWith('/chat/')) return null

  const isChatView = !!selectedRoomId && !!selectedRoom

  return (
    <div ref={panelRef} className="absolute bottom-6 left-6 z-50 hidden lg:block">

      {/* ── Panel ──────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-[72px] left-0 w-[320px] overflow-hidden rounded-2xl
              border border-violet-500/20
              bg-[linear-gradient(145deg,_#1E1240_0%,_#110926_55%,_#0C0618_100%)]
              shadow-[0_8px_40px_rgba(0,0,0,0.6),_0_0_0_1px_rgba(196,181,253,0.05)]
              flex flex-col"
            style={{ height: isChatView ? '440px' : undefined }}
          >
            {isChatView ? (
              /* ── Vista de chat inline ─────────────────────────────────────── */
              <>
                {/* Header */}
                <div className="flex shrink-0 items-center gap-2 border-b border-violet-500/15 px-3 py-2.5">
                  <button
                    onClick={handleBack}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Volver"
                  >
                    <HiArrowLeft className="h-4 w-4" />
                  </button>

                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                    {selectedRoom.eventImageUrl ? (
                      <img
                        src={selectedRoom.eventImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-violet-500/20">
                        <HiChatBubbleLeftRight className="h-4 w-4 text-primary-light" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white">{selectedRoom.eventTitle}</p>
                    <p className="text-[10px] text-muted">👥 {selectedRoom.memberCount} miembros</p>
                  </div>

                  <Link
                    href={`/chat/${selectedRoomId}`}
                    onClick={() => setOpen(false)}
                    className="flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-primary-light transition-opacity hover:opacity-80"
                  >
                    Ver todos
                    <HiChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Mensajes */}
                <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
                  {isLoadingMessages && roomMessages.length === 0 && (
                    <p className="py-8 text-center text-xs text-muted">Cargando mensajes...</p>
                  )}
                  {!isLoadingMessages && roomMessages.length === 0 && (
                    <p className="py-8 text-center text-xs text-muted">Sé el primero en escribir 👋</p>
                  )}

                  {/* initial={false}: los mensajes ya existentes no animan al abrir el panel,
                      solo los que llegan nuevos */}
                  <AnimatePresence initial={false}>
                  {roomMessages.map((msg) => {
                    const isOwn = msg.senderId === user.id
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                        className={`flex gap-1.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          className="h-6 w-6 shrink-0 self-end rounded-full border border-white/10 object-cover"
                        />
                        <div className={`flex max-w-[75%] flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
                          {!isOwn && (
                            <span className="px-1 text-[10px] font-medium text-primary-light">
                              {msg.senderName}
                            </span>
                          )}
                          <div
                            className={`rounded-2xl px-2.5 py-1.5 text-xs leading-relaxed ${
                              isOwn
                                ? 'rounded-tr-sm bg-gradient-to-br from-primary to-violet-700 text-white shadow-sm shadow-primary/20'
                                : 'rounded-tl-sm border border-white/10 bg-white/5 text-white'
                            }`}
                          >
                            {msg.text}
                          </div>
                          <span className="px-1 text-[10px] text-muted">{formatTime(msg.timestamp)}</span>
                        </div>
                      </motion.div>
                    )
                  })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="shrink-0 border-t border-violet-500/15 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Escribe un mensaje..."
                      className="flex-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white
                        placeholder:text-muted/70 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${
                        input.trim()
                          ? 'bg-gradient-to-br from-primary to-violet-700 text-white shadow-md shadow-primary/30'
                          : 'cursor-not-allowed bg-white/10 text-muted'
                      }`}
                      aria-label="Enviar"
                    >
                      <HiPaperAirplane className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* ── Lista de rooms ───────────────────────────────────────────── */
              <>
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-violet-500/15 px-4 py-3">
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

                {/* Rooms */}
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
                      <button
                        key={room.id}
                        onClick={() => handleOpenRoom(room.id)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-violet-500/10"
                      >
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

                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-xs font-medium ${room.unreadCount > 0 ? 'text-white' : 'text-em-text'}`}>
                            {room.eventTitle}
                          </p>
                          {room.lastMessage ? (
                            <p className="truncate text-[11px] text-muted">{room.lastMessage.text}</p>
                          ) : (
                            <p className="text-[11px] italic text-muted">Sin mensajes aún</p>
                          )}
                        </div>

                        {room.unreadCount > 0 && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-primary-light shadow-[0_0_6px_rgba(196,181,253,0.7)]" />
                        )}
                      </button>
                    ))
                  )}
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#0C0618] to-transparent" />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Botón burbuja ──────────────────────────────────────────────────────── */}
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

        {!open && totalUnread > 0 && (
          <span className="absolute -left-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full
            bg-gradient-to-br from-primary-light to-primary
            px-1.5 text-[10px] font-bold text-white
            shadow-[0_0_10px_rgba(124,58,237,0.8)]
            animate-bounce">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}

        {!open && totalUnread > 0 && (
          <span className="absolute inset-0 animate-ping rounded-full bg-violet-500/30" />
        )}
      </button>
    </div>
  )
}
