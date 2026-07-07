# Infraestructura Cloud — Proyecto eMeet

> Este documento describe la infraestructura cloud confirmada del proyecto eMeet según el Informe EP2 y el análisis de ambos repositorios (`eMeet_frontend` y `eMeet_Backend_Supabase`).

---

## 1. Resumen del Stack de Infraestructura

| Componente | Plataforma | URL | Estado |
|---|---|---|---|
| **Frontend** (`eMeet_frontend`) | Vercel | https://e-meet-frontend-nine.vercel.app/ | ✅ Desplegado |
| **Backend** (`eMeet_Backend_Supabase`) | Render | https://emeet-backend-supabase-p0i6.onrender.com | ✅ Desplegado |
| **Base de datos** | Supabase PostgreSQL | ksghpwonmnxmbhmfpaog | ✅ Configurado |
| **Autenticación** | Supabase Auth | ksghpwonmnxmbhmfpaog | ✅ Configurado |
| **Tiempo real** | Supabase Realtime | ksghpwonmnxmbhmfpaog | ✅ Configurado |
| **Almacenamiento de archivos** | Supabase Storage | ksghpwonmnxmbhmfpaog | ✅ Configurado |
| **Servicio de mapas** | Google Maps Platform | — | ✅ Integrado en backend |
| **Pagos (Chile)** | Mercado Pago + Transbank | — | ✅ Integrado en backend |
| **Proxy musical** | Deezer API | — | ✅ Integrado vía Route Handler |

---

## 2. Frontend — `eMeet_frontend`

### Plataforma: Vercel

**URL de producción**: https://e-meet-frontend-nine.vercel.app/

El repositorio `eMeet_frontend` usa Next.js 14, integrado nativamente con Vercel. El despliegue automático está configurado: cada push a `main` genera un nuevo deploy en producción. Cada Pull Request genera una Preview URL automática.

### Proceso de despliegue en Vercel:

1. Conectar el repositorio `DanielBravoS88/eMeet_frontend` a Vercel.
2. Configurar las variables de entorno en Vercel (Settings → Environment Variables).
3. Seleccionar la rama `main` como rama de producción.
4. Vercel detecta automáticamente Next.js y configura el build con `npm run build`.
5. Cada Push a `main` dispara un despliegue automático (CI/CD: GitHub → Vercel).
6. Los Pull Requests generan Preview URLs automáticamente.

### Comando de build:

```bash
npm run build
# → next build (compilación TypeScript + generación estática + SSR)
```

---

## 3. Backend — `eMeet_Backend_Supabase`

### Plataforma: Render

**URL de producción**: https://emeet-backend-supabase-p0i6.onrender.com

El backend es una API REST en **Express.js + Node 20 + TypeScript**, desplegado en Render con CI/CD automático desde GitHub (`main` branch).

### Stack del backend:

| Elemento | Tecnología |
|---|---|
| Framework | Express.js |
| Runtime | Node.js 20 |
| Lenguaje | TypeScript |
| ORM/DB client | Supabase JS Client (no Prisma en runtime) |
| Seguridad | Helmet, CORS, JWT RS256 |
| Pagos | Mercado Pago SDK, Transbank WebPay Plus |

### Grupos de rutas confirmados:

| Ruta | Funcionalidad |
|---|---|
| `/auth` | login, register, logout, reset-password |
| `/profile` | GET y PATCH de perfil, subida de avatar |
| `/events` | like, save, CRUD de eventos de locatario |
| `/chat` | rooms, messages, join, read |
| `/places` | search-nearby, photo proxy de Google Maps |
| `/admin` | stats, reports, gestión de usuarios |
| `/monetization` | tokens, pagos, QR, cupones, campañas |

### Proceso de despliegue en Render:

1. Conectar el repositorio a Render (Web Service).
2. Configurar el entorno como Node.js 20.
3. Variables de entorno configuradas en el dashboard de Render.
4. Cada push a `main` dispara un redespliegue automático (CI/CD: GitHub → Render).

---

## 4. Supabase — Plataforma de Datos

**URL del proyecto**: https://supabase.com/dashboard/project/ksghpwonmnxmbhmfpaog

