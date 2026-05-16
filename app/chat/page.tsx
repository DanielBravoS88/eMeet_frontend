'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../../src/components/Layout'
import { useChatContext } from '../../src/context/ChatContext'
import { useAuth } from '../../src/context/AuthContext'
import type { ChatRoom } from '../../src/types'
import { HiChatBubbleLeftRight } from 'react-icons/hi2'

function RoomSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="shimmer h-14 w-14 flex-shrink-0 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <div className="shimmer h-4 w-2/3 rounded-md" />
        <div className="shimmer h-3 w-full rounded-md" />
        <div className="shimmer h-2.5 w-1/3 rounded-md" />
      </div>
    </div>
  )
}

function formatTime(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

function RoomCard({
  room,
  onClick,
  selectionMode,
  isSelected,
  onSelect,
}: {
  room: ChatRoom
  onClick: () => void
  selectionMode: boolean
  isSelected: boolean
  onSelect: () => void
}) {
  const hasUnread = room.unreadCount > 0
  const lastMessagePreview = room.lastMessage?.senderName
    ? `${room.lastMessage.senderName.split(' ')[0]}: ${room.lastMessage.text}`
    : room.lastMessage?.text ?? room.eventAddress

  return (
    <motion.button
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={selectionMode ? onSelect : onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 transition-colors ${
        isSelected
          ? 'bg-primary/[0.12]'
          : hasUnread
          ? 'bg-primary/[0.06] hover:bg-primary/[0.09]'
          : 'hover:bg-white/5'
      }`}
    >
      <div className="relative shrink-0">
        <img
          src={room.eventImageUrl}
          alt={room.eventTitle}
          className={`h-14 w-14 rounded-2xl border object-cover transition-all ${
            isSelected ? 'border-primary opacity-70' : 'border-white/10'
          }`}
        />
        {selectionMode ? (
          <span
            className={`absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
              isSelected
                ? 'border-primary bg-primary text-white'
                : 'border-white/30 bg-surface'
            }`}
          >
            {isSelected && (
              <svg viewBox="0 0 10 8" className="h-2.5 w-2.5">
                <path
                  d="M1 4l2.5 2.5L9 1"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            )}
          </span>
        ) : (
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface bg-green-400" />
        )}
      </div>

      <div className="min-w-0 flex-1 text-left">
        <div className="flex items-center justify-between gap-2">
          <p
            className={`truncate text-sm font-semibold ${
              hasUnread && !selectionMode ? 'text-white' : 'text-slate-300'
            }`}
          >
            {room.eventTitle}
          </p>
          {room.lastMessage && !selectionMode && (
            <span
              className={`shrink-0 text-[11px] ${
                hasUnread ? 'font-semibold text-primary-light' : 'text-muted'
              }`}
            >
              {formatTime(room.lastMessage.timestamp)}
            </span>
          )}
        </div>
        <p
          className={`mt-0.5 truncate text-xs ${
            hasUnread && !selectionMode ? 'font-medium text-slate-300' : 'text-muted'
          }`}
        >
          {lastMessagePreview}
        </p>
        <p className="mt-0.5 text-[10px] text-muted">👥 {room.memberCount} miembros</p>
      </div>

      {!selectionMode && hasUnread && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white shadow-md shadow-primary/40"
        >
          {room.unreadCount}
        </motion.span>
      )}
    </motion.button>
  )
}

export default function ChatRoutePage() {
  const { rooms, isLoadingRooms, roomsError, reloadRooms, leaveRoom } = useChatContext()
  const { user, isAuthReady } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isLeavingSelected, setIsLeavingSelected] = useState(false)

  const unusedRooms = rooms.filter((r) => r.lastMessage === null)

  async function clearUnusedRooms() {
    if (unusedRooms.length === 0 || isCleaning) return
    setIsCleaning(true)
    try {
      await Promise.all(unusedRooms.map((r) => leaveRoom(r.id)))
    } finally {
      setIsCleaning(false)
    }
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function exitSelectionMode() {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  async function leaveSelected() {
    if (selectedIds.size === 0 || isLeavingSelected) return
    setIsLeavingSelected(true)
    try {
      await Promise.all(Array.from(selectedIds).map((id) => leaveRoom(id)))
      exitSelectionMode()
    } finally {
      setIsLeavingSelected(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (isAuthReady && !user) {
      router.replace('/auth?next=/chat')
    }
  }, [isAuthReady, router, user])

  useEffect(() => {
    if (selectionMode && rooms.length === 0) {
      exitSelectionMode()
    }
  }, [rooms.length, selectionMode])

  if (isAuthReady && !user) {
    return null
  }

  return (
    <Layout headerTitle="Comunidad">
      <div className="flex h-full flex-col">
        {!mounted || isLoadingRooms ? (
          <div className="divide-y divide-white/5">
            {[1, 2, 3].map((i) => (
              <RoomSkeleton key={i} />
            ))}
          </div>
        ) : roomsError ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10">
              <HiChatBubbleLeftRight className="h-9 w-9 text-amber-200" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">No pudimos cargar tus chats</p>
              <p className="mt-1 text-sm text-muted">{roomsError}</p>
            </div>
            <button
              onClick={() => void reloadRooms()}
              className="rounded-full bg-primary/20 px-4 py-2 text-sm font-semibold text-primary-light"
            >
              Reintentar
            </button>
          </motion.div>
        ) : rooms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-card">
              <HiChatBubbleLeftRight className="h-9 w-9 text-muted" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Sin chats aún</p>
              <p className="mt-1 text-sm text-muted">
                Dale like a un lugar en el feed para unirte a su comunidad y chatear con quienes
                también van a ir.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 overflow-y-auto pb-24">
            {/* Barra de acciones */}
            <div className="flex items-center justify-between px-4 pb-2 pt-4">
              <AnimatePresence mode="wait">
                {selectionMode ? (
                  <motion.p
                    key="sel"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="text-xs font-semibold uppercase tracking-wide text-primary-light"
                  >
                    {selectedIds.size > 0
                      ? `${selectedIds.size} seleccionado${selectedIds.size !== 1 ? 's' : ''}`
                      : 'Selecciona grupos'}
                  </motion.p>
                ) : (
                  <motion.p
                    key="title"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="text-xs font-semibold uppercase tracking-wide text-muted"
                  >
                    Tus comunidades
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2">
                {!selectionMode && unusedRooms.length > 0 && (
                  <button
                    onClick={() => void clearUnusedRooms()}
                    disabled={isCleaning}
                    className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold text-muted transition-colors hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
                  >
                    {isCleaning ? 'Limpiando...' : `Limpiar sin uso (${unusedRooms.length})`}
                  </button>
                )}
                <button
                  onClick={() => (selectionMode ? exitSelectionMode() : setSelectionMode(true))}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                    selectionMode
                      ? 'border-white/20 text-white hover:bg-white/10'
                      : 'border-white/10 text-muted hover:border-white/20 hover:text-slate-300'
                  }`}
                >
                  {selectionMode ? 'Cancelar' : 'Seleccionar'}
                </button>
              </div>
            </div>

            <div className="divide-y divide-white/5">
              {rooms.map((room, i) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <RoomCard
                    room={room}
                    onClick={() => router.push(`/chat/${room.id}`)}
                    selectionMode={selectionMode}
                    isSelected={selectedIds.has(room.id)}
                    onSelect={() => toggleSelection(room.id)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Barra flotante de acción en modo selección */}
        <AnimatePresence>
          {selectionMode && (
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="fixed bottom-[68px] left-0 right-0 z-40 flex items-center gap-3 border-t border-white/10 bg-card/95 px-4 py-3 backdrop-blur-md"
              style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
            >
              <div className="flex-1">
                {selectedIds.size === 0 ? (
                  <p className="text-sm text-muted">Toca un grupo para seleccionarlo</p>
                ) : (
                  <p className="text-sm font-semibold text-white">
                    {selectedIds.size} grupo{selectedIds.size !== 1 ? 's' : ''} seleccionado
                    {selectedIds.size !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <button
                onClick={() => void leaveSelected()}
                disabled={selectedIds.size === 0 || isLeavingSelected}
                className="rounded-full bg-red-500/20 px-5 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLeavingSelected
                  ? 'Saliendo...'
                  : `Salir${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  )
}
