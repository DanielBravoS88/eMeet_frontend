'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useAuth, type CreatorOnboarding } from '../context/AuthContext'
import {
  HiBuildingStorefront,
  HiSparkles,
  HiArrowRight,
  HiXMark,
} from 'react-icons/hi2'

/**
 * Sección "Modo creador" en el perfil.
 * - Si el usuario NO es creador → muestra una card con CTA para activarlo
 *   (abre un modal de onboarding con datos opcionales del negocio).
 * - Si el usuario SÍ es creador → muestra estado activo + enlace a /creator
 *   + opción para desactivar.
 */
export default function CreatorModeSection({ autoOpen = false }: { autoOpen?: boolean }) {
  const { user, becomeEventCreator, stopBeingEventCreator } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmStopOpen, setConfirmStopOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const triggeredAutoOpen = useRef(false)

  const [form, setForm] = useState<CreatorOnboarding>({
    businessName: '',
    businessLocation: '',
    bio: '',
  })

  useEffect(() => {
    if (autoOpen && user && !user.isEventCreator && !triggeredAutoOpen.current) {
      triggeredAutoOpen.current = true
      setModalOpen(true)
    }
  }, [autoOpen, user])

  if (!user) return null

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await becomeEventCreator({
        businessName: form.businessName?.trim() || undefined,
        businessLocation: form.businessLocation?.trim() || undefined,
        bio: form.bio?.trim() || undefined,
      })
      setModalOpen(false)
      setForm({ businessName: '', businessLocation: '', bio: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo activar el modo creador.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate() {
    setError(null)
    setSaving(true)
    try {
      await stopBeingEventCreator()
      setConfirmStopOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo desactivar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* ── Card en perfil ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 rounded-full bg-gradient-to-b from-primary to-purple-500" />
            <h3 className="text-base font-semibold text-white">Modo creador</h3>
          </div>
          {user.isEventCreator && (
            <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-300">
              Activo
            </span>
          )}
        </div>

        {user.isEventCreator ? (
          // ── Activo ──
          <div className="overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/15 via-violet-500/8 to-purple-500/10">
            <div className="flex items-start gap-3 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg shadow-violet-900/40">
                <HiBuildingStorefront className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">Estás creando eventos</p>
                {user.businessName && (
                  <p className="mt-0.5 text-xs text-violet-200/70 truncate">
                    {user.businessName}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-violet-500/15 bg-violet-500/5 px-4 py-2.5">
              <Link
                href="/creator"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition-colors"
              >
                Ir a mis eventos
                <HiArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                onClick={() => setConfirmStopOpen(true)}
                className="rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/5 transition-colors"
              >
                Desactivar
              </button>
            </div>
          </div>
        ) : (
          // ── Inactivo: CTA ──
          <button
            onClick={() => setModalOpen(true)}
            className="w-full overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-purple-500/8 p-4 text-left transition-all hover:from-violet-500/20 hover:via-violet-500/10 hover:to-purple-500/15 hover:border-violet-500/35"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/20 group-hover:bg-violet-500/30">
                <HiSparkles className="h-5 w-5 text-violet-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">Conviértete en creador</p>
                <p className="mt-1 text-xs leading-relaxed text-violet-200/60">
                  Crea y publica eventos en tu local. La comunidad podrá descubrirlos en el feed y unirse al chat.
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-violet-300">
                  Activar ahora
                  <HiArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </button>
        )}
      </motion.div>

      {/* ── Modal onboarding ── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => !saving && setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-violet-500/20 bg-[rgba(14,8,28,0.95)] backdrop-blur-xl shadow-2xl"
            >
              <form onSubmit={handleActivate}>
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-violet-500/15 bg-violet-500/8 px-5 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg shadow-violet-900/40">
                    <HiSparkles className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-white">Activar modo creador</h2>
                    <p className="text-xs text-violet-200/60">Todos los campos son opcionales</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => !saving && setModalOpen(false)}
                    className="rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <HiXMark className="h-5 w-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="space-y-4 px-5 py-5">
                  {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/80">
                      Nombre del negocio o lugar
                    </label>
                    <input
                      type="text"
                      placeholder="Mi Restaurante"
                      value={form.businessName ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
                      className="w-full rounded-xl border border-violet-500/20 bg-violet-500/8 px-3 py-2.5 text-sm text-white placeholder-violet-300/30 outline-none transition-colors focus:border-violet-500/70"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/80">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      placeholder="Santiago, Chile"
                      value={form.businessLocation ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, businessLocation: e.target.value }))}
                      className="w-full rounded-xl border border-violet-500/20 bg-violet-500/8 px-3 py-2.5 text-sm text-white placeholder-violet-300/30 outline-none transition-colors focus:border-violet-500/70"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/80">
                      Sobre tu negocio
                    </label>
                    <textarea
                      placeholder="Cuéntanos brevemente qué ofreces..."
                      value={form.bio ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                      rows={3}
                      maxLength={200}
                      className="w-full resize-none rounded-xl border border-violet-500/20 bg-violet-500/8 px-3 py-2.5 text-sm text-white placeholder-violet-300/30 outline-none transition-colors focus:border-violet-500/70"
                    />
                  </div>

                  <p className="text-[11px] leading-relaxed text-violet-300/40">
                    Vas a poder editar todo esto después desde tu perfil. Nadie te cobra por activar el modo creador.
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2 border-t border-violet-500/15 bg-violet-500/4 px-5 py-3">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setModalOpen(false)}
                    className="flex-1 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-900/40 transition-colors hover:bg-violet-500 disabled:opacity-50"
                  >
                    {saving ? 'Activando...' : (
                      <>
                        Activar
                        <HiArrowRight className="h-3 w-3" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirmación de desactivar ── */}
      <AnimatePresence>
        {confirmStopOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => !saving && setConfirmStopOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm overflow-hidden rounded-2xl border border-amber-500/25 bg-[rgba(14,8,28,0.95)] backdrop-blur-xl shadow-2xl"
            >
              <div className="px-5 py-5 text-center">
                <span className="text-4xl">⚠️</span>
                <h3 className="mt-2 text-base font-bold text-white">¿Desactivar modo creador?</h3>
                <p className="mt-2 text-xs leading-relaxed text-violet-200/60">
                  Tus eventos publicados quedarán como están, pero ya no podrás crear nuevos hasta que reactives. Tus datos del negocio se guardan.
                </p>
              </div>
              <div className="flex items-center gap-2 border-t border-violet-500/15 bg-violet-500/4 px-5 py-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setConfirmStopOpen(false)}
                  className="flex-1 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleDeactivate}
                  className="flex-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/25 disabled:opacity-50"
                >
                  {saving ? 'Desactivando...' : 'Desactivar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
