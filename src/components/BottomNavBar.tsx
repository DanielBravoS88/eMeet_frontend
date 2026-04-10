'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { HiHome, HiBookmark, HiUser } from 'react-icons/hi'
import { HiMagnifyingGlass, HiChatBubbleLeftRight, HiBars3, HiXMark, HiTicket } from 'react-icons/hi2'
import { useChatContext } from '../context/ChatContext'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const NAV_ITEMS: NavItem[] = [
  { href: '/',         label: 'Inicio',     icon: HiHome },
  { href: '/search',   label: 'Explorar',   icon: HiMagnifyingGlass },
  { href: '/chat',     label: 'Comunidad',  icon: HiChatBubbleLeftRight },
  { href: '/saved',    label: 'Guardados',  icon: HiBookmark },
  { href: '/coupons',  label: 'Cupones',    icon: HiTicket, badge: 'Nuevo' },
  { href: '/profile',  label: 'Perfil',     icon: HiUser },
]

export default function BottomNavBar() {
  const [isOpen, setIsOpen] = useState(false)
  const { totalUnread } = useChatContext()
  const pathname = usePathname() ?? '/'

  const isRouteActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <>
      {/* ── Botón hamburguesa ─────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menú"
        className="absolute top-3 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] transition-all duration-200 hover:bg-white/10 active:scale-95 lg:top-[18px] lg:right-5"
      >
        <HiBars3 className="h-5 w-5 text-white" />
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-primary" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Panel lateral */}
            <motion.nav
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="absolute inset-y-0 right-0 z-50 flex w-[72%] max-w-[280px] flex-col bg-[#0d1020] shadow-[−8px_0_40px_rgba(0,0,0,0.5)]"
            >
              {/* Cabecera del drawer */}
              <div className="flex flex-shrink-0 items-center justify-between border-b border-white/8 px-5 py-4">
                <span className="text-xl font-extrabold tracking-tight">
                  <span className="text-white">e</span>
                  <span className="text-primary">Meet</span>
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Cerrar menú"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] transition-all active:scale-90"
                >
                  <HiXMark className="h-4 w-4 text-white" />
                </button>
              </div>

              {/* Items de navegación */}
              <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
                {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
                  const isActive = isRouteActive(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition-all duration-200 ${
                        isActive
                          ? 'bg-primary/15 text-primary'
                          : 'text-slate-300 hover:bg-white/[0.05] active:bg-white/10'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <Icon className={`h-[1.15rem] w-[1.15rem] ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                        {href === '/chat' && totalUnread > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold leading-none text-white">
                            {totalUnread > 9 ? '9+' : totalUnread}
                          </span>
                        )}
                      </div>
                      <span className={`text-sm font-medium leading-none ${isActive ? 'text-primary' : ''}`}>
                        {label}
                      </span>
                      {badge && (
                        <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary-light">
                          {badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>

              {/* Pie del drawer */}
              <div className="flex-shrink-0 border-t border-white/8 px-5 py-4">
                <p className="text-center text-[10px] text-muted">eMeet · Santiago, Chile</p>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
