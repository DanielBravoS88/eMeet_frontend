'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

// template.tsx se re-instancia en cada navegación, lo que dispara la animación
// de entrada. AnimatePresence se omite porque el exit no puede completarse antes
// de que el componente desmonte en App Router.
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
