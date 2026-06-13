import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import BottomNavBar from './BottomNavBar'
import SidebarNav from './SidebarNav'
import ChatBubble from './ChatBubble'

const BellavistaMap = dynamic(() => import('./BellavistaMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-muted-foreground">
      Cargando mapa...
    </div>
  ),
})

interface LayoutProps {
  children: ReactNode
  showHeader?: boolean
  headerTitle?: string
  showDesktopMap?: boolean
}

export default function Layout({
  children,
  showHeader = true,
  headerTitle,
  showDesktopMap = false,
}: LayoutProps) {
  return (
    /* Fondo base — violeta profundo texturizado */
    <div
      className="h-screen overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.18) 0%, transparent 60%), linear-gradient(160deg, #0F0820 0%, #080514 50%, #0C0619 100%)',
      }}
    >
      <div className="mx-auto flex h-full w-full max-w-[1680px] items-stretch">

        <SidebarNav />

        {/* Área principal */}
        <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden
          border-x border-violet-500/10
          bg-[linear-gradient(160deg,rgba(30,18,64,0.6)_0%,rgba(12,6,24,0.8)_50%,rgba(14,5,32,0.7)_100%)]
          backdrop-blur-[2px]
          lg:border-l lg:border-r-0
          lg:my-0">

          {/* Borde superior luminoso */}
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent z-10" />

          {showHeader && (
            <header className="z-40 flex flex-shrink-0 items-center justify-between
              border-b border-violet-500/12
              bg-[rgba(11,7,22,0.75)]
              px-5 py-3.5 backdrop-blur-md lg:px-7 lg:py-4">

              {/* Logo (solo mobile — en desktop está en sidebar) */}
              <div className="flex items-center gap-2 lg:hidden">
                <span className="text-xl font-extrabold tracking-tight">
                  <span className="text-white">e</span>
                  <span className="bg-gradient-to-r from-violet-300 via-white to-violet-300 bg-clip-text text-transparent">
                    Meet
                  </span>
                </span>
              </div>

              {/* Título de página */}
              {headerTitle ? (
                <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold tracking-wide text-white/80 lg:static lg:translate-x-0 lg:text-base lg:text-white">
                  {headerTitle}
                </h1>
              ) : (
                /* Spacer para centrar el título en mobile */
                <div className="hidden lg:block" />
              )}

              <div className="w-8 lg:hidden" />
            </header>
          )}

          <main className="flex min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-20 lg:pb-0">
            <div className="w-full">{children}</div>
          </main>

          <BottomNavBar />

          {/* Burbuja de chat anclada al área de contenido (no al viewport),
              así nunca pisa el sidebar (rail o expandido) ni flota en el
              espacio muerto de pantallas anchas. */}
          <ChatBubble />
        </section>

        {showDesktopMap && (
          <aside className="hidden w-[380px] shrink-0
            border-l border-violet-500/10
            bg-[linear-gradient(180deg,rgba(15,8,30,0.9)_0%,rgba(8,4,18,0.95)_100%)]
            xl:block xl:w-[420px]">
            <div className="h-full overflow-hidden">
              <BellavistaMap />
            </div>
          </aside>
        )}

      </div>
    </div>
  )
}
