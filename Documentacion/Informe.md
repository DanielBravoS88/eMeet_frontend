# INFORME ACADÉMICO — PROYECTO eMeet

---

## PORTADA

| Campo | Detalle |
|---|---|
| **Nombre del proyecto** | eMeet — Plataforma de descubrimiento social de eventos y lugares cercanos |
| **Integrantes** | Antonio Vivar · Daniel Bravo · Francisco Levipil |
| **Repositorio frontend** | `eMeet_frontend` — https://github.com/DanielBravoS88/eMeet_frontend |
| **Repositorio backend** | `eMeet_Backend_SupaBase` — https://github.com/DanielBravoS88/eMeet_Backend_SupaBase |
| **Frontend desplegado** | https://e-meet-frontend-nine.vercel.app/ |
| **Backend desplegado** | https://emeet-backend-supabase-p0i6.onrender.com |
| **Base de Datos** | Supabase — https://supabase.com/dashboard/project/ksghpwonmnxmbhmfpaog |
| **Fecha del informe** | Mayo de 2026 |
| **Tipo de documento** | Informe académico de entrega de proyecto |

---

## 1. Resumen Ejecutivo

**eMeet** es una plataforma web móvil-first que conecta a personas con eventos, bares, restaurantes y lugares de interés cercanos a través de una mecánica de descubrimiento por deslizamiento (swipe), inspirada en la experiencia de aplicaciones de tipo tarjeta. El usuario evalúa lugares y eventos en tiempo real, puede guardar sus favoritos, unirse a comunidades por lugar y comunicarse a través de un chat en tiempo real.

El sistema está compuesto por un frontend desarrollado en **Next.js 14** (repositorio `eMeet_frontend`) y un backend gestionado mediante el repositorio **`eMeet_Backend_Supabase`**, el cual utiliza **Supabase** como plataforma de autenticación, base de datos PostgreSQL y comunicación en tiempo real.

El proyecto se encuentra en etapa de **MVP funcional** con autenticación real vía Supabase, integración con Google Maps Places API, sistema de roles (usuario, administrador, locatario), chat comunitario en tiempo real y panel de administración.

---

## 2. Descripción del Problema

Las personas que desean conocer actividades, bares, restaurantes y eventos culturales cercanos a su ubicación enfrentan la dificultad de navegar por múltiples plataformas fragmentadas (Google Maps, redes sociales, sitios web de locales) sin una experiencia unificada que les permita descubrir, filtrar y guardar opciones de forma rápida e intuitiva.

Adicionalmente, los propietarios de establecimientos (locatarios) carecen de una herramienta sencilla para publicar y promocionar sus eventos directamente hacia una audiencia localizada y segmentada por intereses.

---

## 3. Justificación del Proyecto

La existencia de una plataforma integrada que combine geolocalización, descubrimiento social, comunidad y gestión de eventos responde a una necesidad real del mercado local. La mecánica de swipe simplifica la toma de decisión del usuario, reduce la fricción al explorar opciones y fomenta la participación activa al conectar personas con la oferta de entretenimiento y gastronomía de su entorno inmediato.

Desde el punto de vista técnico, el proyecto permite aplicar y demostrar competencias en desarrollo web moderno con tecnologías actuales: Next.js 14, React 18, Express.js, Supabase, Google Maps API y TypeScript estricto, con una arquitectura de tres capas directa.

---

## 4. Objetivo General

Desarrollar una plataforma web móvil-first que permita a los usuarios descubrir, explorar y guardar eventos y lugares de interés cercanos, con soporte para comunidades en tiempo real, roles diferenciados (usuario, locatario, administrador) y gestión de contenido, utilizando como base tecnológica Next.js 14, Supabase y Google Maps Places API.

---

## 5. Objetivos Específicos

1. Implementar un sistema de autenticación con roles mediante Supabase Auth (email/contraseña, OAuth con Google y Apple).
2. Desarrollar una interfaz de feed con mecánica de swipe para descubrir lugares y eventos cercanos.
3. Integrar Google Maps Places API para obtener lugares reales según la geolocalización del usuario.
4. Construir un sistema de chat comunitario en tiempo real utilizando Supabase Realtime.
5. Desarrollar paneles diferenciados para el rol de locatario (creación de eventos) y administrador (moderación y estadísticas).
6. Persistir preferencias, likes, guardados y mensajes del usuario mediante Supabase PostgreSQL.
7. Diseñar e implementar una arquitectura de tres capas directa (frontend Next.js → backend Express.js → Supabase), donde el backend centraliza la seguridad (Helmet, CORS, JWT), la lógica de negocio y las reglas de negocio, sin capa BFF intermedia.

