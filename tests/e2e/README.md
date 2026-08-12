# E2E Testing Documentation

## Complete State Certification Flow

### Overview

Este documento describe el test E2E del flujo completo de certificación de estados, que es el caso de uso principal de la aplicación certypass.

### Flujo de Certificación

El test verifica el siguiente flujo:

1. **Creación de Estado**: Crear un estado mediante la UI usando `AddStateForm`
2. **Espera de Certificación**: Esperar hasta 60 segundos para que el estado sea certificado por blockchain
3. **Verificación**: Verificar que el estado está certificado usando la API pública del checker

### Arquitectura del Test

#### Archivos Principales

- `tests/e2e/complete-state-certification.spec.ts` - Test principal E2E
- `tests/e2e/helpers/certification-helper.ts` - Helper con métodos de polling y verificación
- `playwright.config.ts` - Configuración específica para tests de certificación

#### Helper Methods

El `CertificationTestHelper` proporciona los siguientes métodos:

- `waitForCertification(stateId, options)` - Polling del estado hasta que `backed = true`
- `getStateViaChecker(stateId)` - Consultar estado usando API del checker
- `createStateViaUI(page, stateData)` - Crear estado desde UI
- `getStateIdFromUI(page)` - Extraer ID del estado creado
- `verifyStateCertificationInUI(page, stateId)` - Verificar certificación en UI
- `waitForCompleteCertification(page, stateId, options)` - Verificación completa

### Configuración

#### Timeouts y Polling

- **Timeout total**: 60 segundos (configurable)
- **Intervalo de polling**: 5 segundos (configurable)
- **Timeout de Playwright**: 120 segundos (2 minutos)

#### Configuración de Playwright

```typescript
{
  name: 'certification-flow',
  testMatch: '**/complete-state-certification.spec.ts',
  timeout: 120000, // 2 minutos
  retries: 1, // Retry una vez para manejar fallos de red
}
```

### Estrategia de Testing

#### ¿Por qué Polling en lugar de Webhooks?

Los webhooks de iCommunity apuntan a hosts públicos y no pueden alcanzar `localhost` durante el desarrollo. Por tanto, usamos polling para verificar el estado de certificación.

#### Verificación Real vs Mock

- **Certificación**: REAL contra blockchain (no mockeada)
- **Verificación**: API pública del checker (endpoint público)
- **UI**: Interacciones reales con el navegador

#### Datos de Prueba

El test usa datos de prueba específicos:
- Item ID: `test-item-certification`
- Status Type: `test-status-type`
- Descripción: Incluye timestamp para unicidad

### Ejecución

#### Comando Principal

```bash
npm run test:e2e:certification
```

#### Comando Detallado

```bash
playwright test tests/e2e/complete-state-certification.spec.ts --project=certification-flow
```

#### Variables de Entorno

- `ADMIN_E2E_EMAIL` - Email del admin para login (default: admin@certypass.com)
- `ADMIN_E2E_PASSWORD` - Password del admin (default: admin123)

### Casos de Prueba

#### Test Principal

```typescript
test('should create state and verify blockchain certification via checker', async ({ page }) => {
  // 1. Crear estado via UI
  // 2. Verificar creación inicial
  // 3. Esperar certificación (60s timeout, 5s polling)
  // 4. Verificar certificación en API
  // 5. Verificar certificación en UI
  // 6. Verificar timestamps y datos
});
```

#### Tests Adicionales

- **Timeout Handling**: Verificar comportamiento cuando la certificación no ocurre
- **Initial State Verification**: Verificar estado inicial después de la creación

### Consideraciones para CI/CD

#### Pipeline Requirements

- **Timeout**: Mínimo 2 minutos para el test completo
- **Retry**: Configurado para manejar fallos de red temporales
- **Environment**: Requiere acceso a la API pública del checker

#### Monitoring

- **Logs**: El helper incluye logging detallado para debugging
- **Screenshots**: Capturados en caso de fallo
- **Videos**: Grabados para análisis de fallos
- **Traces**: Disponibles para debugging avanzado

### Troubleshooting

#### Problemas Comunes

1. **Timeout en Certificación**
   - Verificar conectividad con blockchain
   - Aumentar timeout si es necesario
   - Verificar logs del helper

2. **Fallos de UI**
   - Verificar que los elementos tienen los `data-testid` correctos
   - Verificar que el formulario se carga correctamente
   - Revisar screenshots en caso de fallo

3. **API del Checker No Disponible**
   - Verificar que el endpoint `/api/checker/status/{stateId}` funciona
   - Verificar conectividad de red
   - Revisar logs de la aplicación

#### Debugging

```bash
# Ejecutar con UI para debugging
npm run test:e2e:ui

# Ejecutar con headed mode
npm run test:e2e:headed

# Ejecutar con debug mode
npm run test:e2e:debug
```

### Métricas de Éxito

- **Tiempo de Certificación**: Típicamente 10-30 segundos
- **Tasa de Éxito**: >95% en condiciones normales
- **Cobertura**: Flujo completo desde UI hasta verificación

### Próximos Pasos

1. **Casos de Error**: Añadir tests para fallos de certificación
2. **Múltiples Estados**: Test de certificación concurrente
3. **Performance**: Monitoreo de tiempos de certificación
4. **Alertas**: Notificaciones cuando los tests fallan consistentemente

## ISBE + CertyPass (live)

### Overview

`tests/e2e/isbe-certypass-flow.spec.ts` prueba de punta a punta el módulo de
certificación ISBE sobre la **organización demo real** (slug `demo`, Postgres
de producción) contra la **API real de ISBE** (`api.icommunitylabs.com`).
Nada está mockeado: ni el login, ni la escritura en base de datos, ni la
llamada a ISBE.

