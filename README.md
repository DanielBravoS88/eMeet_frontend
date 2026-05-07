# eMeet

> Plataforma de descubrimiento social de eventos y lugares cercanos — mobile-first, con mecánica de swipe y comunidades en tiempo real.

**Integrantes**: Daniel Bravo · Francisco Levipil · Antonio Vivar

---

## Índice

- [Descripción del proyecto](#descripción-del-proyecto)
- [Stack tecnológico](#stack-tecnológico)
- [Repositorios del sistema](#repositorios-del-sistema)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Instalación y uso](#instalación-y-uso)
- [Variables de entorno](#variables-de-entorno)
- [Documentación académica](#documentación-académica)
- [Estado actual del proyecto](#estado-actual-del-proyecto)
- [Roadmap y próximos pasos](#roadmap-y-próximos-pasos)

---

## Descripción del proyecto

**eMeet** conecta a personas con eventos, bares, restaurantes y lugares de interés cercanos a través de una experiencia móvil-first con mecánica de swipe y comunidades en tiempo real. El usuario evalúa lugares deslizando tarjetas:

- → **Swipe right** (o botón ❤️): le interesa el lugar.
- ← **Swipe left** (o botón ✕): lo descarta.
- 🔖 **Bookmark**: lo guarda para ver después.
- 💬 **Chat**: se une a la comunidad del lugar en tiempo real.

El sistema soporta tres roles: **usuario regular**, **locatario** (publica eventos) y **administrador** (modera y gestiona el sistema).

---

## Repositorios del Sistema

| Repositorio | Descripción |
|---|---|
| **`eMeet_frontend`** (este repositorio) | Frontend de la aplicación — Next.js 14, React 18, TypeScript, Tailwind CSS |
| **`eMeet_Backend_Supabase`** | Backend del sistema — API REST con Supabase como plataforma de datos y autenticación |

**Plataforma Supabase del proyecto**: https://supabase.com/dashboard/project/ksghpwonmnxmbhmfpaog

---

## Stack Tecnológico

### Frontend (`eMeet_frontend`)

| Tecnología | Versión | Rol |
|---|---|---|
| **Next.js** | 14.2.15 | Framework React con App Router, SSR, Route Handlers |
| **React** | 18.3.1 | UI declarativa basada en componentes |
| **TypeScript** | 5.6.2 | Tipado estático estricto |
| **Tailwind CSS** | 3.4.14 | Utilidades CSS mobile-first |
| **Framer Motion** | 11.11.0 | Animaciones declarativas y gestos de arrastre (swipe) |
| **@supabase/supabase-js** | 2.103.0 | Cliente Supabase (Auth, DB, Realtime, Storage) |
| **@supabase/ssr** | 0.10.2 | Integración Supabase con Next.js SSR |
| **@react-google-maps/api** | 2.20.8 | Google Maps + Places API |
| **Recharts** | 3.8.1 | Gráficos para panel de administración |
| **react-icons** | 5.3.0 | Set de iconos SVG |
| **lucide-react** | 1.8.0 | Iconos SVG modernos |

### Backend y Servicios

| Tecnología | Rol |
|---|---|
| **Supabase Auth** | Autenticación (email, Google, Apple) |
| **Supabase PostgreSQL** | Base de datos relacional |
| **Supabase Realtime** | Chat en tiempo real |
| **Supabase Storage** | Archivos e imágenes |
| **Google Maps Platform** | Places API para lugares cercanos |
| **eMeet_Backend_Supabase** | API REST del sistema |

---

## Estructura del Repositorio

```
eMeet_frontend/
├── app/                    ← Rutas Next.js App Router (páginas y layouts)
│   ├── page.tsx            ← Feed principal (/)
│   ├── auth/               ← Login, registro, OAuth callback
│   ├── chat/               ← Lista de chats y sala individual
│   ├── search/             ← Búsqueda y exploración
│   ├── saved/              ← Guardados
│   ├── profile/            ← Perfil del usuario
│   ├── admin/              ← Panel de administración
│   ├── locatario/          ← Panel de locatario
│   └── api/                ← Route Handlers (BFF)
├── src/
│   ├── components/         ← Componentes reutilizables
│   ├── context/            ← Contextos globales (Auth, Chat, NearbyPlaces, Locatario)
│   ├── hooks/              ← Custom hooks
│   ├── lib/                ← Clientes Supabase, helpers
│   ├── providers/          ← AppProviders, GoogleMapsProvider
│   ├── services/           ← placesService, monetizationService
│   ├── types/              ← Tipos TypeScript centrales
│   └── data/               ← Datos mock y adaptadores
├── public/                 ← Archivos estáticos
├── docs/                   ← Documentos técnicos internos del equipo
├── middleware.ts            ← Protección de rutas y validación de roles
├── Documentacion/          ← 📚 Documentación académica
├── Producto/               ← 📦 Antecedentes técnicos del producto
├── Gestion/                ← 📋 Gestión del proyecto
└── README.md               ← Este archivo
```
│
├── context/
│   └── AuthContext.tsx      # Estado global de autenticación (Context API)
│
├── components/
│   ├── Layout.tsx           # Wrapper con header, BottomNavBar y sidebar de mapa
│   ├── BottomNavBar.tsx     # Navegación inferior fija con NavLink activos
│   ├── SwipeCard.tsx        # Tarjeta de evento con arrastre Framer Motion
│   └── BellavistaMap.tsx    # Mapa Google Maps con Places API (locales cercanos)
│
└── pages/
    ├── FeedPage.tsx         # Pantalla principal: stack de swipe
    ├── AuthPage.tsx         # Login / Registro
    ├── SearchPage.tsx       # Búsqueda y filtros por categoría
    ├── SavedPage.tsx        # Eventos guardados
    └── ProfilePage.tsx      # Perfil del usuario
```

---

## Instalación y Uso

```bash
# Clonar el repositorio
git clone https://github.com/DanielBravoS88/eMeet_frontend.git
cd eMeet_frontend

# Instalar dependencias
npm install

# Servidor de desarrollo (http://localhost:3000)
npm run dev

# Build de producción
npm run build

# Iniciar servidor de producción
npm start
```

---

## Variables de Entorno

Crear el archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Backend eMeet_Backend_Supabase
NEXT_PUBLIC_BACKEND_URL=

# Google Maps Platform
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

> El archivo `.env.local` **nunca debe subirse al repositorio** (está en `.gitignore`).
> Ver [`Producto/Ambiente-local.md`](./Producto/Ambiente-local.md) para más detalles.

---

## Documentación Académica

La documentación completa del proyecto se encuentra en las siguientes carpetas:

| Carpeta | Contenido |
|---|---|
| 📚 [`/Documentacion`](./Documentacion/README.md) | Informe, Arquitectura, UML, MER, Wireframes, Gantt, Plan QA |
| 📦 [`/Producto`](./Producto/README.md) | Código fuente, dependencias, funcionalidades, datos, ambiente local |
| 📋 [`/Gestion`](./Gestion/README.md) | Definición del proyecto, integrantes, ramas, infraestructura, backup, commits |

### Accesos directos a documentos clave:

- [Informe académico completo](./Documentacion/Informe.md)
- [Arquitectura del sistema](./Documentacion/Arquitectura.md)
- [Diagramas UML](./Documentacion/UML.md)
- [Modelo Entidad-Relación](./Documentacion/MER.md)
- [Wireframes de pantallas](./Documentacion/Wireframes.md)
- [Plan Gantt](./Documentacion/Gantt.md)
- [Plan de QA](./Documentacion/Plan_QA.md)
- [Integrantes del equipo](./Gestion/Integrantes.txt)
- [Estrategia de ramas Git](./Gestion/Estrategia-de-ramas.md)
- [Infraestructura cloud](./Gestion/Infraestructura-Cloud.md)

---

## Estado Actual del Proyecto

| Componente | Estado |
|---|---|
| Frontend (`eMeet_frontend`) | ✅ MVP funcional |
| Autenticación (Supabase Auth) | ✅ Implementado |
| Feed de swipe (Google Places) | ✅ Implementado |
| Chat en tiempo real (Supabase Realtime) | ✅ Implementado |
| Panel de administrador | ✅ Implementado |
| Panel de locatario | ✅ Implementado |
| Integración con `eMeet_Backend_Supabase` | 🔄 En progreso |
| Pruebas automatizadas | ⏳ Pendiente |
| Documentación académica | ✅ Entregada en PR `documentation-and-delivery-structure` |

---

## Roadmap y Próximos Pasos

| Prioridad | Feature |
|---|---|
| 🔴 Alta | Completar integración con `eMeet_Backend_Supabase` |
| 🔴 Alta | Mover consultas a Google Places al BFF (Route Handlers) |
| 🔴 Alta | Implementar pruebas automatizadas (Vitest / Playwright) |
| 🟡 Media | Recuperación de contraseña |
| 🟡 Media | Detalle expandido de evento (página individual) |
| 🟡 Media | Sistema de notificaciones push |
| 🟢 Baja | PWA instalable en dispositivos móviles |
| 🟢 Baja | Sistema de pagos / tickets |
