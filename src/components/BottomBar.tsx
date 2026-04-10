'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HiHome, HiBookmark, HiUser } from 'react-icons/hi'
import { HiMagnifyingGlass, HiChatBubbleLeftRight } from 'react-icons/hi2'
import { useChatContext } from '../context/ChatContext'

const ITEMS = [
  { href: '/',        label: 'Inicio',    icon: HiHome },
  { href: '/search',  label: 'Explorar',  icon: HiMagnifyingGlass },
  { href: '/chat',    label: 'Comunidad', icon: HiChatBubbleLeftRight },
  { href: '/saved',   label: 'Guardados', icon: HiBookmark },
  { href: '/profile', label: 'Perfil',    icon: HiUser },
]

export default function BottomBar() {
  const { totalUnread } = useChatContext()
  const pathname = usePathname() ?? '/'

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <nav className="absolute inset-x-0 bottom-0 z-40 border-t border-white/10 bg-card/95 px-2 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full items-center justify-around lg:h-[72px]">
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 text-xs font-medium transition-all duration-200 ${
              isActive(href) ? 'text-primary' : 'text-muted'
            }`}
          >
            <div className="relative">
              <Icon className={`h-6 w-6 transition-transform ${isActive(href) ? 'scale-110' : ''}`} />
              {href === '/chat' && totalUnread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </div>
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
