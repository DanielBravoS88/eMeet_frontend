# Librerías y Dependencias — eMeet Frontend

> Análisis basado en el archivo `package.json` del repositorio `eMeet_frontend`.

---

## 1. Framework Principal

| Librería | Versión | Rol |
|---|---|---|
| **next** | ^14.2.15 | Framework React con App Router, SSR, SSG, Route Handlers, Middleware |
| **react** | ^18.3.1 | Librería UI declarativa basada en componentes |
| **react-dom** | ^18.3.1 | Renderizado de React en el DOM del navegador |

### Decisión técnica
Next.js 14 con App Router permite adoptar un modelo server-first donde los componentes se renderizan en el servidor por defecto, reduciendo el JavaScript enviado al cliente y mejorando el rendimiento inicial. Los Client Components se usan solo donde se requieren interacciones del navegador.

---

## 2. Librerías de Estilos y UI

| Librería | Versión | Rol |
|---|---|---|
| **tailwindcss** | ^3.4.14 | Framework de utilidades CSS, mobile-first, sin CSS custom |
| **autoprefixer** | ^10.4.20 | Plugin PostCSS para añadir prefijos de navegador automáticamente |
| **postcss** | ^8.4.47 | Procesador de CSS (requerido por Tailwind) |
| **@base-ui/react** | ^1.5.0 | Primitivas de componentes accesibles sin estilos (base para shadcn) |
| **shadcn** | ^4.8.2 | Generador/colección de componentes UI sobre Tailwind + Base UI |
| **class-variance-authority** | ^0.7.1 | Define variantes de clases Tailwind por componente (CVA) |
| **clsx** | ^2.1.1 | Composición condicional de nombres de clase |
| **tailwind-merge** | ^3.6.0 | Resuelve conflictos de utilidades Tailwind al combinar clases |
| **tw-animate-css** | ^1.4.0 | Utilidades de animación adicionales para Tailwind |

### Uso en el proyecto
Tailwind es el único sistema de estilos del proyecto. No se usan CSS Modules ni archivos `.css` adicionales fuera de `src/index.css` (directivas Tailwind + estilos globales mínimos). El archivo `tailwind.config.js` extiende la paleta de colores con tokens del diseño de eMeet (primary, surface, card, accent, muted). La función `cn()` en `src/lib/cn.ts` combina `clsx` + `tailwind-merge`, y `class-variance-authority` define las variantes de los componentes basados en `shadcn` / `@base-ui/react`.

---

## 3. Librerías de Animación

| Librería | Versión | Rol |
|---|---|---|
| **framer-motion** | ^11.11.0 | Animaciones declarativas, gestos de arrastre (swipe), AnimatePresence |

### Uso en el proyecto
Se usa principalmente en:
- `SwipeCard.tsx`: mecánica de arrastre y swipe con `motion.div`, `useMotionValue`, `useTransform`, `useSpring`, `AnimatePresence`.
- `app/template.tsx`: animaciones de transición entre páginas.
- Componentes de feedback visual (toasts, modales).

---

## 4. Librerías de Iconos

| Librería | Versión | Rol |
|---|---|---|
| **react-icons** | ^5.3.0 | Set amplio de iconos SVG (se usan íconos de la familia HeroIcons v2 — `hi2`) |
| **lucide-react** | ^1.17.0 | Iconos SVG modernos usados principalmente en el panel de administración |

---

## 5. Librerías de Mapas

| Librería | Versión | Rol |
|---|---|---|
| **@react-google-maps/api** | ^2.20.8 | Wrapper React para Google Maps JavaScript API + Places API |

### Uso en el proyecto
- `BellavistaMap.tsx`: mapa interactivo con marcadores de lugares cercanos.
- `LocationPickerMap.tsx`: selector de ubicación en formulario de locatario.
- `NearbyPlacesContext.tsx`: usa `useJsApiLoader` para cargar la API de Google Maps.
- `useNearbyPlaces.ts`: realiza búsquedas de lugares cercanos con `PlacesService`.

### Variable de entorno requerida
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

---

## 6. Librerías de Autenticación y Backend

| Librería | Versión | Rol |
|---|---|---|
| **@supabase/supabase-js** | ^2.103.0 | Cliente JavaScript principal de Supabase (Auth, DB, Storage, Realtime) |
| **@supabase/ssr** | ^0.10.2 | Integración de Supabase con Next.js SSR mediante cookies (sessions server-side) |

### Uso en el proyecto
- `src/lib/supabase.ts`: define los clientes browser (`createBrowserClient`) y servidor (`createServerClient`), el tipo `Database`, y la función `hasSupabaseEnv` para detectar si las variables están configuradas.
- `middleware.ts`: usa `createServerClient` para validar la sesión en el middleware de Next.js.
- `AuthContext.tsx`: usa `getSupabaseBrowserClient()` para login, logout, OAuth y sincronización de sesión.
- `ChatContext.tsx`: usa Supabase Realtime para suscripción de mensajes en tiempo real.
- `useImageUpload.ts` / `useVideoUpload.ts`: usan Supabase Storage para subir archivos.

