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
| 10038 - CSP Header Not Set | Medio | Abierta; no cambia runtime |
| 10020 - Missing Anti-clickjacking Header | Medio | Abierta; no cambia runtime |
| 10037 - X-Powered-By | Bajo | Abierta; no cambia runtime |
| 10021 - X-Content-Type-Options Missing | Bajo | Abierta; no cambia runtime |

## Validacion de mitigacion sin incorporacion

Se probo temporalmente una configuracion con CSP, `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, Referrer Policy, Permissions Policy y sin
`X-Powered-By`. El reescaneo confirmo que las reglas 10038, 10020, 10037 y
10021 desaparecian.

Ese cambio fue revertido deliberadamente para que la integracion DAST no altere
el comportamiento normal de la aplicacion ni de produccion. Los cuatro
hallazgos permanecen abiertos como recomendaciones para un cambio de hardening
separado, sujeto a pruebas funcionales y aprobacion explicita.

Durante la prueba temporal permanecieron:

- 10055 CSP `script-src unsafe-inline`;
- 10055 CSP `style-src unsafe-inline`;
- 10055 CSP con directivas amplias para recursos HTTPS dinamicos;
- timestamps Unix en un bundle de terceros;
- comentarios sospechosos de baja confianza en bundles minificados;
- deteccion informativa de aplicacion web moderna.

Los casos 10055 tampoco se silencian. Retirar `unsafe-inline` correctamente requiere
una estrategia CSP con nonces compatible con hidratacion Next.js y validar los
estilos inline. Restringir los recursos HTTPS dinamicos requiere inventariar o
proxificar imagenes y audio. Ambas tareas quedan para una fase de hardening con
pruebas funcionales de navegador.

Los reportes HTML/JSON/Markdown contienen detalle de URLs y se mantienen como
artifacts locales o de CI; `dast/reports/` esta excluido de Git.
