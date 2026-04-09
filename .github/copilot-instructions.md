# eMeet Frontend — Instrucciones para Copilot

## Stack tecnológico

- React 18 + TypeScript 5 + Vite 6
- React Router v6 (SPA con rutas declarativas)
- Tailwind CSS v3 (utility-first, sin CSS modules)
- Framer Motion v11 (animaciones y gestos)
- React Icons v5 (íconos, preferir la familia `hi2`)
- @react-google-maps/api (mapa interactivo)

## Estructura del proyecto

```
src/
  types/index.ts          ← Tipos centrales: Event, User, EventCategory, AuthState
  data/mockEvents.ts      ← Datos mock + helpers (formatEventDate, formatPrice, CATEGORY_COLORS, CATEGORY_EMOJI)
  context/AuthContext.tsx ← Estado global de auth con useAuth() hook
  components/             ← Componentes reutilizables (SwipeCard, Layout, BottomNavBar, BellavistaMap)
  pages/                  ← Una página por ruta: FeedPage, SearchPage, SavedPage, ProfilePage, AuthPage
```

## Convenciones de código

- **Idioma de comentarios y JSDoc**: español
- **Exports**: `export default` para páginas y componentes; named exports para hooks y contextos
- **Props**: declarar `interface XxxProps` dentro del mismo archivo, antes del componente
- **Tipos**: siempre importar desde `../types` o `../../types`; nunca redefinir `Event`, `User`, etc.
- **Estado local**: `useState` + `useCallback` para handlers; contexto global solo para auth
- **Separadores de sección**: usar `// ─── Título ──────────` (guión em `─`) para separar bloques de código
- **Framer Motion**: animar con `motion.*`, usar `AnimatePresence` para entradas/salidas condicionales
- **Clases Tailwind**: mobile-first, sin `@apply`; agrupar lógicamente (layout → spacing → color → typo)

## Arquitectura y patrones

- Cada página maneja su propio estado local; no usar Redux ni Zustand (aún no hay)
- `AuthContext` es el único contexto global; acceder vía `useAuth()`
- `MOCK_EVENTS` y helpers de formato viven en `data/mockEvents.ts`  
- El swipe de tarjetas (FeedPage + SwipeCard) usa `useMotionValue` + `useTransform` de Framer Motion
- Las rutas protegidas usan el wrapper `ProtectedRoute` en `App.tsx`
- `Layout` envuelve todas las páginas protegidas (incluye `BottomNavBar`)

## Comandos útiles

```bash
npm run dev      # Servidor de desarrollo (Vite)
npm run build    # tsc + vite build
npm run preview  # Previsualizar build
```

## Lo que NO hacer

- No crear CSS modules ni archivos `.css` adicionales (solo Tailwind + `index.css`)
- No instalar librerías de estado global (Zustand, Redux) sin confirmar
- No cambiar la estructura de carpetas sin motivo claro
- No redefinir tipos que ya existen en `types/index.ts`
- No usar `any` salvo que sea estrictamente necesario y justificado
