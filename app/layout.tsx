import type { Metadata } from 'next'
import NextTopLoader from 'nextjs-toploader'
import '../src/index.css'
import AppProviders from '../src/providers/AppProviders'

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://emeet.app')

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'eMeet — Descubre eventos cerca tuyo',
    template: '%s · eMeet',
  },
  description: 'Descubre bares, restaurantes y eventos cercanos en tiempo real. Dale like, únete a la comunidad y encuentra planes cerca tuyo.',
  keywords: ['eventos', 'bares', 'restaurantes', 'comunidad', 'Santiago', 'planes', 'eMeet'],
  authors: [{ name: 'eMeet' }],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: APP_URL,
    siteName: 'eMeet',
    title: 'eMeet — Descubre eventos cerca tuyo',
    description: 'Descubre bares, restaurantes y eventos cercanos en tiempo real. Dale like, únete a la comunidad y encuentra planes cerca tuyo.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eMeet — Descubre eventos cerca tuyo',
    description: 'Descubre bares, restaurantes y eventos cercanos en tiempo real.',
    creator: '@emeet_app',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
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
