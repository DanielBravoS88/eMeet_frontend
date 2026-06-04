'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HiHome, HiBookmark, HiUser } from 'react-icons/hi'
import { HiMagnifyingGlass, HiChatBubbleLeftRight } from 'react-icons/hi2'
import { HiBuildingStorefront, HiSparkles } from 'react-icons/hi2'
import { useChatContext } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { href: '/', label: 'Inicio', icon: HiHome, description: 'Feed de eventos' },
  { href: '/search', label: 'Explorar', icon: HiMagnifyingGlass, description: 'Buscar lugares' },
  { href: '/chat', label: 'Comunidad', icon: HiChatBubbleLeftRight, description: 'Chats activos' },
  { href: '/saved', label: 'Guardados', icon: HiBookmark, description: 'Tus favoritos' },
  { href: '/profile', label: 'Perfil', icon: HiUser, description: 'Tu cuenta' },
]

export default function SidebarNav() {
  const { totalUnread } = useChatContext()
  const { user } = useAuth()
  const pathname = usePathname() ?? '/'

  const isRouteActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col overflow-hidden
      border-r border-violet-500/10
      bg-[linear-gradient(180deg,rgba(14,8,28,0.95)_0%,rgba(9,5,20,0.98)_100%)]
      lg:flex xl:w-72">

      {/* Borde luminoso superior */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

      {/* Logo */}
      <div className="px-6 py-6 pb-5">
        <Link href="/" className="group inline-flex items-center gap-2.5">
          {/* Ícono eMeet */}
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg shadow-violet-900/50">
            <HiSparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-[1.4rem] font-extrabold tracking-tight leading-none">
            <span className="text-white/90">e</span>
            <span className="bg-gradient-to-r from-violet-300 via-white to-violet-300 bg-clip-text text-transparent">
              Meet
            </span>
          </span>
        </Link>
        <p className="mt-2 pl-0.5 text-[11px] font-medium uppercase tracking-widest text-violet-400/50">
          Descubre • Conecta
        </p>
      </div>

      {/* Divisor */}
      <div className="mx-5 mb-4 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />

      {/* Navegación */}
      <nav className="flex flex-1 flex-col gap-1 px-3">

        {/* Panel locatario */}
        {user?.role === 'locatario' && (
          <>
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-violet-400/40">
              Panel
            </p>
            <Link
              href="/locatario"
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                pathname === '/locatario'
                  ? 'bg-violet-500/15 text-white shadow-[inset_0_1px_0_rgba(196,181,253,0.12)]'
                  : 'text-violet-300/60 hover:bg-violet-500/8 hover:text-white'
              }`}
            >
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                pathname === '/locatario'
                  ? 'bg-violet-500/25 text-violet-300'
                  : 'bg-white/5 text-violet-400/50 group-hover:bg-violet-500/15 group-hover:text-violet-300'
              }`}>
                <HiBuildingStorefront className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="leading-none">Mi Panel</p>
              </div>
            </Link>
            <div className="mx-3 my-2 h-px bg-violet-500/10" />
          </>
        )}

        <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-violet-400/40">
          Menú
        </p>

        {NAV_ITEMS.map(({ href, label, description, icon: Icon }) => {
          const active = isRouteActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-violet-500/15 text-white shadow-[inset_0_1px_0_rgba(196,181,253,0.12)]'
                  : 'text-violet-300/60 hover:bg-violet-500/8 hover:text-white'
              }`}
            >
              {/* Indicador activo */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-violet-400" />
              )}

              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                active
                  ? 'bg-violet-500/25 text-violet-300'
                  : 'bg-white/5 text-violet-400/50 group-hover:bg-violet-500/15 group-hover:text-violet-300'
              }`}>
                <Icon className="h-[18px] w-[18px]" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="leading-none">{label}</p>
                {!active && (
                  <p className="mt-0.5 text-[11px] leading-none text-violet-400/35 group-hover:text-violet-400/60 truncate">
                    {description}
                  </p>
                )}
              </div>

              {href === '/chat' && totalUnread > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full
                  bg-violet-500 px-1.5 text-[11px] font-bold text-white
                  shadow-[0_0_10px_rgba(124,58,237,0.5)]">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer del sidebar */}
      <div className="p-4 pt-2">
        <div className="mx-1 mb-3 h-px bg-gradient-to-r from-transparent via-violet-500/15 to-transparent" />

        {user ? (
          <div className="flex items-center gap-2.5 rounded-xl p-2.5 hover:bg-violet-500/8 transition-colors cursor-default">
            {/* Avatar mini */}
            <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-xs font-bold text-white">
              {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/80 truncate">{user.name}</p>
              <p className="text-[10px] text-violet-400/50 truncate">{user.email}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
            <p className="text-xs text-violet-300/50">Descubre eventos cerca de ti.</p>
            <Link href="/auth" className="mt-2 block text-center rounded-lg bg-violet-500/20 py-1.5 text-xs font-semibold text-violet-300 hover:bg-violet-500/30 transition-colors">
              Iniciar sesión
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