| Servicio | Estado | Detalle |
|---|---|---|
| **PostgreSQL** | ✅ Activo | 14 tablas: profiles, user_events, chat_rooms, room_members, chat_messages, locatario_events, token_wallets, token_transactions, payment_orders, promotion_campaigns, coupons, transactions, reports, qr_validations |
| **Auth** | ✅ Activo | JWT RS256, OAuth Google, OAuth Apple |
| **Realtime** | ✅ Activo | WebSocket `postgres_changes` para mensajes de chat |
| **Storage** | ✅ Activo | Buckets: `avatars`, `event-images`, `event-videos` |
| **Edge Functions** | ❌ No utilizado | El backend Express corre en Render |

### Plan de Supabase:

| Plan | Descripción | Estado |
|---|---|---|
| **Free** | Hasta 500 MB de DB, 1 GB de storage, 2 proyectos | Activo para MVP académico |
| **Pro** | USD 25/mes, recursos aumentados, backups diarios | Recomendado para producción |

---

## 5. Google Maps Platform

| Servicio | Uso | Ubicación |
|---|---|---|
| **Maps JavaScript API** | Mapa interactivo (`BellavistaMap`, `LocationPickerMap`) | Frontend (cliente) |
| **Places API** | Búsqueda de lugares cercanos, proxied al cliente | Backend Express (`/places`) |

**Variable de entorno en frontend**:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=   # solo para el mapa visual
```

> Las consultas a Google Places API se realizan a través del backend Express (`/places`), lo que protege la cuota y evita exposición directa de la clave en el cliente.

---

## 6. Servicios de Pago

### Mercado Pago

| Elemento | Detalle |
|---|---|
| Integración | SDK oficial de Mercado Pago en backend Express |
| Flujo | Checkout + Webhook de confirmación |
| Estado | ✅ Integrado en ruta `/monetization` |

### Transbank

| Elemento | Detalle |
|---|---|
| Integración | WebPay Plus en backend Express |
| Estado | ✅ Integrado en ruta `/monetization` |

---

## 7. Deezer API

| Elemento | Detalle |
|---|---|
| Integración | Route Handler Next.js (`/api/deezer`) actúa como proxy |
| Uso | Reproducción de música ambiental en el feed |
| Estado | ✅ Integrado en frontend |

---

## 8. Variables de Entorno por Ambiente

### Frontend — `.env.local` (desarrollo) / Vercel (producción)

| Variable | Descripción | Visibilidad |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Pública (cliente) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase | Pública (cliente) |
| `NEXT_PUBLIC_BACKEND_URL` | URL del backend REST en Render | Pública (cliente) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Clave de Google Maps (solo mapa visual) | Pública (cliente) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service role para Route Handlers admin | **Solo servidor** |

### Backend — variables en Render

| Variable | Descripción |
|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service role para operaciones admin |
| `JWT_SECRET` | Secreto para validación de tokens |
| `MERCADOPAGO_ACCESS_TOKEN` | Credencial de Mercado Pago |
| `TRANSBANK_API_KEY` | Credencial de Transbank WebPay |
| `GOOGLE_MAPS_API_KEY` | Clave de Google Maps para Places API |

> ⚠️ Ninguna de estas variables debe subirse al repositorio. Usar `.env.local` en desarrollo y la configuración de la plataforma (Vercel/Render) en producción.

---

## 9. CI/CD — Flujo de Despliegue Automático

```
GitHub (push a main)
    │
    ├──▶ Vercel (frontend)
    │        └─ npm run build → Deploy en https://e-meet-frontend-nine.vercel.app/
    │
    └──▶ Render (backend)
             └─ npm run build → Deploy en https://emeet-backend-supabase-p0i6.onrender.com
```

### Verificación post-despliegue

- [ ] La página raíz carga correctamente.
- [ ] El login con email funciona.
- [ ] El feed de swipe carga lugares (Google Maps + backend `/places`).
- [ ] El chat en tiempo real funciona (Supabase Realtime).
- [ ] Las rutas protegidas redirigen correctamente según rol.
- [ ] Los pagos con Mercado Pago / Transbank responden (backend `/monetization`).
- [ ] Las variables de entorno están configuradas en Vercel y Render.

---

## 10. Evidencia Requerida para Entrega Académica

| Evidencia | Descripción |
|---|---|
| Captura del dashboard de Supabase | Mostrar las 14 tablas con datos reales |
| Captura del proyecto en Vercel | Mostrar el despliegue exitoso con la URL de producción |
| Captura del servicio en Render | Mostrar el backend desplegado con logs de ejecución |
| URL de la aplicación desplegada | https://e-meet-frontend-nine.vercel.app/ |
| Variables de entorno configuradas | Captura de la configuración (sin mostrar los valores) |
| Historial de deploys | Captura del historial de deployments en Vercel y Render |
