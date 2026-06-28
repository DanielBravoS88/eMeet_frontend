/** @type {import('next').NextConfig} */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''} https://maps.googleapis.com https://maps.gstatic.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https: http://localhost:4000 http://127.0.0.1:4000",
  "media-src 'self' blob: https:",
  "connect-src 'self' http://localhost:4000 http://127.0.0.1:4000 https://*.onrender.com https://*.supabase.co wss://*.supabase.co https://maps.googleapis.com https://maps.gstatic.com https://nominatim.openstreetmap.org",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  { key: 'X-XSS-Protection', value: '0' },
]

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },

  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
      process.env.VITE_GOOGLE_MAPS_API_KEY ??
      '',
  },

  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost',          port: '4000' },
      { protocol: 'https', hostname: '*.onrender.com'                   },
      { protocol: 'https', hostname: 'images.unsplash.com'              },
      { protocol: 'https', hostname: 'api.dicebear.com'                 },
    ],
  },

  experimental: {
    // Le dice al compilador qué paquetes optimizar con tree-shaking agresivo.
    // Evita importar el barrel completo de react-icons y framer-motion.
    optimizePackageImports: [
      'framer-motion',
      'react-icons/hi',
      'react-icons/hi2',
      'react-icons/fi',
    ],
  },
}

export default nextConfig