Cubre dos cosas:

1. **Regresión del toggle de superadmin**: activar/desactivar el módulo
   `certIsbe` desde `/superadmin/organizations/[id]` persiste de verdad en
   `Organization.configuracion.modules` (bug real que hubo: la acción usaba
   una comprobación de sesión que nunca reconocía la cookie de superadmin, y
   el toggle fallaba en silencio con `{success:false}` sin que la UI lo
   mostrara).
2. **Flujo real de certificación**: crear un item en la organización demo
   dispara `isbeService.timestampHash()`, se persiste un `IsbeCertification`
   real, y ese hash existe de verdad en el backend de ISBE (se verifica con
   una llamada GET directa a su API, con el mismo `IBS_TOKEN` que usa la app).

### Por qué NO usa la SQLite del `webServer` por defecto

El resto de la suite E2E corre contra una SQLite aislada y desechable
(`playwright-e2e.db`), que `playwright.config.ts` levanta automáticamente vía
`webServer`. Ese entorno no sirve aquí: no tiene el KYC/signatureID real de la
organización demo, ni `IBS_TOKEN`/`IBS_ISBE_APPLICATION_ID` configurados, y
ISBE es un servicio externo real — no tiene sentido apuntarlo a datos de
usar y tirar.

Este spec usa el proyecto dedicado `isbe-live` de `playwright.config.ts`, pero
sigue arrancando desde el mismo `webServer` global. Para que apunte a datos
reales:

1. Arranca el dev server tú mismo, ya con la BD real cargada desde
   `.env.local` (que ya trae `DATABASE_URL`, `IBS_TOKEN` e
   `IBS_ISBE_APPLICATION_ID` de producción):
   ```bash
   npm run dev
   ```
2. En otra terminal, con el puerto 3000 ya ocupado, Playwright detecta el
   servidor existente (`reuseExistingServer: !process.env.CI`) y no lanza su
   propio proceso con SQLite:
   ```bash
   SUPERADMIN_E2E_PASSWORD='...' DEMO_ADMIN_E2E_PASSWORD='...' npm run test:e2e:isbe
   ```

Si `SUPERADMIN_E2E_PASSWORD` o `DEMO_ADMIN_E2E_PASSWORD` no están definidas,
la suite entera se marca como `skip` — nunca falla en seco por falta de
credenciales, y nunca intenta adivinar contraseñas de producción.

### Variables de entorno

| Variable | Requerida | Default |
|---|---|---|
| `SUPERADMIN_E2E_PASSWORD` | Sí | — |
| `DEMO_ADMIN_E2E_PASSWORD` | Sí | — |
| `SUPERADMIN_E2E_EMAIL` | No | `superadmin@certypass.com` |
| `DEMO_ADMIN_E2E_EMAIL` | No | `demo@certypass.com` |
| `DEMO_ORG_ID` | No | id de la organización `demo` en producción |

`DATABASE_URL`, `IBS_TOKEN` e `IBS_ISBE_APPLICATION_ID` se leen de
`.env.local` automáticamente (el spec lo parsea a mano, igual que
`scripts/reset-password.mjs`), no hace falta exportarlos aparte.

### Por qué no está en CI

`deploy.yml` solo ejecuta `vitest` como gate de despliegue. Esta suite nunca
formó parte de ese gate (tampoco lo hacía `complete-state-certification.spec.ts`)
porque escribe contra producción y depende de un servicio externo de pago —
es una suite de verificación manual/nightly, no un gate de PR.

### No mockear la certificación

Igual que el resto de esta suite, la certificación ISBE se verifica **real**:
se lee el `IsbeCertification` directamente de Postgres y se confirma el hash
contra la API pública de ISBE. Si algún día se añade una vista en la UI que
muestre el estado de la certificación ISBE, este test debería empezar a
verificarlo también ahí, no solo por BD.

### El item creado NO se borra — es a propósito

El segundo test crea un item real (`e2e-isbe-<timestamp>`) en la organización
demo y lo deja ahí deliberadamente, para poder inspeccionarlo a mano después
(en el dashboard, y su certificación en ISBE). Al final del test se imprime
por consola y se adjunta al reporte HTML un bloque `isbe-result` con:

```json
{
  "itemId": "e2e-isbe-1786...",
  "itemUrl": "http://localhost:3000/dashboard/items/e2e-isbe-1786...",
  "hash": "0x...",
  "executionId": 38,
  "txHash": "0x...",
  "status": "sent",
  "isbeCheckUrl": "https://api.icommunitylabs.com/applications/6/isbe/hashtimestamp/0x..."
}
```

Para verlo:

```bash
npx playwright show-report
```

y abrir el test, pestaña "Attachments" → `isbe-result`.

**Ojo con lo que implica no borrar**: cada ejecución completa deja un item de
más en la organización demo y, más importante, deja una transacción **real**
en ISBE que no se puede deshacer (ver aviso de coste/cuota más arriba). No es
gratis correrlo a menudo. Cuando quieras limpiar los items de prueba
acumulados:

```bash
DB_URL=$(grep "^DATABASE_URL" .env.local | sed 's/^DATABASE_URL="//;s/"$//')
DATABASE_URL="$DB_URL" node -e '
const { PrismaClient } = require("./src/generated/prisma");
const prisma = new PrismaClient();
(async () => {
  const res = await prisma.item.deleteMany({ where: { id: { startsWith: "e2e-isbe-" } } });
  console.log("Borrados:", res.count);
  await prisma.$disconnect();
})();
'
```

Borrar el item hace cascade sobre su `IsbeCertification` local (por la BD),
pero **no** deshace la transacción ya enviada a ISBE — solo deja de haber
rastro de ella en nuestra base de datos.