import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Configuración de Capacitor — app móvil de eMeet.
 *
 * Estrategia "remote URL": el WebView nativo carga directamente la web
 * desplegada en Vercel. Así la app móvil y la web comparten el mismo código
 * y el mismo deploy (cada push a main actualiza ambas), y se conservan el
 * middleware de Next.js y las rutas BFF (/api/*) que requieren servidor.
 *
 * `webDir` apunta a una carpeta placeholder: Capacitor la exige aunque no se
 * use, porque el contenido real viene de `server.url`.
 */
const config: CapacitorConfig = {
  appId: 'com.emeet.app',
  appName: 'eMeet',
  webDir: 'capacitor-www',
  server: {
    url: 'https://e-meet-frontend-nine.vercel.app',
    // Solo HTTPS — sin tráfico en texto plano
    cleartext: false,
  },
  android: {
    // Color de fondo del WebView mientras carga (surface del tema eMeet)
    backgroundColor: '#07040F',
  },
}

export default config