### Variables de entorno requeridas
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## 7. Librerías de Gestión de Estado

| Librería | Descripción |
|---|---|
| **React Context API** (nativa) | Única forma de estado global usada en el proyecto. No se usa Redux, Zustand ni Jotai. |

### Contextos globales
- `AuthContext`: estado de autenticación y sesión.
- `ChatContext`: salas de chat y mensajes.
- `NearbyPlacesContext`: lugares cercanos y filtros.
- `LocatarioEventsContext`: eventos publicados por locatarios.

---

## 8. Librerías de Visualización (Gráficos)

| Librería | Versión | Rol |
|---|---|---|
| **recharts** | ^3.8.1 | Gráficos SVG para el panel de administración (área chart, donut chart) |

### Uso en el proyecto
- `TicketAreaChart.tsx`: gráfico de área de tickets/interacciones por tiempo.
- `CategoryDonut.tsx`: gráfico donut de distribución por categoría de eventos.

---

## 9. Librerías Utilitarias

| Librería | Versión | Rol |
|---|---|---|
| **nextjs-toploader** | ^3.9.17 | Barra de progreso de carga en la parte superior al navegar entre páginas |

---

## 10. Dependencias de Desarrollo

| Librería | Versión | Rol |
|---|---|---|
| **typescript** | ~5.6.2 | Compilador TypeScript con `strict: true` |
| **@types/node** | 25.5.2 | Tipos TypeScript para Node.js |
| **@types/react** | ^18.3.12 | Tipos TypeScript para React |
| **@types/react-dom** | ^18.3.1 | Tipos TypeScript para ReactDOM |
| **jest** | ^30.4.2 | Framework de pruebas unitarias/componentes |
| **jest-environment-jsdom** | ^30.4.1 | Entorno DOM simulado para tests de componentes |
| **@types/jest** | ^30.0.0 | Tipos TypeScript para Jest |
| **@testing-library/react** | ^16.3.2 | Renderizado y queries de componentes en tests |
| **@testing-library/jest-dom** | ^6.9.1 | Matchers de Jest para aserciones sobre el DOM |
| **@testing-library/user-event** | ^14.6.1 | Simulación de interacciones de usuario en tests |

---

## 10.1 Testing

El proyecto cuenta con una suite de pruebas con **Jest** + **React Testing Library** (entorno `jsdom`). Scripts disponibles en `package.json`:

| Script | Comando | Rol |
|---|---|---|
| `npm test` | `jest` | Ejecuta toda la suite |
| `npm run test:watch` | `jest --watch` | Modo observación |
| `npm run test:coverage` | `jest --coverage` | Reporte de cobertura |

Los tests viven en `__tests__/` (componentes, librerías y filtros del feed).

---

## 11. Resumen de Dependencias por Categoría

| Categoría | Librerías |
|---|---|
| **Framework** | next, react, react-dom |
| **UI / Estilos** | tailwindcss, autoprefixer, postcss |
| **Animación** | framer-motion |
| **Iconos** | react-icons, lucide-react |
| **Mapas** | @react-google-maps/api |
| **Autenticación / Backend** | @supabase/supabase-js, @supabase/ssr |
| **Gráficos** | recharts |
| **Utilidades UI** | nextjs-toploader, clsx, tailwind-merge, class-variance-authority, @base-ui/react, shadcn, tw-animate-css |
| **Tipado** | typescript, @types/node, @types/react, @types/react-dom |
| **Testing** | jest, jest-environment-jsdom, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, @types/jest |

---

## 12. Riesgos y Observaciones

| Riesgo / Observación | Descripción |
|---|---|
| Google Maps API key expuesta en cliente | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` es accesible desde el navegador; se recomienda mover las consultas a un Route Handler |
| Sin pruebas E2E | Hay suite unitaria/de componentes con **Jest** + **React Testing Library**, pero aún no se integran pruebas end-to-end (Playwright/Cypress) |
| Sin librería de validación de formularios | No se usa Zod, Yup ni React Hook Form; la validación es manual en los componentes |
| Sin manejador de formularios | Se usa `useState` directamente para formularios sin librería dedicada |
| Versión fijada de @types/node (25.5.2) | Sin `^` ni `~`, lo que puede causar conflictos en futuras instalaciones |
| recharts importado dinámicamente | Correcto uso de `dynamic()` con `ssr: false` en el admin para evitar errores SSR |

---

## 13. Librerías Relacionadas con Supabase

Las siguientes librerías confirman la integración activa con Supabase:

| Librería | Función en eMeet |
|---|---|
| `@supabase/supabase-js` | Autenticación, consultas a PostgreSQL, Realtime, Storage |
| `@supabase/ssr` | Manejo de cookies para sesiones en middleware y Server Components |

> Las funciones `createBrowserClient` y `createServerClient` se configuran con las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
