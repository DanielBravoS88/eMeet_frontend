# DAST del frontend

Esta primera fase integra OWASP ZAP como baseline pasivo y manual. El objetivo
esta fijado por una allowlist a la aplicacion local en el puerto 3000. El script
rechaza HTTPS, otros puertos y cualquier dominio externo.

## Alcance de esta fase

- paginas y cabeceras servidas por Next.js;
- spider tradicional durante un minuto;
- reglas pasivas de ZAP;
- reportes HTML, JSON y Markdown en `dast/reports/`.

No cubre todavia autenticacion real, rutas de creador/admin ni escaneo activo.
No deben configurarse variables que apunten a Supabase, Render, Vercel u otros
servicios externos durante esta fase.

## Ejecucion local (requiere aprobacion previa)

1. Iniciar Next.js sin ejecutar el `predev` que libera el puerto por la fuerza:

   ```powershell
   .\node_modules\.bin\next.cmd dev --hostname 0.0.0.0 --port 3000
   ```

2. En otra terminal, ejecutar:

   ```powershell
   ./dast/run-baseline.ps1
   ```

El workflow `.github/workflows/security-dast.yml` hace lo mismo en GitHub
Actions y solo se puede iniciar manualmente. Los hallazgos son informativos en
esta fase y se guardan como artifact; no bloquean la rama.
