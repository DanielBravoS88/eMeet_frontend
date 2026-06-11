'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, useAnimationControls, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { humanizeAuthError, type HumanAuthError } from '../lib/authErrors'
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiAlertCircle } from 'react-icons/fi'

interface LoginFormProps {
  /** Llamado cuando el usuario quiere cambiar al panel de registro. */
  onSwitchToSignup?: () => void
}

export default function LoginForm({ onSwitchToSignup }: LoginFormProps = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<HumanAuthError | null>(null)
  // Bump se incrementa con cada error nuevo para re-disparar la animación shake
  // incluso si el contenido del error es idéntico al anterior.
  const [errorBump, setErrorBump] = useState(0)

  const shakeControls = useAnimationControls()

  useEffect(() => {
    if (error) {
      shakeControls.start({
        x: [0, -10, 10, -8, 8, -4, 4, 0],
        transition: { duration: 0.42, ease: 'easeInOut' },
      })
    }
  }, [errorBump, shakeControls, error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const role = await login(email, password)
      const next = searchParams.get('next')
      if (next && next.startsWith('/')) {
        router.push(next)
        return
      }
      router.push(role === 'admin' ? '/admin' : '/')
    } catch (err) {
      setError(humanizeAuthError(err))
      setErrorBump((n) => n + 1)
    } finally {
      setIsLoading(false)
    }
  }

  const emailHasError = error?.field === 'email'
  const passwordHasError = error?.field === 'password'

  return (
    <motion.form animate={shakeControls} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">Bienvenido de regreso</h2>
        <p className="text-sm text-slate-400">Ingresa tu correo y contraseña para continuar.</p>
        <p className="text-xs text-slate-500">Emails de prueba: user@emeet.com o admin@emeet.com.</p>
      </div>

      <AnimatePresence initial={false}>
        {error && (
          <motion.div
            key={errorBump}
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
              <FiAlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-semibold text-red-200">{error.message}</p>
                {error.hint && <p className="text-red-200/70">{error.hint}</p>}
                {error.suggestion === 'forgot' && (
                  <Link
                    href="/auth/forgot-password"
                    className="inline-block pt-1 text-xs font-semibold text-violet-300 underline-offset-2 hover:underline"
                  >
                    Recuperar contraseña →
                  </Link>
                )}
                {error.suggestion === 'signup' && onSwitchToSignup && (
                  <button
                    type="button"
                    onClick={onSwitchToSignup}
                    className="inline-block pt-1 text-xs font-semibold text-violet-300 underline-offset-2 hover:underline"
                  >
                    Crear cuenta nueva →
                  </button>
                )}
                {error.suggestion === 'verify' && (
                  <Link
                    href="/auth/verify-email"
                    className="inline-block pt-1 text-xs font-semibold text-violet-300 underline-offset-2 hover:underline"
                  >
                    Reenviar correo de verificación →
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">Email</label>
        <div className="relative">
          <FiMail
            className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
              emailHasError ? 'text-red-400' : 'text-slate-400'
            }`}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            aria-invalid={emailHasError || undefined}
            className={`w-full bg-violet-500/8 outline-none py-3 pl-10 pr-4 rounded-xl text-white placeholder-violet-300/30 transition-colors ${
              emailHasError
                ? 'border border-red-500/60 focus:border-red-400'
                : 'border border-violet-500/20 hover:border-violet-500/40 focus:border-violet-500/70'
            }`}
            required
          />
        </div>
      </div>

      {/* Contraseña */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">Contraseña</label>
        <div className="relative">
          <FiLock
            className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
              passwordHasError ? 'text-red-400' : 'text-slate-400'
            }`}
          />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            aria-invalid={passwordHasError || undefined}
            className={`w-full bg-violet-500/8 outline-none py-3 pl-10 pr-12 rounded-xl text-white placeholder-violet-300/30 transition-colors ${
              passwordHasError
                ? 'border border-red-500/60 focus:border-red-400'
                : 'border border-violet-500/20 hover:border-violet-500/40 focus:border-violet-500/70'
            }`}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400/50 hover:text-violet-300 transition-colors"
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>
      </div>

      {/* Recordar contraseña */}
      <div className="flex justify-between items-center">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" className="w-4 h-4 rounded accent-[hsl(262,80%,60%)]" />
          <span className="text-slate-300">Recordarme</span>
        </label>
        <Link href="/auth/forgot-password" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      {/* Botón submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 hover:-translate-y-px hover:shadow-lg hover:shadow-violet-900/40"
      >
        <FiLogIn size={20} />
        {isLoading ? 'Iniciando sesión...' : 'Inicia Sesión'}
      </button>
    </motion.form>
  )
}
