'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'

// template.tsx se re-instancia en cada navegación, lo que dispara la animación
// de entrada. AnimatePresence se omite porque el exit no puede completarse antes
// de que el componente desmonte en App Router.
//
// Mezcla varios ejes simultáneos para que la transición se sienta sin invadir:
//   • opacity   (fade)        → reduce la dureza del cambio
//   • y         (slide up)    → da dirección "entra desde abajo"
//   • scale     (zoom in)     → da sensación de profundidad
//
// NOTA: NO se anima `filter: blur`. El estado inicial se renderiza en el
// servidor (SSR); si se incluyera el blur y la animación de Framer Motion no
// llegara a completarse en el cliente (p. ej. aceleración por hardware
// desactivada o compositing GPU del `filter` fallido en algunos navegadores),
// la página quedaría borrosa de forma permanente. El fade + slide + scale
// logran la misma sensación de profundidad sin ese riesgo.
//
// useReducedMotion(): si el usuario activó "reducir movimiento" en su SO,
// degradamos a un fade simple (sin desplazamiento ni escala) para no
// provocar mareos.
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      key={pathname}
      initial={shouldReduce
        ? { opacity: 0 }
        : { opacity: 0, y: 24, scale: 0.985 }}
      animate={shouldReduce
        ? { opacity: 1 }
        : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: shouldReduce ? 0.2 : 0.38, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  )
}
