# Evidencia de Pruebas Unitarias — eMeet Frontend

---

## Descripción General

Las pruebas unitarias del frontend de **eMeet** fueron desarrolladas con **Jest** y **React Testing Library**, siguiendo el plan de aseguramiento de calidad definido en [`Plan_QA.md`](./Plan_QA.md).

El objetivo de estas pruebas es verificar de forma automatizada que los componentes y la lógica del frontend funcionen correctamente de forma aislada, sin depender de servicios externos como Supabase o Google Maps.

---

## Tecnologías Utilizadas

| Herramienta | Versión | Propósito |
|---|---|---|
| **Jest** | ^30.4.2 | Framework principal de testing |
| **React Testing Library** | ^16.3.2 | Renderizado y consultas sobre componentes React |
| **@testing-library/user-event** | ^14.6.1 | Simulación de interacciones de usuario |
| **jest-environment-jsdom** | ^30.4.1 | Entorno de navegador simulado para Node.js |

---

## Componentes y Módulos Testeados

| Suite de pruebas | Archivo | Qué se verifica |
|---|---|---|
| **LoginForm** | `__tests__/components/LoginForm.test.tsx` | Renderizado del formulario, toggle de contraseña, redirección por rol (user/locatario/admin), parámetro `next`, mensajes de error, estado de carga |
| **SignUpForm** | `__tests__/components/SignUpForm.test.tsx` | Registro de nuevo usuario, validaciones de campos, manejo de errores del servidor |
| **ChatBubble** | `__tests__/components/ChatBubble.test.tsx` | Renderizado de mensajes propios y ajenos, formato de timestamp, distinción visual por remitente |
| **OnboardingOverlay** | `__tests__/components/OnboardingOverlay.test.tsx` | Flujo de bienvenida paso a paso, avance entre pasos, cierre del overlay |
| **SwipeCard** | `__tests__/components/SwipeCard.test.tsx` | Renderizado de tarjeta de evento, botones de like/nope/guardar, badge de estado abierto/cerrado, media (imagen y video), enlace a sitio web |
| **EventsTable (Admin)** | `__tests__/components/admin/EventsTable.test.tsx` | Tabla de eventos del panel administrador, paginación, acciones de gestión |
| **LocatarioEventsContext** | `__tests__/context/LocatarioEventsContext.test.tsx` | Estado global de eventos del locatario, creación y eliminación de eventos desde el contexto |
| **API Admin — Events** | `__tests__/api/admin/events.test.ts` | Endpoints de gestión de eventos (GET, POST, DELETE) con respuestas simuladas |
| **API Admin — Users** | `__tests__/api/admin/users.test.ts` | Endpoints de gestión de usuarios (GET, PATCH de rol) con respuestas simuladas |

---

## Resultado de la Ejecución

> **Captura de pantalla de la ejecución completa:**

![Resultado pruebas unitarias Jest](./img/pruebas-unitarias-resultado.png)

```
Test Suites: 9 passed, 9 total
Tests:       110 passed, 110 total
Snapshots:   0 total
Time:        9.834 s
```

**Estado: TODAS LAS PRUEBAS PASARON** ✓

---

## Cómo Ejecutar las Pruebas

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar con reporte de cobertura
npm run test:coverage

# Ejecutar en modo watch (re-ejecuta al guardar cambios)
npm run test:watch
```

---

## Relación con el Plan QA

Estas pruebas cubren automatizadamente los siguientes casos del [`Plan_QA.md`](./Plan_QA.md):

- **AUTH-02, AUTH-03**: Login exitoso y fallido → cubierto por `LoginForm.test.tsx`
- **AUTH-07, AUTH-08**: Redirección por rol → cubierto por `LoginForm.test.tsx`
- **FEED-02, FEED-03, FEED-04**: Swipe y guardado → cubierto por `SwipeCard.test.tsx`
- **CHAT-02**: Envío de mensajes → cubierto por `ChatBubble.test.tsx`
- **ADM-02**: Tabla de eventos admin → cubierto por `EventsTable.test.tsx`
- **LOC-01, LOC-02**: Creación/eliminación de eventos → cubierto por `LocatarioEventsContext.test.tsx`
