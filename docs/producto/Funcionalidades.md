# Funcionalidades del Sistema eMeet

> Este documento clasifica las funcionalidades confirmadas del sistema eMeet según el Informe EP2 y el análisis de ambos repositorios (`eMeet_frontend` y `eMeet_Backend_Supabase`).

---

## 1. Funcionalidades Implementadas ✅

### Autenticación y Sesión

| Funcionalidad | Componente / Archivo | Detalles |
|---|---|---|
| Login con email y contraseña | `AuthContext.tsx`, `LoginForm.tsx` | Llama a `POST /api/auth/login` en el backend; fallback local sin Supabase |
| Registro con email y contraseña | `AuthContext.tsx`, `SignUpForm.tsx` | Llama a `POST /api/auth/register`; soporta registro por rol |
| Login con Google (OAuth) | `AuthContext.tsx` | `supabase.auth.signInWithOAuth({ provider: 'google' })` |
| Login con Apple (OAuth) | `AuthContext.tsx` | `supabase.auth.signInWithOAuth({ provider: 'apple' })` |
| Callback OAuth | `app/auth/callback/route.ts` | Maneja el redirect de Supabase post-OAuth |
| Verificación de email | `app/auth/verify-email/page.tsx` | Pantalla de confirmación cuando Supabase requiere verificación |
| Logout | `AuthContext.tsx` | Llama a `POST /api/auth/logout` + `supabase.auth.signOut()` |
| Protección de rutas (middleware) | `middleware.ts` | Redirige a `/auth` si no hay sesión en rutas protegidas |
| Protección de rutas por rol | `middleware.ts`, `ProtectedRoute.tsx` | Valida rol `admin` y `locatario`; redirige si no corresponde |
| Persistencia de sesión | `AuthContext.tsx`, `@supabase/ssr` | Cookie-based sessions; sesión persiste entre recargas |
| Modo fallback sin Supabase | `AuthContext.tsx` | Si `hasSupabaseEnv=false`, usa `localStorage` con usuario simulado |
| Sincronización de perfil post-login | `AuthContext.syncUserData()` | Carga perfil, likes y guardados desde el backend en paralelo |
| Mensajes de error humanizados | `authErrors.ts`, `LoginForm.tsx` | `humanizeAuthError()` traduce errores de Supabase a mensajes claros con sugerencia (recuperar contraseña, crear cuenta, verificar correo, reintentar) y resalta el campo afectado |
| Escena animada en el hero de login | `app/auth/page.tsx` | Ilustración de "amigos" animada; shake en el formulario ante credenciales inválidas |

---

### Experiencia de Usuario (UX) e Interfaz

| Funcionalidad | Componente / Archivo | Detalles |
|---|---|---|
| Sidebar colapsable tipo "rail" | `SidebarNav.tsx`, `Layout.tsx` | Se contrae a una barra de iconos; el estado se persiste entre sesiones |
| Onboarding de bienvenida | `OnboardingOverlay.tsx` | Overlay guiado la primera vez que el usuario entra |
| Header scroll-aware en Modo Creador | `app/creator/page.tsx` | El encabezado reacciona al scroll (se oculta/compacta) |
| Micro-interacciones y animaciones de navegación | `template.tsx`, `index.css`, Framer Motion | Transiciones de página y entrada al feed potenciadas |
| Accesibilidad: respeto a `reduce-motion` | `index.css`, `app/creator/page.tsx` | Desactiva animaciones cuando el sistema lo solicita (`prefers-reduced-motion`) |
| Imagen Open Graph dinámica | `app/opengraph-image.tsx` | Genera la previsualización social del sitio |

---

### Feed de Descubrimiento