---

## 6. Alcance del Proyecto

### Incluye:
- Autenticación con email/contraseña, Google y Apple vía Supabase Auth.
- Feed de descubrimiento con swipe de lugares reales obtenidos desde Google Places API.
- Filtros por tipo de lugar (restaurante, bar, discoteca, café, gimnasio, museo, etc.) y distancia.
- Sistema de guardado de lugares favoritos.
- Chat comunitario por lugar con mensajes en tiempo real (Supabase Realtime).
- Panel de locatario para crear, gestionar y visualizar eventos propios.
- Panel de administración con KPIs, gestión de usuarios, eventos, moderación y finanzas.
- Middleware de protección de rutas con validación de sesión y roles.
- Diseño responsive mobile-first con Tailwind CSS y animaciones con Framer Motion.

### No incluye (fuera del alcance actual):
- Sistema de pagos o tickets.
- Notificaciones push nativas.
- PWA instalable en dispositivos móviles.
- Sistema de reseñas detalladas propias (se usa Google Rating).
- Recuperación de contraseña (pendiente de implementación).

---

## 7. Público Objetivo

| Segmento | Descripción |
|---|---|
| **Usuario regular** | Personas entre 18-40 años que buscan planes sociales, gastronómicos o culturales cercanos a su ubicación. |
| **Locatario** | Propietarios o encargados de bares, restaurantes, cafés, discotecas u otros establecimientos que desean publicar eventos y atraer clientes. |
| **Administrador** | Equipo interno de eMeet responsable de moderar contenidos, gestionar usuarios y revisar métricas de la plataforma. |

---

## 8. Descripción General de la Solución

eMeet es una Single Page Application (SPA) construida sobre Next.js 14 App Router, que sigue una **arquitectura de tres capas directa sin BFF**:

- Una **capa de presentación** (frontend Next.js 14 en Vercel) con componentes React en TypeScript, estilos Tailwind y animaciones Framer Motion. El frontend llama directamente al backend Express vía `fetchApi.ts` con Bearer JWT.
- Una **capa de lógica de negocio** (backend Express.js en Render) que concentra seguridad (Helmet, CORS, JWT), validaciones y reglas de negocio. Expone 7 grupos de rutas REST: `/auth`, `/profile`, `/events`, `/chat`, `/places`, `/admin`, `/monetization`.
- Una **capa de datos y servicios** gestionada por Supabase (PostgreSQL, Auth, Realtime, Storage) y servicios externos (Google Maps Places API, Mercado Pago, Transbank, Deezer API).

---

## 9. Descripción del Frontend — `eMeet_frontend`

El repositorio `eMeet_frontend` contiene el frontend completo de la plataforma eMeet. Está construido con **Next.js 14 App Router**, utilizando React 18 con TypeScript estricto. El proyecto adopta un modelo de componentes server-first con client components solo donde se requieren interacciones del navegador.

### Estructura de carpetas detectada:

```
app/                    ← Rutas del App Router (Next.js)
  page.tsx              ← Feed principal (/)
  layout.tsx            ← Layout raíz (metadatos, providers)
  auth/                 ← Login, registro, callback OAuth, verificación email
  chat/                 ← Lista de chats y sala individual
  search/               ← Búsqueda y exploración
  saved/                ← Eventos guardados
  profile/              ← Perfil del usuario
  admin/                ← Panel de administración (dashboard, eventos, usuarios, etc.)
  locatario/            ← Panel de locatario
  api/                  ← Route Handlers (operaciones admin con Service Role Key, proxy Deezer, callback OAuth)

src/
  components/           ← Componentes reutilizables (SwipeCard, Layout, NavBar, etc.)
  context/              ← Contextos globales (Auth, Chat, NearbyPlaces, LocatarioEvents)
  hooks/                ← Custom hooks (useNearbyPlaces, useImageUpload, useVideoUpload)
  lib/                  ← Utilidades y clientes (supabase.ts, cn.ts, fetchApi.ts)
  providers/            ← Wrapper de providers (AppProviders, GoogleMapsProvider)
  services/             ← Servicios (placesService.ts, monetizationService.ts)
  types/                ← Tipos TypeScript centrales
  data/                 ← Datos mock y adaptadores
```

