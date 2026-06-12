# App móvil (Android) — Capacitor

eMeet se distribuye también como aplicación móvil nativa para Android usando
[Capacitor](https://capacitorjs.com/). La web en Vercel **no cambia**: la app
móvil es un shell nativo cuyo WebView carga directamente la web de producción.

## Arquitectura

```
┌─────────────────────────────┐
│   App Android (Capacitor)   │
│  ┌───────────────────────┐  │
│  │ WebView               │  │──── carga ───▶ https://e-meet-frontend-nine.vercel.app
│  │ (la web de producción)│  │
│  └───────────────────────┘  │
│  APIs nativas: geolocación, │
│  ciclo de vida, back button │
└─────────────────────────────┘
```

**Ventaja**: un solo código y un solo deploy. Cada push a `main` actualiza la
web **y** el contenido de la app móvil simultáneamente (sin re-publicar el APK).

## Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `capacitor.config.ts` | Config principal: appId, nombre y `server.url` (la web remota) |
| `capacitor-www/` | Placeholder requerido por Capacitor; el contenido real viene de Vercel |
| `android/` | Proyecto Android nativo generado (`npx cap add android`) |
| `android/local.properties` | Ruta local del SDK — **no se sube a git** (cada dev usa la suya) |

## Requisitos

- **Android Studio** (incluye el SDK y un JDK 17+ en `jbr/`)
- El `local.properties` se genera automáticamente al abrir el proyecto en
  Android Studio, o manualmente: `sdk.dir=C:/Users/TU_USUARIO/AppData/Local/Android/Sdk`

## Comandos

```bash
npm run cap:sync      # Sincroniza config/plugins con el proyecto Android
npm run cap:open      # Abre el proyecto en Android Studio
npm run android:apk   # Compila el APK debug (android/app/build/outputs/apk/debug/)
```

> Si `java -version` en tu PATH es < 17, define `JAVA_HOME` apuntando al JDK
> de Android Studio antes de compilar:
> `$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"`

## Permisos declarados (AndroidManifest.xml)

- `INTERNET` — carga de la web y llamadas a la API
- `ACCESS_COARSE_LOCATION` / `ACCESS_FINE_LOCATION` — feed de lugares y
  eventos cercanos (el WebView de Capacitor gestiona el prompt de permiso
  cuando la web llama a `navigator.geolocation`)

## Publicación en Play Store (pendiente)

1. Generar keystore de firma (`keytool -genkey ...`) — guardarlo fuera del repo.
2. Configurar `signingConfigs` en `android/app/build.gradle`.
3. Compilar bundle de release: `gradlew bundleRelease` (genera `.aab`).
4. Subir a Google Play Console (requiere cuenta de desarrollador, USD 25 única vez).

## iOS (futuro)

Capacitor soporta iOS con `npx cap add ios`, pero compilar requiere una Mac
con Xcode. La config actual (`capacitor.config.ts`) ya es compatible.