| Funcionalidad | Componente / Archivo | Detalles |
|---|---|---|
| Feed de swipe de lugares cercanos | `app/page.tsx`, `SwipeCard.tsx` | Stack de tarjetas animadas con Framer Motion |
| Geolocalización del usuario | `NearbyPlacesContext.tsx` | `navigator.geolocation.getCurrentPosition()` |
| Carga de lugares desde Google Places | `useNearbyPlaces.ts`, `placesService.ts` | `google.maps.places.PlacesService.nearbySearch()` |
| Filtro por tipo de lugar | `PlaceTypeFilters.tsx`, `NearbyPlacesContext.tsx` | Chips seleccionables (restaurant, bar, café, etc.) |
| Filtro por distancia | `DistanceFilter.tsx`, `NearbyPlacesContext.tsx` | Slider de distancia en km |
| Filtro por fecha del evento | `DateRangeFilter.tsx`, `feedFilters.ts` | Hoy / fin de semana / próxima semana; descarta lugares sin fecha |
| Filtro por precio | `PriceFilter.tsx`, `feedFilters.ts` | Todos / gratis / pagado (`matchesPrice`) |
| Filtro por categoría de evento | `EventCategoryFilter.tsx`, `feedFilters.ts` | Chips por categoría (fiesta, música, etc.) |
| Swipe right (like) | `SwipeCard.tsx`, `app/page.tsx` | Persiste like en backend/localStorage |
| Swipe left (descartar) | `SwipeCard.tsx`, `app/page.tsx` | Excluye el lugar del feed local |
| Botón bookmark (guardar) | `SwipeCard.tsx` | Guarda el lugar en `/saved` |
| Toast de feedback | `app/page.tsx` | Feedback visual verde/rojo tras swipe |
| Estado vacío del feed | `app/page.tsx` | Pantalla con opción de reiniciar cuando no hay más tarjetas |
| Esqueleto de carga (skeleton) | `app/page.tsx` | Animación shimmer mientras carga el feed |
| Mapa interactivo lateral | `BellavistaMap.tsx` | Mapa Google Maps con marcadores de lugares cercanos |
| Enriquecimiento de lugares | `NearbyPlacesContext.tsx` | Fetch de foto, web, teléfono y horarios para los 2 primeros lugares |

---

### Guardados y Likes

| Funcionalidad | Componente / Archivo | Detalles |
|---|---|---|
| Vista de lugares guardados | `app/saved/page.tsx` | Lista de lugares con image lateral |
| Eliminar de guardados | `app/saved/page.tsx` | Remove del estado local y backend |
| Persistencia de likes/guardados | `AuthContext.tsx`, `LocatarioEventsContext.tsx` | Vía `user_events` en Supabase (backend) o localStorage |

---

### Chat Comunitario

| Funcionalidad | Componente / Archivo | Detalles |
|---|---|---|
| Lista de salas de chat | `app/chat/page.tsx`, `ChatContext.tsx` | Carga desde `/api/chat/rooms` del backend |
| Sala de chat individual | `app/chat/[roomId]/page.tsx` | Historial de mensajes de la sala |
| Enviar mensajes | `ChatContext.sendMessage()` | Con actualización optimista; se reemplaza con ID real del servidor |
| Recibir mensajes en tiempo real | `ChatContext.tsx` | Suscripción a Supabase Realtime (INSERT en `chat_messages`) |
| Presencia (usuarios en línea) | `app/chat/[roomId]/page.tsx`, `ChatBubble.tsx` | Canal de presencia de Supabase Realtime; muestra quién está conectado en la sala |
| Indicador "escribiendo…" (typing) | `app/chat/[roomId]/page.tsx` | Broadcast de typing por Realtime; burbuja de chat anclada al contenido |
| Unirse a una sala | `ChatContext.joinRoom()` | `POST /api/chat/rooms/:id/join` |
| Marcar sala como leída | `ChatContext.markRoomRead()` | `POST /api/chat/rooms/:id/read` |
| Contador de no leídos | `ChatContext.tsx` | Calculado desde `rooms[].unreadCount` |
| Modo local sin Supabase | `ChatContext.tsx` | Usa `localStorage` cuando `hasSupabaseEnv=false` |

