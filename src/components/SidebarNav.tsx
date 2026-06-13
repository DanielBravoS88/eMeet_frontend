'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion'
import { HiHome, HiBookmark, HiUser } from 'react-icons/hi'
import { HiMagnifyingGlass, HiChatBubbleLeftRight, HiChevronLeft, HiChevronRight } from 'react-icons/hi2'
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

const COLLAPSED_KEY = 'emeet-sidebar-collapsed'

export default function SidebarNav() {
  const { totalUnread } = useChatContext()
  const { user } = useAuth()
  const pathname = usePathname() ?? '/'

  // Estado de colapso. Default: colapsado (rail). Se persiste en localStorage
  // para respetar la preferencia del usuario entre recargas.
  const [collapsed, setCollapsed] = useState<boolean>(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(COLLAPSED_KEY)
    if (stored !== null) setCollapsed(stored === 'true')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(COLLAPSED_KEY, String(collapsed))
  }, [collapsed])

  const isRouteActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  // Click en un Link mientras está colapsado → expandimos automáticamente.
  // El href igual navega porque no hace falta preventDefault.
  const handleNavClick = () => {
    if (collapsed) setCollapsed(false)
  }

  return (
    <aside
      className={`group/sidebar relative hidden h-full shrink-0 flex-col overflow-hidden
        border-r border-violet-500/10
        bg-[linear-gradient(180deg,rgba(14,8,28,0.95)_0%,rgba(9,5,20,0.98)_100%)]
        lg:flex
        transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
        ${collapsed ? 'w-[76px]' : 'w-64 xl:w-72'}`}
    >
      {/* Borde luminoso superior */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

      {/* Botón toggle colapsar/expandir */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        className="absolute right-2 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full
          border border-violet-500/20 bg-violet-500/10 text-violet-300/70
          opacity-0 transition-all hover:bg-violet-500/25 hover:text-white
          group-hover/sidebar:opacity-100 focus-visible:opacity-100"
      >
        {collapsed ? <HiChevronRight className="h-4 w-4" /> : <HiChevronLeft className="h-4 w-4" />}
      </button>

      {/* Logo */}
      <div className={`px-4 py-6 pb-5 ${collapsed ? 'flex justify-center' : ''}`}>
        <Link
          href="/"
          onClick={handleNavClick}
          className={`group inline-flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg shadow-violet-900/50">
            <HiSparkles className="h-5 w-5 text-white" />
          </div>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                key="logo-text"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col"
              >
                <span className="whitespace-nowrap text-[1.4rem] font-extrabold tracking-tight leading-none">
                  <span className="text-white/90">e</span>
                  <span className="bg-gradient-to-r from-violet-300 via-white to-violet-300 bg-clip-text text-transparent">
                    Meet
                  </span>
                </span>
                <p className="mt-1.5 pl-0.5 text-[11px] font-medium uppercase tracking-widest text-violet-400/50 whitespace-nowrap">
                  Descubre • Conecta
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Divisor */}
      <div className="mx-4 mb-4 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />

      {/* Navegación */}
      <nav className="flex flex-1 flex-col gap-1 px-3">

        {/* Panel creador — visible solo si el usuario activó el modo creador */}
        {user?.isEventCreator && (
          <>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.p
                  key="creator-header"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-violet-400/40 overflow-hidden whitespace-nowrap"
                >
                  Modo creador
                </motion.p>
              )}
            </AnimatePresence>
            <Link
              href="/creator"
              onClick={handleNavClick}
              title={collapsed ? 'Mis eventos' : undefined}
              className={`group relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all duration-150
                ${collapsed ? 'justify-center px-2' : 'px-3'}
                ${
                  pathname.startsWith('/creator') || pathname.startsWith('/locatario')
                    ? 'bg-violet-500/15 text-white shadow-[inset_0_1px_0_rgba(196,181,253,0.12)]'
                    : 'text-violet-300/60 hover:bg-violet-500/8 hover:text-white'
                }`}
            >
              <div className={`relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                pathname.startsWith('/creator') || pathname.startsWith('/locatario')
                  ? 'bg-violet-500/25 text-violet-300'
                  : 'bg-white/5 text-violet-400/50 group-hover:bg-violet-500/15 group-hover:text-violet-300'
              }`}>
                <HiBuildingStorefront className="h-[18px] w-[18px]" />
              </div>
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.div
                    key="creator-text"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.18 }}
                    className="relative flex-1 min-w-0"
                  >
                    <p className="leading-none whitespace-nowrap">Mis eventos</p>
                    <p className="mt-0.5 text-[11px] leading-none text-violet-400/35 truncate">Crear y gestionar</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
            <div className="mx-3 my-2 h-px bg-violet-500/10" />
          </>
        )}

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.p
              key="menu-header"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-violet-400/40 overflow-hidden whitespace-nowrap"
            >
              Menú
            </motion.p>
          )}
        </AnimatePresence>

        <LayoutGroup id="sidebar-active-pill">
        {NAV_ITEMS.map(({ href, label, description, icon: Icon }) => {
          const active = isRouteActive(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={handleNavClick}
              title={collapsed ? label : undefined}
              className={`group relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all duration-150
                ${collapsed ? 'justify-center px-2' : 'px-3'}
                ${
                  active
                    ? 'text-white shadow-[inset_0_1px_0_rgba(196,181,253,0.12)]'
                    : 'text-violet-300/60 hover:bg-violet-500/8 hover:text-white'
                }`}
            >
              {/* Fondo del item activo — se desliza entre items con layoutId */}
              {active && (
                <motion.span
                  layoutId="sidebar-pill-bg"
                  className="absolute inset-0 rounded-xl bg-violet-500/15"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              {/* Indicador vertical — solo en modo expandido */}
              {active && !collapsed && (
                <motion.span
                  layoutId="sidebar-pill-bar"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-violet-400"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}

              <div className={`relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                active
                  ? 'bg-violet-500/25 text-violet-300'
                  : 'bg-white/5 text-violet-400/50 group-hover:bg-violet-500/15 group-hover:text-violet-300'
              }`}>
                <Icon className="h-[18px] w-[18px]" />

                {/* Badge de unread cuando está colapsado — esquina del icono */}
                {collapsed && href === '/chat' && totalUnread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-violet-500 px-1 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(124,58,237,0.6)]">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </div>

              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.div
                    key="nav-text"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.18 }}
                    className="relative flex flex-1 items-center gap-2 min-w-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="leading-none whitespace-nowrap">{label}</p>
                      {!active && (
                        <p className="mt-0.5 text-[11px] leading-none text-violet-400/35 group-hover:text-violet-400/60 truncate">
                          {description}
                        </p>
                      )}
                    </div>

                    {href === '/chat' && totalUnread > 0 && (
                      <span className="relative flex h-5 min-w-[20px] items-center justify-center rounded-full
                        bg-violet-500 px-1.5 text-[11px] font-bold text-white
                        shadow-[0_0_10px_rgba(124,58,237,0.5)]">
                        {totalUnread > 9 ? '9+' : totalUnread}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          )
        })}
        </LayoutGroup>
      </nav>

      {/* Footer del sidebar */}
      <div className={`pt-2 ${collapsed ? 'p-2' : 'p-4'}`}>
        <div className="mx-1 mb-3 h-px bg-gradient-to-r from-transparent via-violet-500/15 to-transparent" />

        {user ? (
          <div
            title={collapsed ? `${user.name} · ${user.email}` : undefined}
            className={`flex items-center rounded-xl transition-colors cursor-default hover:bg-violet-500/8
              ${collapsed ? 'justify-center p-1.5' : 'gap-2.5 p-2.5'}`}
          >
            <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-xs font-bold text-white">
              {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  key="user-info"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-xs font-semibold text-white/80 truncate">{user.name}</p>
                  <p className="text-[10px] text-violet-400/50 truncate">{user.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : collapsed ? (
          <Link
            href="/auth"
            onClick={handleNavClick}
            title="Iniciar sesión"
            className="flex h-9 w-full items-center justify-center rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors"
          >
            <HiUser className="h-4 w-4" />
          </Link>
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
