'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
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

/**
 * Mini-escena animada que reemplaza la ilustración estática del mapa.
 *
 * Cuenta una historia en bucle (~7s): dos amigos (zorro y perro) entran
 * desde lados opuestos, se encuentran al centro, suben juntos al evento (📍)
 * y celebran. Encaja con la propuesta de valor "encontrar a alguien para
 * salir" sin necesitar imágenes externas ni librerías nuevas.
 */
function AnimatedFriendsScene() {
  // Accesibilidad: si el usuario pidió reducir movimiento, renderizamos una
  // versión calmada y ESTÁTICA (los amigos ya juntos junto al pin, sin loops
  // ni parpadeos). MotionConfig frena los transform pero no las opacidades de
  // los sparkles/notas; aquí evitamos toda animación de la escena.
  const shouldReduce = useReducedMotion()
  // mounted: evita el desajuste de hidratación. useReducedMotion() devuelve null
  // en SSR y el valor real en el cliente; si ramificáramos directo, el DOM del
  // servidor (versión animada) no coincidiría con el del cliente (versión
  // estática) cuando el usuario tiene "reducir movimiento" activo. Renderizamos
  // la versión animada en SSR y primer render del cliente, y solo tras montar
  // aplicamos la versión estática accesible.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  if (mounted && shouldReduce) {
    return (
      <div className="relative flex aspect-[5/4] w-full max-w-[300px] flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-950/50 via-black/40 to-violet-950/20">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'linear-gradient(rgba(167,139,250,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.10) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <span className="relative text-4xl" style={{ filter: 'drop-shadow(0 0 10px rgba(167,139,250,0.55))' }}>📍</span>
        <div className="relative flex items-end gap-1 text-3xl">
          <span>🦊</span>
          <span className="text-base">💜</span>
          <span>🐶</span>
        </div>
        <p className="relative text-[11px] text-violet-200/50">Encuentra con quién salir</p>
      </div>
    )
  }

  // Todas las animaciones comparten esta duración para que el loop sea limpio.
  const LOOP = 7

  // Timeline normalizado (0 → 1) con dos zonas de "baile":
  //   0.00 - 0.30 → entran caminando desde fuera
  //   0.30 - 0.50 → BAILAN EN EL CENTRO (saltos alternados, twist)
  //   0.50 - 0.62 → suben juntos al pin
  //   0.62 - 0.80 → BAILAN AL LLEGAR (giros, escalas explosivas)
  //   0.80 - 1.00 → fade out + reinicio
  const T = {
    walkInEnd: 0.30,
    dance1: 0.34,
    dance2: 0.38,
    greet: 0.42,
    dance3: 0.46,
    arrive: 0.62,
    celebrate1: 0.68,
    celebrate2: 0.74,
    celebrate3: 0.80,
    fadeOut: 0.90,
  }

  return (
    <div className="relative aspect-[5/4] w-full max-w-[300px] overflow-hidden rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-950/50 via-black/40 to-violet-950/20">
      {/* Grid background simulando un mapa */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(rgba(167,139,250,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.10) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Camino vertical que se ilumina cuando caminan al pin */}
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-[15%] bottom-[28%] w-px -translate-x-1/2 rounded-full bg-gradient-to-b from-violet-400/0 via-violet-400/40 to-violet-400/0"
        animate={{ opacity: [0, 0, 0.9, 0.9, 0] }}
        transition={{
          duration: LOOP,
          repeat: Infinity,
          times: [0, T.dance3, T.arrive, T.celebrate3, 1],
          ease: 'easeInOut',
        }}
      />

      {/* Pin de evento (destino) — pulsa al ritmo del baile */}
      <motion.div
        className="absolute left-1/2 top-3 -translate-x-1/2"
        animate={{
          y: [0, -4, -6, -2, -6, -2, -8, -10, -8, 0],
          scale: [1, 1, 1.05, 1.1, 1.05, 1.1, 1.25, 1.35, 1.25, 1],
        }}
        transition={{
          duration: LOOP,
          repeat: Infinity,
          times: [0, T.walkInEnd, T.dance1, T.dance2, T.greet, T.dance3, T.celebrate1, T.celebrate2, T.celebrate3, 1],
          ease: 'easeInOut',
        }}
      >
        <span
          className="block text-3xl"
          style={{ filter: 'drop-shadow(0 0 10px rgba(167,139,250,0.55))' }}
        >
          📍
        </span>
      </motion.div>

      {/* Sparkles que aparecen cuando los amigos llegan al pin */}
      {['✨', '🎉', '✨'].map((emoji, i) => {
        const xOffset = (i - 1) * 18 // -18, 0, 18
        return (
          <motion.span
            key={i}
            aria-hidden
            className="absolute left-1/2 top-10 text-xl"
            style={{ translateX: `calc(-50% + ${xOffset}px)` }}
            animate={{
              opacity: [0, 0, 0, 1, 0],
              scale: [0.5, 0.5, 0.5, 1.4, 0.5],
              y: [0, 0, 0, -10 - i * 3, -16 - i * 3],
            }}
            transition={{
              duration: LOOP,
              repeat: Infinity,
              times: [0, T.arrive, T.celebrate1, T.celebrate2, T.fadeOut],
              ease: 'easeOut',
            }}
          >
            {emoji}
          </motion.span>
        )
      })}

      {/* Notas musicales 🎵🎶 que flotan mientras bailan en el centro */}
      {[
        { emoji: '🎵', side: -1, t: T.dance1 },
        { emoji: '🎶', side: 1, t: T.dance2 },
        { emoji: '🎵', side: -1, t: T.dance3 },
      ].map(({ emoji, side, t }, i) => (
        <motion.span
          key={`note-${i}`}
          aria-hidden
          className="absolute text-sm"
          style={{ left: `${50 + side * 18}%`, top: '50%' }}
          animate={{
            opacity: [0, 0, 1, 0, 0],
            y: [0, 0, -20, -40, -40],
            x: [0, 0, side * 6, side * 12, side * 12],
            rotate: [0, 0, side * 15, side * 30, side * 30],
          }}
          transition={{
            duration: LOOP,
            repeat: Infinity,
            times: [0, t - 0.02, t + 0.02, t + 0.12, 1],
            ease: 'easeOut',
          }}
        >
          {emoji}
        </motion.span>
      ))}

      {/* Diálogo "💬" que aparece brevemente entre los amigos al saludarse */}
      <motion.span
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 text-lg"
        style={{ top: '46%' }}
        animate={{
          opacity: [0, 0, 1, 1, 0],
          y: [0, 0, -6, -12, -14],
          scale: [0.6, 0.6, 1, 1, 0.6],
        }}
        transition={{
          duration: LOOP,
          repeat: Infinity,
          times: [0, T.walkInEnd, T.dance1, T.dance1 + 0.04, T.dance3 - 0.04],
          ease: 'easeOut',
        }}
      >
        💬
      </motion.span>

      {/* === Personajes === */}
      {/* Posición base: bottom-center. Animamos x/y para teletransporte+caminata. */}

      {/* Huellas 🐾 que aparecen en el suelo al ritmo de los pasos.
          Cada una en una posición distinta de la trayectoria izquierda → centro,
          con timing escalonado dentro de la fase walkInStart..walkInEnd. */}
      {[
        { left: '12%', t: 0.05 },
        { left: '22%', t: 0.10 },
        { left: '32%', t: 0.15 },
        { left: '78%', t: 0.05 },
        { left: '68%', t: 0.10 },
        { left: '58%', t: 0.15 },
      ].map(({ left, t }, i) => (
        <motion.span
          key={`paw-${i}`}
          aria-hidden
          className="absolute text-[10px] opacity-0"
          style={{ left, bottom: '14%' }}
          animate={{ opacity: [0, 0.6, 0.6, 0, 0] }}
          transition={{
            duration: LOOP,
            repeat: Infinity,
            times: [0, t, t + 0.12, t + 0.22, 1],
            ease: 'easeOut',
          }}
        >
          🐾
        </motion.span>
      ))}

      {/*
        === BAILE ALTERNADO ===
        Cuando el zorro salta (y negativo) el perro está abajo (y=0), y viceversa.
        Esto crea el efecto "high-low" típico de baile en pareja.
        Igual con scale: cuando uno se infla, el otro se encoge.
        Los 4 keyframes de dance (T.dance1..T.dance3) los usamos para 2 saltos.
      */}

      {/* Zorro 🦊 — viene desde la izquierda */}
      <Character
        emoji="🦊"
        loop={LOOP}
        //         start    walkInEnd  d1      d2       greet   d3      arrive  c1      c2      c3      fadeOut
        x={      ['-180%', '-25%',    '-22%', '-28%',  '-25%', '-22%', '-25%', '-25%', '-25%', '-25%', '-180%']}
        y={      ['0%',    '0%',      '-18%', '0%',    '-18%', '0%',   '-170%','-200%','-180%','-200%','-200%']}
        scale={  [1,        1,         1.15,    0.9,     1.2,    0.95,    1,      1.2,    1.5,    1.1,    1]}
        rotate={ [0,        0,         -10,     8,       -12,    6,       0,      -18,    -28,    -10,    0]}
        times={  [0, T.walkInEnd, T.dance1, T.dance2, T.greet, T.dance3, T.arrive, T.celebrate1, T.celebrate2, T.celebrate3, T.fadeOut]}
        baseLeft="50%"
        baseBottom="22%"
        swayDirection={1}
      />

      {/* Perro 🐶 — alterna saltos con el zorro */}
      <Character
        emoji="🐶"
        loop={LOOP}
        //         start    walkInEnd  d1      d2       greet   d3      arrive  c1      c2      c3      fadeOut
        x={      ['180%',  '25%',     '28%',  '22%',   '25%',  '28%',  '25%',  '25%',  '25%',  '25%',  '180%']}
        // y opuesto al zorro: cuando él salta, el perro está abajo (y=0) → baile alternado
        y={      ['0%',    '0%',      '0%',   '-18%',  '0%',   '-18%', '-170%','-180%','-200%','-200%','-200%']}
        // scale opuesto: cuando él se infla, el perro se encoge
        scale={  [1,        1,         0.9,    1.15,    0.95,   1.2,     1,      1.2,    1.5,    1.1,    1]}
        rotate={ [0,        0,         10,     -8,      12,     -6,      0,      18,     28,     10,     0]}
        times={  [0, T.walkInEnd, T.dance1, T.dance2, T.greet, T.dance3, T.arrive, T.celebrate1, T.celebrate2, T.celebrate3, T.fadeOut]}
        baseLeft="50%"
        baseBottom="22%"
        swayDirection={-1}
      />
    </div>
  )
}

