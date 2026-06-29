'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatContext } from '../../../src/context/ChatContext'
import { useAuth } from '../../../src/context/AuthContext'
import { getSupabaseBrowserClient, hasSupabaseEnv } from '../../../src/lib/supabase'
import { HiArrowLeft, HiPaperAirplane, HiMapPin } from 'react-icons/hi2'
import { HiDotsVertical } from 'react-icons/hi'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateLabel(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })
}

export default function ChatRoomRoutePage() {
  const params = useParams<{ roomId: string }>()
  const roomId = typeof params?.roomId === 'string' ? params.roomId : undefined
  const router = useRouter()
  const {
    rooms,
    messages,
    sendMessage,
    markRoomRead,
    loadMessagesForRoom,
    leaveRoom,
    messageErrors,
    isLoadingRooms,
    loadingMessages,
  } = useChatContext()
  const { user, isAuthReady } = useAuth()
  const [input, setInput] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [leaveConfirm, setLeaveConfirm] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const room = rooms.find((r) => r.id === roomId)
  const roomMessages = messages[roomId ?? ''] ?? []
  const roomError = roomId ? messageErrors[roomId] : null
  const isLoadingMessages = roomId ? loadingMessages[roomId] ?? false : false
  const [sendError, setSendError] = useState<string | null>(null)

  const isMembershipError =
    roomError?.toLowerCase().includes('miembro') ||
    roomError?.toLowerCase().includes('403') ||
    roomError?.toLowerCase().includes('no tienes')

  // ── Presencia + typing en vivo (Supabase Realtime) ─────────────────────────
  // Usa un canal por sala con dos features:
  //   • presence: cuántos están conectados ahora mismo
  //   • broadcast (event 'typing'): quién está escribiendo
  // Ambos viven solo mientras el componente está montado.
  type PresencePeer = { name: string }
  type TypingPeer = { name: string; expiresAt: number }
  const [onlinePeers, setOnlinePeers] = useState<Map<string, PresencePeer>>(new Map())
  const [typingPeers, setTypingPeers] = useState<Map<string, TypingPeer>>(new Map())
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseBrowserClient>['channel']> | null>(null)
  const lastTypingSentRef = useRef<number>(0)

  useEffect(() => {
    if (!roomId || !user || !hasSupabaseEnv) return

    const supabase = getSupabaseBrowserClient()
    const channel = supabase.channel(`chat-room:${roomId}`, {
      config: {
        presence: { key: user.id },
        broadcast: { self: false },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, Array<{ name?: string }>>
        const next = new Map<string, PresencePeer>()
        for (const [uid, metas] of Object.entries(state)) {
          next.set(uid, { name: metas[0]?.name ?? 'Alguien' })
        }
        setOnlinePeers(next)
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        const data = payload.payload as { user_id?: string; name?: string }
        if (!data?.user_id || data.user_id === user.id) return
        setTypingPeers((prev) => {
          const next = new Map(prev)
          next.set(data.user_id!, {
            name: data.name ?? 'Alguien',
            expiresAt: Date.now() + 4000,
          })
          return next
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ name: user.name })
        }
      })

    channelRef.current = channel

    // Sweeper: borra typing peers cuyo TTL expiró (≥ 4s sin reenviar typing)
    const sweeper = setInterval(() => {
      setTypingPeers((prev) => {
        const now = Date.now()
        let mutated = false
        const next = new Map(prev)
        for (const [uid, p] of next) {
          if (p.expiresAt <= now) {
            next.delete(uid)
            mutated = true
          }
        }
        return mutated ? next : prev
      })
    }, 1500)

    return () => {
      clearInterval(sweeper)
      supabase.removeChannel(channel)
      channelRef.current = null
      setOnlinePeers(new Map())
      setTypingPeers(new Map())
    }
  }, [roomId, user])

  const onlineCount = onlinePeers.size
  const typingNames = useMemo(() => Array.from(typingPeers.values()).map((p) => p.name), [typingPeers])
  const typingLabel = useMemo(() => {
    if (typingNames.length === 0) return null
    if (typingNames.length === 1) return `${typingNames[0]} está escribiendo`
    if (typingNames.length === 2) return `${typingNames[0]} y ${typingNames[1]} están escribiendo`
    return 'Varias personas están escribiendo'
  }, [typingNames])

  // Notifica typing por broadcast, throttled a 2s (evita spam)
  function broadcastTyping() {
    const channel = channelRef.current
    if (!channel || !user) return
    const now = Date.now()
    if (now - lastTypingSentRef.current < 2000) return
    lastTypingSentRef.current = now
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.id, name: user.name },
    })
  }

  useEffect(() => {
    if (roomId) {
      loadMessagesForRoom(roomId).catch(() => {
        // Error visible via messageErrors
      })
      markRoomRead(roomId).catch(() => {
        // Non-critical read marker
      })
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [roomId, loadMessagesForRoom, markRoomRead])

  useEffect(() => {
    if (isAuthReady && !user) {
      const next = roomId ? `/chat/${roomId}` : '/chat'
      router.replace(`/auth?next=${encodeURIComponent(next)}`)
    }
  }, [isAuthReady, roomId, router, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [roomMessages.length])

  if (isAuthReady && !user) {
    return null
  }


  async function handleLeave() {
    if (!roomId) return
    setIsLeaving(true)
    setLeaveError(null)
    try {
      await leaveRoom(roomId)
      router.replace('/chat')
    } catch (err) {
      setLeaveError(err instanceof Error ? err.message : 'No se pudo salir del grupo.')
      setIsLeaving(false)
      setLeaveConfirm(false)
    }
  }

  if (isLoadingRooms && !room) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted">
        <p>Cargando conversación...</p>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted px-6 text-center">
        <p className="text-white font-semibold">Sala no encontrada</p>
        <p className="text-sm text-muted">
          Es posible que el evento haya expirado o que no seas miembro de esta sala.
        </p>
        <button onClick={() => router.push('/chat')} className="mt-3 text-sm text-primary">
          Volver a chats
        </button>
      </div>
    )
  }

  function handleSend() {
    if (!input.trim() || !user || !roomId) return
    setSendError(null)
    sendMessage(roomId, input.trim()).catch((error) => {
      const msg = error instanceof Error ? error.message : 'No se pudo enviar el mensaje.'
      setSendError(msg)
    })
    setInput('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const EMOJIS = [
    '😀','😂','🥰','😍','🤩','😎','🥳','😅','😭','🤣',
    '❤️','🔥','👏','🙌','💪','✨','🎉','🥂','💯','👀',
    '😤','🤔','😴','🤗','😇','🤭','😬','😑','🙄','😏',
    '🍕','☕','🎶','⚽','🏖️','🌙','☀️','🌈','🐶','🦋',
  ]

  function insertEmoji(emoji: string) {
    setInput((prev) => prev + emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  const groupedMessages: { label: string; msgs: typeof roomMessages }[] = []
  for (const msg of roomMessages) {
    const label = formatDateLabel(msg.timestamp)
    const last = groupedMessages[groupedMessages.length - 1]
    if (last && last.label === label) {
      last.msgs.push(msg)
    } else {
      groupedMessages.push({ label, msgs: [msg] })
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-surface">
      {/* Header */}
      <div className="z-10 shrink-0 border-b border-white/10 bg-gradient-to-r from-card/95 to-surface/95 px-3 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/chat')}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          >
            <HiArrowLeft className="h-5 w-5 text-white" />
          </button>

          <div className="relative shrink-0">
            <img
              src={room.eventImageUrl}
              alt={room.eventTitle}
              className="h-10 w-10 rounded-xl border border-white/10 object-cover"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface ${
                onlineCount > 0 ? 'bg-green-400' : 'bg-white/20'
              }`}
              aria-label={onlineCount > 0 ? `${onlineCount} en línea` : 'nadie en línea'}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{room.eventTitle}</p>
            <div className="flex items-center gap-1 text-xs text-muted">
              <HiMapPin className="h-3 w-3 shrink-0 text-primary-light" />
              <span className="truncate">{room.eventAddress}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-xs font-semibold text-white">👥 {room.memberCount}</span>
              <span
                className={`text-[10px] ${onlineCount > 0 ? 'text-green-400' : 'text-muted'}`}
              >
                {onlineCount > 0 ? `${onlineCount} en línea` : 'nadie en línea'}
              </span>
            </div>

            {/* Menu de opciones */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                aria-label="Opciones"
              >
                <HiDotsVertical className="h-5 w-5 text-muted" />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-white/10 bg-card/95 py-1 shadow-xl backdrop-blur-lg"
                  >
                    <button
                      onClick={() => { setMenuOpen(false); setLeaveConfirm(true) }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                    >
                      Salir del grupo
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {isMembershipError ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 py-12 text-center"
          >
            <p className="text-sm font-semibold text-white">No tienes acceso a esta sala</p>
            <p className="text-xs text-muted">
              Debes dar like al evento para unirte a su comunidad.
            </p>
            <button
              onClick={() => router.push('/')}
              className="mt-2 rounded-full bg-primary/20 px-4 py-2 text-sm font-semibold text-primary-light"
            >
              Ir al feed
            </button>
          </motion.div>
        ) : (
          <>
            {roomError && !isMembershipError && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
              >
                {roomError}
              </motion.div>
            )}

            {sendError && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100"
              >
                {sendError}
              </motion.div>
            )}

            {leaveError && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100"
              >
                {leaveError}
              </motion.div>
            )}

            {isLoadingMessages && roomMessages.length === 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 text-center text-sm text-muted"
              >
                Cargando mensajes...
              </motion.p>
            )}

            {!isLoadingMessages && roomMessages.length === 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 text-center text-sm text-muted"
              >
                Sé el primero en escribir 👋
              </motion.p>
            )}

            {groupedMessages.map(({ label, msgs }) => (
              <div key={label}>
                <div className="my-3 flex items-center gap-2">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="px-2 text-[11px] text-muted">{label}</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <AnimatePresence initial={false}>
                  {msgs.map((msg) => {
                    const isOwn = msg.senderId === user?.id
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className={`mb-2 flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          className="h-8 w-8 shrink-0 self-end rounded-full border border-white/10 object-cover"
                        />

                        <div className={`flex max-w-[75%] flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
                          {!isOwn && (
                            <span className="px-1 text-[11px] font-medium text-primary-light">
                              {msg.senderName}
                            </span>
                          )}

                          <div
                            className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                              isOwn
                                ? 'rounded-tr-sm bg-gradient-to-br from-primary to-violet-700 text-white shadow-lg shadow-primary/20'
                                : 'rounded-tl-sm border border-white/10 bg-white/5 text-white backdrop-blur-sm'
                            }`}
                          >
                            {msg.text}
                          </div>

                          <div className={`flex items-center gap-1 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                            <span className="text-[10px] text-muted">{formatTime(msg.timestamp)}</span>
                            {isOwn && <span className="text-[10px] text-primary-light">✓✓</span>}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            ))}

            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input bar — hidden when membership error */}
      {!isMembershipError && (
        <div
          className="shrink-0 border-t border-white/10 bg-gradient-to-r from-card/95 to-surface/95 px-3 pt-3 backdrop-blur-md"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          {/* Indicador "X está escribiendo..." */}
          <AnimatePresence>
            {typingLabel && (
              <motion.div
                key="typing-indicator"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="mb-2 flex items-center gap-2 px-2 text-[11px] text-muted"
              >
                <span className="flex gap-0.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-light [animation-delay:-300ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-light [animation-delay:-150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-light" />
                </span>
                <span className="italic">{typingLabel}…</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker((v) => !v)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-muted transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Emojis"
            >
              😊
            </button>

            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className="absolute bottom-12 left-0 z-50 grid w-56 grid-cols-8 gap-0.5 rounded-2xl border border-white/10 bg-card/95 p-2 shadow-xl backdrop-blur-lg"
                >
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-base transition-colors hover:bg-white/10"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); broadcastTyping() }}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              className="flex-1 rounded-full border border-white/15 bg-surface px-4 py-2.5 text-sm text-white placeholder:text-muted transition-colors focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleSend}
              disabled={!input.trim()}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all ${
                input.trim()
                  ? 'bg-gradient-to-br from-primary to-violet-700 text-white shadow-lg shadow-primary/30'
                  : 'cursor-not-allowed bg-white/10 text-muted'
              }`}
            >
              <HiPaperAirplane className="h-5 w-5" />
            </motion.button>
          </div>
        </div>
      )}

      {/* Leave room confirmation modal */}
      <AnimatePresence>
        {leaveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 backdrop-blur-sm sm:items-center"
            style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
            onClick={() => setLeaveConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 12, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-card p-6 shadow-2xl"
            >
              <h2 className="text-base font-bold text-white">¿Salir del grupo?</h2>
              <p className="mt-2 text-sm text-muted">
                Dejarás de recibir mensajes de esta comunidad. Si el grupo queda sin miembros,
                el historial se eliminará.
              </p>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setLeaveConfirm(false)}
                  className="flex-1 rounded-full border border-white/15 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLeave}
                  disabled={isLeaving}
                  className="flex-1 rounded-full bg-red-500/20 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/30 disabled:opacity-50"
                >
                  {isLeaving ? 'Saliendo...' : 'Salir'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close menu on outside click */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Close emoji picker on outside click */}
      {showEmojiPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  )
}