### Tecnologías del frontend:
- **Next.js 14** con App Router
- **React 18** con TypeScript 5.6
- **Tailwind CSS 3.4** (mobile-first, utility-first)
- **Framer Motion 11** (animaciones y swipe gestural)
- **@supabase/ssr** y **@supabase/supabase-js** para integración Supabase
- **@react-google-maps/api** para Google Maps y Places API
- **Recharts** para gráficos en el panel de administración
- **Lucide React** y **React Icons** para iconografía

---

## 10. Descripción del Backend — `eMeet_Backend_SupaBase`

El repositorio `eMeet_Backend_SupaBase` es el backend oficial del sistema eMeet. Está construido con **Express.js + TypeScript + Node 20** y desplegado en **Render** (https://emeet-backend-supabase-p0i6.onrender.com). Utiliza el Supabase JS Client para acceder a PostgreSQL y Supabase Auth para validar tokens JWT en cada request.

### Grupos de rutas confirmados:

| Ruta | Funcionalidad |
|---|---|
| `/auth` | login · register · logout · reset-password |
| `/profile` | GET · PATCH perfil · upload avatar (Supabase Storage) |
| `/events` | like · save · CRUD eventos · locatario events |
| `/chat` | rooms · messages · join · read |
| `/places` | search-nearby · photo proxy (Google Maps) |
| `/admin` | stats · reports · users · finance · moderation |
| `/monetization` | tokens · pagos MercadoPago/Transbank · QR · cupones |

### Características técnicas:
- **Seguridad**: Helmet, CORS con whitelist (Vercel + localhost), validación JWT Bearer en cada request.
- **Pagos**: integración con **Mercado Pago SDK** (Checkout + Webhook) y **Transbank WebPay Plus**.
- **CI/CD**: auto-deploy en Render desde rama `main` vía GitHub.

---

## 11. Uso de Supabase como Parte del Backend del Sistema

Supabase actúa como la plataforma de infraestructura backend del sistema eMeet. Sus roles son:

| Servicio Supabase | Uso en eMeet |
|---|---|
| **Supabase Auth** | Autenticación con email/contraseña, OAuth (Google, Apple), verificación de email, sesiones mediante JWT |
| **Supabase PostgreSQL** | Base de datos relacional para perfiles, eventos, chats, miembros y acciones de usuario |
| **Supabase Realtime** | Canal de mensajería en tiempo real para el chat comunitario (INSERT en `chat_messages`) |
| **Supabase Storage** | Almacenamiento de imágenes de perfil y eventos (confirmado por hooks `useImageUpload`, `useVideoUpload`) |
| **Supabase SSR** | Integración segura con Next.js mediante cookies para sesiones server-side |

URL del proyecto Supabase: https://supabase.com/dashboard/project/ksghpwonmnxmbhmfpaog

---

## 12. Funcionalidades Implementadas

| Funcionalidad | Estado | Detalles |
|---|---|---|
| Autenticación email/contraseña | ✅ Implementado | Login y registro con Supabase Auth |
| OAuth Google y Apple | ✅ Implementado | `signInWithOAuth` en AuthContext |
| Feed de swipe de lugares | ✅ Implementado | Integración real con Google Places API |
| Filtros de tipo de lugar | ✅ Implementado | PlaceTypeFilters, togglePlaceType |
| Filtro de distancia | ✅ Implementado | DistanceFilter, selectedDistanceKm |
| Geolocalización del usuario | ✅ Implementado | navigator.geolocation en NearbyPlacesContext |
| Guardar lugares favoritos | ✅ Implementado | Persistencia en Supabase (`user_events` con action=save) |
| Like de lugares | ✅ Implementado | Persistencia en Supabase (`user_events` con action=like) |
| Vista de guardados (/saved) | ✅ Implementado | Con respaldo en localStorage si no hay Supabase |
| Perfil del usuario | ✅ Implementado | Datos desde Supabase, actualización vía API |
| Chat comunitario por lugar | ✅ Implementado | ChatContext con Supabase Realtime |
| Mensajes en tiempo real | ✅ Implementado | Canal Supabase Realtime (INSERT en chat_messages) |
| Panel de administración | ✅ Implementado | Dashboard, KPIs, gestión de eventos y usuarios |
| Panel de locatario | ✅ Implementado | Crear/editar/eliminar eventos, subida de imagen y video |
| Sistema de monetización | ✅ Implementado | Wallet de tokens, compra de packs (Starter/Growth/Pro), pagos MercadoPago/Transbank |
| Campañas de promoción | ✅ Implementado | Tipos: featured, geo_boost, coupon, premium_badge; descuenta tokens del wallet |
| Cupones QR | ✅ Implementado | Generación de QR único por cupón, validación y redención |
| Integración Deezer | ✅ Implementado | Búsqueda musical proxeada vía /api/deezer en Next.js |
| Recuperación de contraseña | ✅ Implementado | Reset vía Supabase Auth + /auth/reset-password |
| Protección de rutas por rol | ✅ Implementado | Middleware Next.js + ProtectedRoute component |
| Mapa interactivo (BellavistaMap) | ✅ Implementado | Google Maps con Places API |
| Verificación de email | ✅ Implementado | Página `/auth/verify-email` |
| Callback OAuth | ✅ Implementado | Ruta `/auth/callback` |

---

## 13. Funcionalidades Pendientes

| Funcionalidad | Prioridad | Detalle |
|---|---|---|
| Notificaciones push | Media | No implementado — mencionado en roadmap |
| PWA instalable | Baja | Sin `manifest.json` ni service worker |
| Modo oscuro / claro toggle | Baja | Solo modo oscuro disponible |
| Detalle expandido de evento | Media | Sin página dedicada de detalle por evento |
| Pruebas automatizadas | Alta | Sin suite de tests (Jest/Vitest/Playwright) |

---

## 14. Funcionalidades Mock o Simuladas

| Funcionalidad | Descripción del mock |
|---|---|
| Autenticación sin Supabase | Si `NEXT_PUBLIC_SUPABASE_URL` no está configurado, el sistema usa `localStorage` con usuario simulado |
| Chat sin backend | `ChatContext` usa `localStorage` cuando `hasSupabaseEnv` es `false` |
| Eventos de locatario sin backend | `LocatarioEventsContext` usa `localStorage` como fallback |
| Datos mock de eventos | `src/data/mockEvents.ts` contiene eventos de ejemplo; no se usa directamente en el feed actual, pero existe en el proyecto |

---

## 15. Limitaciones Actuales

- El sistema depende de variables de entorno que deben configurarse manualmente (Supabase, Google Maps, URL del backend).
- Sin las variables configuradas, el sistema opera en modo local (localStorage), lo que limita la persistencia entre sesiones y dispositivos.
- La integración con Google Places API desde el cliente expone la API key en el navegador; se recomienda moverla al backend Express (/places), que ya existe y proxea Google Maps.
- El plan gratuito de Supabase no incluye backups automáticos; se recomienda hacer backup manual antes de la entrega final.
- No existen pruebas automatizadas detectadas en el frontend (sin archivos de test ni configuración de testing).

---

## 16. Tecnologías Utilizadas

### Frontend (`eMeet_frontend`)

| Tecnología | Versión | Rol |
|---|---|---|
| Next.js | 14.2.15 | Framework React con App Router |
| React | 18.3.1 | Librería UI |
| TypeScript | 5.6.2 | Tipado estático |
| Tailwind CSS | 3.4.14 | Estilos utility-first |
| Framer Motion | 11.11.0 | Animaciones y gestos |
| @supabase/ssr | 0.10.2 | Integración Supabase con Next.js SSR |
| @supabase/supabase-js | 2.103.0 | Cliente Supabase general |
| @react-google-maps/api | 2.20.8 | Google Maps + Places API |
| Recharts | 3.8.1 | Gráficos para panel admin |
| Lucide React | 1.8.0 | Iconos SVG |
| React Icons | 5.3.0 | Set de iconos adicionales |
| nextjs-toploader | 3.9.17 | Indicador de carga de página |

### Backend y Servicios

| Tecnología | Rol |
|---|---|
| Supabase Auth | Autenticación y gestión de sesiones |
| Supabase PostgreSQL | Base de datos relacional |
| Supabase Realtime | WebSockets para chat en tiempo real |
| Supabase Storage | Almacenamiento de archivos |
| Google Maps Platform | Places API para lugares cercanos |
| eMeet_Backend_Supabase | API REST del sistema (backend externo) |

---

## 17. Arquitectura General

El sistema sigue una **arquitectura de tres capas directa sin BFF**. El frontend llama directamente al backend Express via Bearer JWT. Los Route Handlers de Next.js (`app/api/`) solo manejan operaciones admin con Service Role Key, el proxy Deezer y el callback OAuth — no actúan como intermediarios BFF.

```
[Usuario]
    ↓ HTTPS
[Frontend Next.js 14 — Vercel]
    ↓ REST + Bearer JWT          ↓ signIn/signOut OAuth    ↓ WebSocket Realtime
[Backend Express — Render]   [Supabase Auth]           [Supabase Realtime]
    ↓                              ↓
[Supabase PostgreSQL]         [Supabase Storage]
    ↓
[Google Maps | Mercado Pago | Transbank | Deezer]
```

> La justificación completa del cambio de BFF a tres capas directa se documenta en la sección 2.1.1 del informe EP2 y en [Arquitectura.md](./Arquitectura.md).

---

## 18. Flujo de Uso de la Aplicación

1. El usuario accede a la URL de la aplicación.
2. Si no tiene sesión activa, el middleware de Next.js lo redirige a `/auth`.
3. El usuario se registra (con email o OAuth) o inicia sesión.
4. Según el rol asignado, es redirigido:
   - `user` → Feed principal (`/`)
   - `admin` → Panel de administración (`/admin`)
   - `locatario` → Panel de locatario (`/locatario`)
5. En el feed, el usuario otorga permiso de geolocalización y se cargan lugares cercanos desde Google Places.
6. El usuario desliza tarjetas para dar like, descartar o guardar lugares.
7. Al dar like a un lugar, puede unirse al chat comunitario del establecimiento.
8. Desde `/chat`, accede a salas de chat en tiempo real con otros usuarios del mismo lugar.
9. El usuario puede editar su perfil e intereses desde `/profile`.

---

## 19. Riesgos del Proyecto

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Exposición de Google Maps API key en cliente | Media | Alto | Mover consultas al backend Express (/places) — ya existe la ruta |
| Dependencia de servicios externos (Supabase, Google) | Alta | Alto | Modo local (localStorage) como fallback |
| Falta de pruebas automatizadas | Alta | Medio | Implementar suite de pruebas (Vitest, Playwright) |
| Consumo no controlado de cuota de Google Places | Media | Medio | Limitar llamadas, implementar caché en backend |
| Acceso no autorizado a rutas por rol | Baja | Alto | Middleware + validación server-side implementada |
| Pérdida de datos sin backup de Supabase | Media | Alto | Configurar respaldo automático desde Supabase |

---

## 20. Conclusión

El proyecto eMeet ha alcanzado un estado de MVP funcional con las características principales implementadas: autenticación real con roles, descubrimiento de lugares por geolocalización, sistema de guardados, chat en tiempo real y paneles diferenciados para cada tipo de usuario. La base tecnológica elegida (Next.js 14, Supabase, Google Maps) es moderna, escalable y alineada con las prácticas actuales de la industria.

Las principales áreas de mejora identificadas son la implementación de pruebas automatizadas, la centralización de las llamadas a Google Maps en el backend Express (/places), y la incorporación de funcionalidades como notificaciones push y detalle expandido de eventos.

El proyecto demuestra una integración coherente entre frontend y backend, un manejo claro de roles y autenticación, y una arquitectura preparada para escalar progresivamente.

---

## 21. Referencias del Proyecto

| Recurso | Detalle |
|---|---|
| **Frontend desplegado** | https://e-meet-frontend-nine.vercel.app/ |
| **Backend desplegado** | https://emeet-backend-supabase-p0i6.onrender.com |
| **Repositorio frontend** | https://github.com/DanielBravoS88/eMeet_frontend |
| **Repositorio backend** | https://github.com/DanielBravoS88/eMeet_Backend_SupaBase |
| **Base de datos Supabase** | https://supabase.com/dashboard/project/ksghpwonmnxmbhmfpaog |
| **Framework backend** | Express.js + TypeScript + Node 20 |
| **Plataforma backend** | Render (auto-deploy desde main) |
| **Plataforma frontend** | Vercel (auto-deploy desde main) |
| **Pagos integrados** | Mercado Pago SDK (Checkout + Webhook) + Transbank WebPay Plus |
| **Pruebas automatizadas** | No implementadas (pendiente — Vitest / Playwright recomendado) |