/**
 * Un personaje emoji animado: combina dos motions anidadas.
 *   • La externa controla la posición/coreografía macro (x, y, rotate).
 *   • La interna mantiene un bounce vertical constante para simular "caminata".
 *   • El bounce se atenúa cuando el actor está parado o ya llegó al pin
 *     (lo hacemos vía duración corta y `repeat: Infinity`).
 */
function Character({
  emoji,
  loop,
  x,
  y,
  scale,
  rotate,
  times,
  baseLeft,
  baseBottom,
  swayDirection = 1,
}: {
  emoji: string
  loop: number
  x: string[]
  y: string[]
  /** Escala macro (para baile al llegar al pin) — array de keyframes alineados a `times`. */
  scale?: number[]
  /** Rotación macro (giro al llegar) — array de keyframes alineados a `times`. */
  rotate?: number[]
  times: number[]
  baseLeft: string
  baseBottom: string
  /** 1 o -1: invierte la dirección del sway constante para que zorro y perro
   *  no se mezan idénticos (rompe la simetría robotica). */
  swayDirection?: number
}) {
  return (
    // CAPA 1 — sway constante muy sutil (idle dance). Hace que aun "parados"
    // los personajes se vean vivos. La dirección se invierte para cada uno.
    <motion.div
      className="absolute -translate-x-1/2"
      style={{ left: baseLeft, bottom: baseBottom }}
      animate={{ x: [0, 2 * swayDirection, 0, -2 * swayDirection, 0] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* CAPA 2 — coreografía macro (entrar, encontrarse, subir, salir).
          Aquí también va el "baile" al llegar al pin: scale pulsante + rotate. */}
      <motion.div
        className="text-3xl"
        animate={{ x, y, scale: scale ?? 1, rotate: rotate ?? 0 }}
        transition={{
          duration: loop,
          repeat: Infinity,
          times,
          ease: 'easeInOut',
        }}
      >
        {/* CAPA 3 — bounce de caminata: salto alto + squash & stretch + tilt.
            Loop corto (0.5s) para que la pisada se sienta vibrante. */}
        <motion.span
          className="block origin-bottom"
          animate={{
            y: [0, -8, -2, -10, 0],
            scaleY: [1, 0.92, 1.05, 0.88, 1],
            scaleX: [1, 1.06, 0.96, 1.08, 1],
            rotate: [-4 * swayDirection, 2 * swayDirection, -2 * swayDirection, 4 * swayDirection, -4 * swayDirection],
          }}
          transition={{ duration: 0.52, repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}
        >
          {emoji}
        </motion.span>
      </motion.div>
    </motion.div>
  )
}

/**
 * Panel izquierdo "hero" del auth — pura presentación visual con animaciones
 * encadenadas. Todo se anima al montar con framer-motion (no necesita
 * librerías extra como anime.js).
 *
 * Capas:
 *   • Sparkle pulsante en el ✨ del logo (loop suave).
 *   • "DESCUBRE • CONECTA" entra con fade-up.
 *   • Título palabra por palabra (split reveal escalonado).
 *   • Escena de dos amigos que se encuentran y van juntos a un evento (loop).
 *   • Bullets entran desde la derecha con stagger.
 */
function PresentationPanel() {
  const title = 'Tu acceso a eventos, bares y experiencias únicas.'
  const words = title.split(' ')

  const bullets = [
    'Descubre lugares en Santiago con recomendaciones personalizadas.',
    'Regístrate y activa el modo creador para organizar tus propios eventos.',
    'Activa notificaciones para no perderte los planes que te interesan.',
  ]

  return (
    <div className="hidden flex-col justify-between rounded-2xl border border-violet-500/15 bg-[rgba(14,8,28,0.80)] p-9 text-white shadow-2xl backdrop-blur-xl lg:flex">
      <div className="space-y-5">
        {/* Logo con sparkle pulsante */}
        <motion.div
          className="flex items-center gap-2.5"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg shadow-violet-900/40">
            <motion.span
              className="text-lg"
              animate={{ scale: [1, 1.18, 1], rotate: [0, 8, -6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              ✨
            </motion.span>
            {/* Halo expansivo */}
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-xl bg-violet-400/40"
              animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
            />
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-white">e</span>
            <span className="bg-gradient-to-r from-violet-300 via-white to-violet-300 bg-clip-text text-transparent">Meet</span>
          </span>
        </motion.div>

        <div>
          <motion.p
            className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-400/70"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            Descubre • Conecta
          </motion.p>

          {/* Título: cada palabra entra escalonada con efecto stairstep */}
          <h1
            className="text-[2rem] font-bold leading-tight text-white"
            aria-label={title}
          >
            {words.map((word, i) => (
              <motion.span
                key={`${word}-${i}`}
                aria-hidden
                className="mr-[0.25em] inline-block"
                initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  duration: 0.55,
                  delay: 0.3 + i * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {word}
              </motion.span>
            ))}
          </h1>
        </div>
      </div>

      {/* Escena animada: dos amigos que se encuentran y van juntos a un evento */}
      <motion.div
        className="my-6 flex flex-grow items-center justify-center"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatedFriendsScene />
      </motion.div>

      {/* Bullets con stagger desde la derecha */}
      <motion.div
        className="space-y-2.5"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 1 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.12, delayChildren: 0.9 },
          },
        }}
      >
        {bullets.map((text, i) => (
          <motion.div
            key={i}
            className="flex items-start gap-3 rounded-xl border border-violet-500/12 bg-violet-500/6 px-4 py-3"
            variants={{
              hidden: { opacity: 0, x: 20 },
              show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
            }}
          >
            <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/30 text-[10px] text-violet-300">
              ✓
            </span>
            <p className="text-sm leading-relaxed text-violet-100/70">{text}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
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
          <PresentationPanel />
          {/*
            Lo separamos en componente para mantener limpio el árbol del
            AuthPage y para que las animaciones (reveal palabra por palabra,
            float continuo, stagger de bullets) se autocontengan.
          */}

          {/* Panel derecho — formulario */}
          <div className="rounded-2xl border border-violet-500/15 bg-[rgba(14,8,28,0.85)] p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-5">
              <div className="text-center lg:text-left">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-violet-400/60">Accede a eMeet</p>
                <h2 className="text-2xl font-bold text-white">Inicia sesión o crea tu cuenta</h2>
                <p className="mt-2 text-sm text-violet-200/50">Descubre eventos cerca tuyo y conecta con quienes van a los mismos planes.</p>
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
