'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowRight } from 'react-icons/fi'
import LoginForm from '../../src/components/LoginForm'
import SignUpForm from '../../src/components/SignUpForm'
import { useAuth } from '../../src/context/AuthContext'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 814 1000" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 411.8 0 302.5 0 198.3 0 87.1 55.2 31.1 126.6 31.1c62.1 0 107.3 41.7 166.8 41.7 57.5 0 93.2-43 166.8-43 48.9 0 115.3 36.1 154.6 98.3 8.6-3.2 50.5-22.2 50.5-22.2 1.9-.6 31.9-11.6 31.9 21.1 0 0 2.5 44.5-17.5 67.6zM507 96.3c25.7-33.5 44.4-78.6 44.4-123.7 0-6.4-.6-12.8-1.3-18.5-42.2 1.3-93.5 28.5-124.3 65.6-24.4 28.5-47.1 73.7-47.1 119.5 0 6.9.6 13.8 1.3 15.9 2.5.3 6.5.9 10.4.9 38.7 0 87.3-25 116.6-59.7z"/>
    </svg>
  )
}

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null)
  const [oauthError, setOauthError] = useState('')
  const { loginWithGoogle } = useAuth()

  const handleGoogle = async () => {
    setOauthError('')
    setOauthLoading('google')
    try {
      await loginWithGoogle()
    } catch {
      setOauthError('No se pudo conectar con Google. Intenta de nuevo.')
      setOauthLoading(null)
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden p-4"
      style={{
        background: 'radial-gradient(ellipse 90% 70% at 20% 10%, rgba(124,58,237,0.22) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 80% 90%, rgba(109,40,217,0.15) 0%, transparent 45%), linear-gradient(160deg, #0F0820 0%, #080514 55%, #0C0619 100%)',
      }}
    >
      {/* Orbes de luz de fondo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-64 w-64 rounded-full bg-purple-700/10 blur-3xl" />
        <div className="absolute left-0 top-1/2 h-48 w-48 rounded-full bg-violet-500/8 blur-2xl" />
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_1fr]">

          {/* Panel izquierdo — presentación */}
          <div className="hidden flex-col justify-between rounded-2xl border border-violet-500/15 bg-[rgba(14,8,28,0.80)] p-9 text-white shadow-2xl backdrop-blur-xl lg:flex">
            <div className="space-y-5">
              {/* Logo */}
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg shadow-violet-900/40">
                  <span className="text-lg">✨</span>
                </div>
                <span className="text-xl font-extrabold tracking-tight">
                  <span className="text-white">e</span>
                  <span className="bg-gradient-to-r from-violet-300 via-white to-violet-300 bg-clip-text text-transparent">Meet</span>
                </span>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-400/70">Descubre • Conecta</p>
                <h1 className="text-[2rem] font-bold leading-tight text-white">
                  Tu acceso a eventos, bares y experiencias únicas.
                </h1>
              </div>
            </div>

            <div className="my-6 flex flex-grow items-center justify-center">
              <img
                src="/auth-map-illustration.svg"
                alt="Ilustración de mapa de eventos"
                className="h-auto w-full max-w-xs object-contain opacity-60"
              />
            </div>

            <div className="space-y-2.5">
              {[
                'Descubre lugares en Santiago con recomendaciones personalizadas.',
                'Regístrate y activa el modo creador para organizar tus propios eventos.',
                'Accede rápido con cuentas demo para probar la app.',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-violet-500/12 bg-violet-500/6 px-4 py-3">
                  <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/30 text-[10px] text-violet-300">✓</span>
                  <p className="text-sm leading-relaxed text-violet-100/70">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Panel derecho — formulario */}
          <div className="rounded-2xl border border-violet-500/15 bg-[rgba(14,8,28,0.85)] p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-5">
              <div className="text-center lg:text-left">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-violet-400/60">Accede a eMeet</p>
                <h2 className="text-2xl font-bold text-white">Inicia sesión o crea tu cuenta</h2>
                <p className="mt-2 text-sm text-violet-200/50">Usa tu cuenta demo para explorar eventos y paneles.</p>
              </div>

              {/* Tab selector */}
              <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-violet-500/15 bg-violet-500/5 p-1.5">
                <button
                  onClick={() => setMode('login')}
                  className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
                    mode === 'login'
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40'
                      : 'text-violet-300/60 hover:text-violet-200'
                  }`}
                >
                  Inicia Sesión
                </button>
                <button
                  onClick={() => setMode('signup')}
                  className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
                    mode === 'signup'
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40'
                      : 'text-violet-300/60 hover:text-violet-200'
                  }`}
                >
                  Registrarse
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-violet-500/10 bg-violet-500/4 p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  {mode === 'login' ? (
                    <LoginForm onSwitchToSignup={() => setMode('signup')} />
                  ) : (
                    <SignUpForm />
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-violet-500/15" />
                <span className="text-[11px] text-violet-400/50">o continúa con</span>
                <div className="h-px flex-1 bg-violet-500/15" />
              </div>

              {oauthError && (
                <p className="mb-3 text-center text-sm text-red-400">{oauthError}</p>
              )}

              <div className="space-y-2.5">
                <button
                  onClick={handleGoogle}
                  disabled={oauthLoading !== null}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/8 py-3 text-sm font-medium text-white/80 transition-all hover:bg-violet-500/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {oauthLoading === 'google' ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <GoogleIcon />
                  )}
                  Continuar con Google
                </button>
                <button
                  disabled
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-violet-500/10 bg-violet-500/4 py-3 text-sm font-medium text-white/30 cursor-not-allowed"
                >
                  <AppleIcon />
                  Continuar con Apple
                </button>
              </div>

              <p className="mt-5 text-center text-xs text-violet-300/40">
                {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                <button
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="inline-flex items-center gap-1 font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                >
                  {mode === 'login' ? 'Regístrate' : 'Inicia sesión'} <FiArrowRight size={13} />
                </button>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-violet-400/30">
          <p>Disponible en Santiago, Chile</p>
        </div>
      </div>
    </div>
  )
}
