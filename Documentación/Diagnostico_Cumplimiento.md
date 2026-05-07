# Diagnóstico de cumplimiento y mejora estructural

## 1) Estado observado del repositorio (antes de esta mejora)

- Repositorio en GitHub con historial incremental.
- Código fuente frontend operativo en raíz (`app/`, `src/`, configuración Next.js).
- Existencia de documentación técnica general en `README.md`, `AUTENTICACION.md`, `TESTING.md` y `docs/`.
- No existía una separación explícita alineada 1:1 con la pauta académica: `Documentación`, `Producto`, `Gestión` e IL 2.2.

## 2) Comparación contra estructura exigida

### 2.1 Documentación

**Requerido:** carpeta dedicada con informe, UML, WireFrame, MER, Gantt, QA, etc.

**Brecha detectada:** la documentación estaba distribuida, pero no organizada por categorías de entrega académica.

**Acción aplicada:** se crea `Documentación/` con subcarpetas temáticas y guía de ubicación.

### 2.2 Producto

**Requerido:** script/tablas/P.A./datos de prueba, código fuente, librerías y otros artefactos del producto.

**Brecha detectada:** no había carpeta de referencia académica llamada `Producto`.

**Acción aplicada:** se crea `Producto/README.md` para inventario y ubicación de artefactos, manteniendo el código en su ubicación actual para no arriesgar funcionamiento.

### 2.3 Gestión

**Requerido:**
- `1.1.2 Documento de registro de definición e identificación del proyecto.docx`
- `Integrantes.txt` con nombres completos

**Brecha detectada:** no existía estructura de gestión alineada a la pauta.

**Acción aplicada:**
- se crea `Gestión/Integrantes.txt` con integrantes oficiales;
- se agrega marcador de posición para el documento `1.1.2 ... .docx` sin inventar binario.

### 2.4 Infraestructura y Ambiente Cloud (IL 2.2)

**Requerido:** evidencias de ambiente cloud de pruebas, stack de servidor y procedimiento de backup producción→pruebas.

**Brecha detectada:** faltaba un espacio explícito de evidencias IL 2.2 dentro de la estructura académica.

**Acción aplicada:** se crea `Documentación/Infraestructura_y_Ambiente_Cloud/` con subcarpetas y guías para evidencias.

## 3) Estructura propuesta (aplicada)

```text
Documentación/
  README.md
  Diagnostico_Cumplimiento.md
  Informe/
  UML/
  WireFrame/
  MER/
  Gantt/
  QA/
  Infraestructura_y_Ambiente_Cloud/
    README.md
    Ambiente_Pruebas_Cloud/
    Stack_Tecnologico_Servidor/
    Gestion_de_Datos_Backup/

Producto/
  README.md

Gestión/
  Integrantes.txt
  README.md
  1.1.2 Documento de registro de definición e identificación del proyecto - PENDIENTE.md
```

## 4) Ubicación sugerida de entregables

- **Informe final** → `Documentación/Informe/`
- **UML** → `Documentación/UML/`
- **WireFrames** → `Documentación/WireFrame/`
- **MER** → `Documentación/MER/`
- **Gantt** → `Documentación/Gantt/`
- **QA (casos, evidencias, resultados)** → `Documentación/QA/`
- **Infra cloud (IL 2.2)** → `Documentación/Infraestructura_y_Ambiente_Cloud/`
- **Documento 1.1.2 (docx)** → `Gestión/1.1.2 Documento de registro de definición e identificación del proyecto.docx`
- **Integrantes** → `Gestión/Integrantes.txt`

## 5) Checklist de pendientes para el equipo

- [ ] Adjuntar el archivo real `Gestión/1.1.2 Documento de registro de definición e identificación del proyecto.docx`.
- [ ] Cargar informe final del proyecto en `Documentación/Informe/`.
- [ ] Incorporar UML, WireFrames, MER y Gantt en sus carpetas.
- [ ] Incorporar evidencias QA (pruebas, resultados, validaciones).
- [ ] Adjuntar evidencias IL 2.2:
  - [ ] Ambiente de pruebas en AWS/Azure/GCP replicando producción.
  - [ ] Stack tecnológico instalado en servidor.
  - [ ] Procedimiento/evidencia de backup de datos de producción a pruebas.

## 6) Observación de estrategia de ramas y colaboración

Se observan ramas remotas de producción y desarrollo (`main`, `develop`) y ramas de trabajo colaborativo (por ejemplo `dani_dev`, `dev/-Frank`, `feature/*`, `copilot/*`), alineadas con una estrategia de trabajo incremental en GitHub.

---

Este ajuste fue realizado **sin modificar código fuente ni lógica de la aplicación**; solo estructura documental/organizativa del repositorio.
