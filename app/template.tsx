'use client'

import { usePathname } from 'next/navigation'

// La animación de entrada se hace 100% por CSS (clase .page-transition en
// index.css), NO con Framer Motion.
//
// Motivo: con Framer Motion el estado inicial (opacity/transform) se renderiza
// en el servidor (SSR), pero no coincide con el primer render del cliente, lo
// que provocaba un error de hidratación ("Hydration failed... Switched to
// client rendering"), además del riesgo de que la animación se quedara
// "atascada" en su estado inicial.
//
// Con CSS, el HTML del servidor y del cliente es IDÉNTICO (solo una clase), así
// que no hay desajuste de hidratación; la animación corre en el navegador tras
// el primer pintado y siempre termina en el estado final visible. La `key` por
// pathname reinicia la animación en cada navegación. La preferencia de
// "reducir movimiento" se respeta vía @media en el CSS.
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  )
}
