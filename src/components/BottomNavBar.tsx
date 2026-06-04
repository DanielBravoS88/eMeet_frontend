'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HiHome, HiBookmark, HiUser } from 'react-icons/hi'
import { HiMagnifyingGlass, HiChatBubbleLeftRight, HiBuildingStorefront } from 'react-icons/hi2'
import { useChatContext } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { href: '/', label: 'Inicio', icon: HiHome },
  { href: '/search', label: 'Explorar', icon: HiMagnifyingGlass },
  { href: '/chat', label: 'Comunidad', icon: HiChatBubbleLeftRight },
  { href: '/saved', label: 'Guardados', icon: HiBookmark },
  { href: '/profile', label: 'Perfil', icon: HiUser },
]

export default function BottomNavBar() {
  const { totalUnread } = useChatContext()
  const { user } = useAuth()
  const pathname = usePathname() ?? '/'

  const isRouteActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 lg:hidden
      border-t border-violet-500/30
      bg-[#0E0820]/95
      backdrop-blur-md px-2">

      {/* Línea de brillo metálico en el borde superior */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />

      <div className="mx-auto flex h-16 w-full items-center justify-around">
        {user?.role === 'locatario' && (
          <Link
            href="/locatario"
            className={`flex flex-col items-center gap-1 text-xs font-medium transition-all duration-200 ${
              pathname === '/locatario'
                ? 'text-white'
                : 'text-slate-400 hover:text-violet-300'
            }`}
          >
            <HiBuildingStorefront className={`h-6 w-6 transition-all duration-200 ${
              pathname === '/locatario'
                ? 'scale-110 text-violet-300 drop-shadow-[0_0_8px_rgba(196,181,253,0.7)]'
                : ''
            }`} />
            <span className={pathname === '/locatario' ? 'text-violet-300' : ''}>Mi Panel</span>
          </Link>
        )}
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = isRouteActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-violet-300'
              }`}
            >
              <div className="relative">
                {/* Píldora activa detrás del ícono */}
                {isActive && (
                  <span className="absolute inset-0 -m-2 rounded-xl bg-violet-500/15" />
                )}

                <Icon className={`relative h-6 w-6 transition-all duration-200 ${
                  isActive
                    ? 'scale-110 text-violet-300 drop-shadow-[0_0_8px_rgba(167,139,250,0.8)]'
                    : ''
                }`} />

                {href === '/chat' && totalUnread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full
                    bg-gradient-to-br from-violet-400 to-violet-600
                    px-1 text-[10px] font-bold leading-none text-white
                    shadow-[0_0_6px_rgba(124,58,237,0.6)]">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </div>

              <span className={isActive ? 'text-violet-300 font-semibold' : ''}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
