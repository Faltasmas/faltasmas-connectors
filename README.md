# @faltasmas/connectors

Contrato (tipos, validación) y registro de conectores de Faltasmas.

## Contrato del cargador (para quien implementa la app)

Esta sección es la única fuente de verdad del contrato entre la app y los bundles.

### Formato del bundle

- El bundle es un único IIFE que asigna `globalThis.FaltasmasConnector` al namespace del módulo (`BUNDLE_GLOBAL`).
- El conector está en `FaltasmasConnector.connector`, con `.manifest` y `.fetchAbsences`.
- Antes de usarlo, el host debe comprobar que `manifest.id` y `manifest.version` del bundle cargado son iguales a los de la entrada del registro.

### Requisitos del host

- Proporciona el `HttpClient` y es dueño del almacén de cookies.
- Debe limitar las peticiones a los `allowedHosts` del registro/manifest y gestionar las redirecciones de forma explícita (el `fetch` de React Native las sigue de forma nativa).
- El bundle depende de los globales `URL`, `URLSearchParams`, `String.prototype.replaceAll`, `matchAll` y `String.fromCodePoint`.
- `crypto.subtle` no existe en React Native: hace falta un polyfill (por ejemplo `react-native-quick-crypto`) para `verifyBundle`.

### Modelo de seguridad

- El hash del registro es la raíz de confianza; `verifyBundle` falla cerrado.
- `allowedHosts` lo declara el propio bundle, así que el contrato por sí solo no puede hacerlo cumplir: el host debe imponerlo y debería aislar la evaluación (sin globales de red disponibles para el bundle).
- Antes de cualquier subida de "reportar error", el host debe eliminar de mensajes y logs los valores exactos de las credenciales y el GUID del alumno, porque el issue es público.
- Ante `invalid_credentials`, el host debe detener las sincronizaciones programadas hasta que el usuario vuelva a introducir las credenciales.

### Semántica de los datos

- `AbsenceReport.totalHours` son horas **acumuladas del curso escolar** (no por trimestre). El servidor calcula los totales trimestrales como deltas respecto a una línea base y se reinicia al cambiar de curso.

### Errores

- Usar `isConnectorError(e)` en lugar de `instanceof ConnectorError` al cruzar la frontera del bundle (cada bundle incluye su propia clase).

## Scripts

- `bun run typecheck`, `bun test`.
- `bun scripts/registry-entry.ts <bundle-file> <bundle-url>` evalúa el bundle, valida su manifest e imprime la entrada del registro.
