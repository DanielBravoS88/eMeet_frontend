# Resultado baseline DAST del frontend

Fecha: 2026-06-27  
Herramienta: OWASP ZAP 2.17.0 portable  
Objetivo: `http://127.0.0.1:3000`  
Modo: spider tradicional + escaneo pasivo, sin active scan

## Controles de alcance

- build ejecutado desde una copia limpia sin `.env.local`;
- servidor enlazado exclusivamente a `127.0.0.1`;
- `/api/deezer*` y `/api/keepalive*` excluidos;
- no se observaron solicitudes HTTPS ni a servicios externos en el log;
- 103 URLs locales descubiertas.

## Resultado inicial

ZAP reporto siete tipos de alerta. Las cuatro reglas accionables de headers
fueron:

| Regla | Riesgo | Resultado |
|---|---|---|
| 10038 - CSP Header Not Set | Medio | Corregida |
| 10020 - Missing Anti-clickjacking Header | Medio | Corregida |
| 10037 - X-Powered-By | Bajo | Corregida |
| 10021 - X-Content-Type-Options Missing | Bajo | Corregida |

La correccion agrega CSP, `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, Referrer Policy, Permissions Policy y elimina
el header `X-Powered-By`.

## Reescaneo posterior

Las reglas 10038, 10020, 10037 y 10021 ya no aparecen. Permanecen:

- 10055 CSP `script-src unsafe-inline`;
- 10055 CSP `style-src unsafe-inline`;
- 10055 CSP con directivas amplias para recursos HTTPS dinamicos;
- timestamps Unix en un bundle de terceros;
- comentarios sospechosos de baja confianza en bundles minificados;
- deteccion informativa de aplicacion web moderna.

Los casos 10055 no se silencian. Retirar `unsafe-inline` correctamente requiere
una estrategia CSP con nonces compatible con hidratacion Next.js y validar los
estilos inline. Restringir los recursos HTTPS dinamicos requiere inventariar o
proxificar imagenes y audio. Ambas tareas quedan para una fase de hardening con
pruebas funcionales de navegador.

Los reportes HTML/JSON/Markdown contienen detalle de URLs y se mantienen como
artifacts locales o de CI; `dast/reports/` esta excluido de Git.
