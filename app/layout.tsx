import type { Metadata } from 'next'
import NextTopLoader from 'nextjs-toploader'
import '../src/index.css'
import AppProviders from '../src/providers/AppProviders'

export const metadata: Metadata = {
  title: 'eMeet',
  description: 'Descubre bares, restaurantes y eventos cercanos.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <NextTopLoader
          color="#7C3AED"
          height={3}
          showSpinner={false}
          shadow="0 0 12px #7C3AED, 0 0 6px #C4B5FD"
          easing="ease"
          speed={200}
        />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
