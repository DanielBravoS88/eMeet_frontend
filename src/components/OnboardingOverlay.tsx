'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const STORAGE_KEY = 'emeet-onboarding-done'

const STEPS = [
  {
    emoji: '👋',
    title: 'Bienvenido a eMeet',
    description:
      'Descubre bares, restaurantes y eventos cercanos en tiempo real. La vida social de tu ciudad, en un solo lugar.',
    color: '#7C3AED',
  },
  {
    emoji: '📍',
    title: 'Activa tu ubicación',
    description:
      'Necesitamos tu GPS para mostrarte los mejores planes cerca tuyo. Sin ubicación no hay magia — prometemos no guardarlo.',
    color: '#2563EB',
  },
  {
    emoji: '💜',
    title: 'Swipe y conéctate',
    description:
      'Desliza a la derecha para dar like a un evento. Al hacerlo, te unes automáticamente a su comunidad de chat.',
    color: '#7C3AED',
  },
]

const SKIP_PATHS = ['/auth', '/admin']

export default function OnboardingOverlay() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (SKIP_PATHS.some((p) => pathname?.startsWith(p))) return
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) setVisible(true)
  }, [pathname])

  function dismiss() {
    setLeaving(true)
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, '1')
      setVisible(false)
      setLeaving(false)
    }, 300)
  }

  function goNext() {
    if (step === STEPS.length - 1) {
      dismiss()
      return
    }
    setStep((s) => s + 1)
  }

  function goPrev() {
    if (step === 0) return
    setStep((s) => s - 1)
  }

  if (!visible) return null

  const current = STEPS[step]

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center"
      style={{
        background: 'rgba(7, 4, 15, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        opacity: leaving ? 0 : 1,
        transition: 'opacity 0.3s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss() }}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-t-3xl sm:rounded-3xl"
        style={{
          background: 'linear-gradient(145deg, #1E1240 0%, #110926 55%, #0C0618 100%)',
          border: '1px solid rgba(196,181,253,0.15)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(196,181,253,0.05)',
          transform: leaving ? 'translateY(40px)' : 'translateY(0)',
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Drag handle en móvil */}
        <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-white/20 sm:hidden" />

        {/* Contenido del paso */}
        <div className="px-8 pb-2 pt-8 text-center sm:px-10 sm:pt-10">
          {/* Emoji con glow */}
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl text-4xl"
            style={{
              background: `${current.color}22`,
              border: `1px solid ${current.color}44`,
              boxShadow: `0 0 32px ${current.color}33`,
            }}
          >
            {current.emoji}
          </div>

          <h2 className="mb-3 text-2xl font-black tracking-tight text-white">
            {current.title}
          </h2>
          <p className="mx-auto max-w-[280px] text-sm leading-relaxed text-[#9CA3AF]">
            {current.description}
          </p>
        </div>

        {/* Dots */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              className="transition-all duration-300"
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                borderRadius: 100,
                background: i === step ? '#C4B5FD' : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>

        {/* Botones */}
        <div className="flex items-center gap-3 px-8 pb-8 pt-6 sm:px-10 sm:pb-10">
          {step > 0 ? (
            <button
              type="button"
              onClick={goPrev}
              className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-semibold text-[#9CA3AF] transition-colors hover:border-white/30 hover:text-white"
            >
              Atrás
            </button>
          ) : (
            <button
              type="button"
              onClick={dismiss}
              className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-semibold text-[#9CA3AF] transition-colors hover:border-white/30 hover:text-white"
            >
              Saltar
            </button>
          )}

          <button
            type="button"
            onClick={goNext}
            className="flex-[2] rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
            }}
          >
            {step === STEPS.length - 1 ? '¡Empezar!' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  )
}