---

### Perfil del Usuario

| Funcionalidad | Componente / Archivo | Detalles |
|---|---|---|
| Ver perfil | `app/profile/page.tsx` | Muestra datos del usuario autenticado |
| Editar perfil | `AuthContext.updateUser()` | `PATCH /api/profile` → actualiza estado global |
| Editar intereses | `app/profile/page.tsx` | Chips de categorías seleccionables |
| Cerrar sesión | `app/profile/page.tsx` | Llama a `AuthContext.logout()` |

---

### Panel de Administrador

| Funcionalidad | Componente / Archivo | Detalles |
|---|---|---|
| Dashboard con KPIs | `app/admin/page.tsx`, `KpiCard.tsx` | Total usuarios, eventos, comunidades, reportes pendientes |
| Gráfico de área (tickets) | `TicketAreaChart.tsx` | Visualización de interacciones por tiempo (Recharts) |
| Gráfico donut (categorías) | `CategoryDonut.tsx` | Distribución de eventos por categoría (Recharts) |
| Tabla de eventos recientes | `EventsTable.tsx` | Lista con título, categoría, estado y fecha |
| Gestión de eventos | `app/admin/events/page.tsx` | Vista de gestión de todos los eventos publicados |
| Gestión de usuarios | `app/admin/users/page.tsx` | Vista de gestión de usuarios del sistema |
| Moderación | `app/admin/moderation/page.tsx` | Revisión y resolución de reportes |
| Finanzas | `app/admin/finance/page.tsx` | Estadísticas financieras del sistema |
| Sidebar de navegación admin | `src/components/admin/Sidebar.tsx` | Navegación entre subrutas del panel |

---

### Modo Creador (antes "Panel de Locatario")

> El antiguo panel de locatario se reorganizó como **Modo Creador** en la ruta `app/creator/page.tsx`. La ruta `/locatario` ahora **redirige a `/creator`** para no romper enlaces antiguos (`app/locatario/page.tsx`).

| Funcionalidad | Componente / Archivo | Detalles |
|---|---|---|
| Crear evento propio | `app/creator/page.tsx`, `LocatarioEventsContext.createLocatarioEvent()` | `POST /events/locatario`; se publica directo en estado `live` |
| Eliminar evento propio | `LocatarioEventsContext.removeLocatarioEvent()` | `DELETE /events/locatario/:id` |
| Lista de eventos propios | `app/creator/page.tsx` | Carga desde `/events/locatario` |
| Stats de interesados por evento | `app/creator/page.tsx`, `CreatorModeSection.tsx` | `GET /events/locatario/stats`: likes recibidos y miembros del chat por evento, total e identificación del evento top |
| Vista previa del evento | `EventPreviewCard.tsx` | Tarjeta de previsualización mientras se crea el evento |
| Subida de imagen de evento | `ImageUpload.tsx`, `useImageUpload.ts` | Supabase Storage |
| Subida de video de evento | `VideoUpload.tsx`, `useVideoUpload.ts` | Supabase Storage |
| Música del evento (Deezer) | `DeezerSearch.tsx` | Búsqueda de pista vía proxy Deezer |
| Selector de ubicación en mapa | `LocationPickerMap.tsx` | Mapa interactivo para seleccionar lat/lng del evento |
| Selector de fecha y hora | `DateTimePicker.tsx` | Calendario para fecha del evento |

---

### Monetización y Pagos

