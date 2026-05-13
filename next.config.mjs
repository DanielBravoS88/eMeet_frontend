/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

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