| Funcionalidad | Componente / Archivo | Detalles |
|---|---|---|
| Billetera de tokens | `monetizationService.ts`, backend `/monetization` | Cada usuario tiene un saldo de tokens en `token_wallets` |
| Compra de tokens | Backend `/monetization/tokens` | Flujo de compra integrado con pasarela de pago |
| Pago con Mercado Pago | Backend `/monetization` | Checkout + Webhook de confirmación |
| Pago con Transbank | Backend `/monetization` | WebPay Plus para pagos en Chile |
| Campañas de promoción | Backend `/monetization` | Locatarios crean campañas vinculadas a sus eventos |
| Cupones QR | Backend `/monetization` | Generación de cupones con código único y validación QR |
| Proxy musical Deezer | `app/api/deezer/route.ts` | Route Handler que proxea Deezer API para el feed |
| Recuperación de contraseña | `AuthContext.tsx` | `supabase.auth.resetPasswordForEmail()` |

---

## 2. Funcionalidades Parcialmente Implementadas 🔄

| Funcionalidad | Estado | Detalle |
|---|---|---|
| Detalle expandido de evento | Parcial | No existe página dedicada de detalle; el modal de `SwipeCard` en `/search` es el acercamiento actual |
| Búsqueda en `/search` | Parcial | La UI existe; la integración con datos reales del backend para búsqueda avanzada está pendiente de validar |
| Estadísticas de likes/guardados en perfil | Parcial | Se muestra el conteo desde el estado local, no desde el backend en tiempo real |

---

## 3. Funcionalidades Mock o Simuladas 🎭

| Funcionalidad | Descripción del mock |
|---|---|
| Autenticación sin Supabase | Si `NEXT_PUBLIC_SUPABASE_URL` no está configurado, `AuthContext` usa `localStorage` con usuario simulado basado en el email ingresado |
| Roles inferidos por email | En modo local, el rol se determina por el contenido del email: `admin@` → admin, `locatario@` → locatario, cualquier otro → user |
| Chat sin backend | `ChatContext` usa `localStorage` cuando `hasSupabaseEnv=false` |
| Eventos de locatario sin backend | `LocatarioEventsContext` guarda en `localStorage` cuando no hay conexión |
| Datos mock de eventos | `src/data/mockEvents.ts` contiene ~20 eventos de ejemplo para desarrollo; actualmente no se inyectan en el feed real (este usa Google Places) |
| Statuses de eventos en admin | En el dashboard admin, los statuses (live/draft/flagged) se asignan en demo rotation desde el array `DEMO_STATUSES` ya que el campo no existe en la API actual |

---

## 4. Funcionalidades Pendientes ⏳

| Funcionalidad | Prioridad | Detalle |
|---|---|---|
| Notificaciones push | Media | Mencionadas en roadmap del README original |
| PWA (Progressive Web App) | Baja | Sin `manifest.json` ni service worker |
| Modo oscuro / claro | Baja | Solo modo oscuro disponible actualmente |
| Cobertura de tests más amplia | Media | Ya existe suite con **Jest** (`npm test`); falta ampliar cobertura y agregar E2E |
| Perfil expandido de creador (analítica avanzada) | Media | El Modo Creador ya muestra stats de interesados; analítica avanzada pendiente |

---

## 5. Funcionalidades del Backend (`eMeet_Backend_Supabase`)

El backend Express está desplegado en Render (https://emeet-backend-supabase-p0i6.onrender.com) y expone los siguientes grupos de rutas, todos confirmados según el Informe EP2.

| Grupo | Rutas principales | Consumidor en frontend |
|---|---|---|
| `/auth` | login, register, logout, reset-password | `AuthContext` |
| `/profile` | GET y PATCH de perfil, upload de avatar | `AuthContext.updateUser()` |
| `/events` | like, save, CRUD locatario, liked, saved | `AuthContext`, `LocatarioEventsContext` |
| `/chat` | rooms, messages, join, read | `ChatContext` |
| `/places` | search-nearby, photo proxy | `useNearbyPlaces.ts` (vía contexto) |
| `/admin` | stats, reports, users, finance | `app/admin/*` (vía Route Handler) |
| `/monetization` | tokens, pagos, QR, cupones, campañas | `monetizationService.ts` |
